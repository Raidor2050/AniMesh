# AniMesh Systems Architecture

> This doc supersedes the earlier aspirational architecture (which described a Three.js
> build). The shipped system is **raw WebGL2**. Data flow below is the contract.

## 1. Module Graph & Data Flow

```
              ┌─────────── AudioEngine (audio/AudioEngine.ts) ───────────┐
              │  analysers → features → beat/clock → snapshot           │
              └──────────────────────┬───────────────────────────────────┘
                                     │ AudioSnapshot (mutable, 1/frame)
                                     ▼
        ┌──────────── FeatureGraph (mappings/featureGraph.ts) ───────────┐
        │  signals (raw+derived) → macros → routes → param fan-out       │
        └──────────────────────┬─────────────────────────────────────────┘
                               │ { float Uniforms } (uBass… uMacroEnergy…)
                               ▼
        ┌───────────────── Renderer (renderer/Renderer.ts) ──────────────┐
        │  scene→FBO→bloom(Kawase)→composite→screen  (+ GPU timer)      │
        └───────▲──────────────────────────────▲─────────────────────────┘
                │ ShaderProgram (compiled, cached) │ per-frame uniforms
        ┌───────┴──────────────┐        ┌───────────┴──────────────────┐
        │  core/WebGL.ts       │        │ shaders/ (catalog + chunks) │
        └──────────────────────┘        └──────────────────────────────┘

   components/hooks (React) ──subscribe──▶ state/ (zustand, low-freq only)
   Renderer/audio: ZERO React deps. React NEVER calls GL.
```

**Dependency rule**: `core/`, `audio/`, `mappings/`, `renderer/`, `shaders/` have zero
upward deps. `state/` is framework-agnostic. Only `components/`/`hooks/` import React.

## 2. Frame Loop (single rAF)

```
tick():
 1. snapshot = AudioEngine.analyze()            // <1ms — mutates AudioSnapshot
 2. graph.update(snapshot)                      // <0.5ms — writes uniform-ready map
 3. gpuTime = timer.poll(); adaptiveQuality.update(scale)   // <0.1ms
 4. build uniform map (uTime, uResolution, graphOut, params) // <0.5ms
 5. scene pass → RGBA16F FBO                     // the shader work (budget battery)
 6. bloom (Kawase, tier-gated) → composite → screen   // grading + NaN guard
 7. low-freq stats → ref-DOM (FPS/1% lows at ~4Hz)
```

The `elapsed` clock freezes while a crossfade is active (duration from `uTransitionProgress`
= 0→1), then resumes. During `webglcontextlost` the clock is paused, never trusted.

## 3. Uniform Contract (UNIFORM_HEADER)

All fragment shaders compile against this exact header (version 300 es):

```glsl
uniform vec2  uResolution; uniform float uTime; uniform vec2 uMouse;
uniform float uBass, uMid, uTreble, uVolume, uBeat, uBeatPhase, uBPM;
uniform float uSub, uLowMid, uHighMid, uSpectralCentroid;
uniform float speed, intensity, distortion, scale, brightness, hueShift, saturation;
// + macro-derived (added by composite, declared once here to stay known to shaders):
// uMacroEnergy uMacroComplexity uMacroMotion uMacroMusicality uMacroAtmosphere
```

Adapter rule: the graph emits exactly these names → renderer sets them without guessing.
New universal uniforms are always added to UNIFORM_HEADER first (D19/D32 lint check).

## 4. Shader Composition

```
createShader(id) =
  UNIFORM_HEADER +
  COMMON_NOISE (hash/noise/fbm/palette) +
  resolveChunks(body)            // expands {{chunk:name}} from chunks.ts registry
  + wired body GLSL (per shader)
```

`catalog.ts` holds metadata{id,name,category,tier,params,routes}; bodies are lazy-loaded
per category (`import.meta.glob`). Program cache: `Map<fragmentSourceHash, WebGLProgram>`,
filled on idle; switch = cache hit, else compile atomically (keep old until new links).

## 5. State / UI Boundary

- **High-frequency** (bands, FPS, GPU time, graph output): plain mutable objects, ref-DOM
  writes only. Never in zustand.
- **Low-frequency** (active shader, tier, panel open, source type): zustand + selectors.
- Crossfade orchestration lives in the renderer; React only requests via store action.

## 6. Persistence (localStorage, all guarded)

- favorites/recent (`safeJSONParse`), last session (shader+params), UI prefs, macro profile,
  custom presets. Every read is try/catch guarded — corruption must never blank the app (D-invariant).

## 7. Error Strategy

- ErrorBoundary (root + canvas). Panel failures are local, canvas failures fall to
  FALLBACK…FLAG rendered scene + console diagnostic, never a blank screen.
- Context loss: `preventDefault` → toast → rebuild program cache + FBOs on `restored`.
- Shader compile error: show overlay with line map (chunk-expansion aware), keep old program.

## 8. Golden Rules (regression guards)

1. React never triggers a GL call.
2. AudioSnapshot is the only audio contract.
3. Never produce a framebuffer with NaN/Inf (composite guard).
4. Exceptions during module load/render never blank the app.
5. New GLSL always conforms to UNIFORM_HEADER; otherwise lint fails.