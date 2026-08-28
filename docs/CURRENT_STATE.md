# Current State

Snapshot taken at the start of the production readiness program (Phase 0 inspection,
before Phase 3 implementation). Use this as the baseline for audits and diffs.

## Stack

- Vite 6 + TypeScript, React 18.3.1, zustand 5.0.0, motion 11.0.0, react-router-dom 7.0.0 (hash routing).
- **Raw WebGL2** — no three.js, no regl. Single fullscreen-quad draw per pass. Target ~96%+ device support.
- Deployed to GitHub Pages (`https://raidor2050.github.io/AniMesh/`), `base: '/AniMesh/'`.

## Source Layout (src/)

```
audio/          AudioEngine.ts (~720 lines, the engine), audioSingleton.ts
cli/            GrowError etc. (CLI/console tooling)
components/     19 files — App shell, panels, Browser, Immersive, Transport, etc.
core/           WebGL.ts (context + shader compile + program helpers)
hooks/          useAudio, useHashRoute
mappings/       AudioMappingEngine.ts — naive per-mapping signal*amount bridge
renderer/       Renderer.ts (full pipeline), ShaderPreviewManager.ts
shaders/        library.ts (3480-line monolith), milkdrop-generated.ts (4837),
                reactive-collection.ts (247), wireParams.ts (131), types.ts
state/          stores.ts (zustand), shaderActions.ts (shared select/cycle/random)
ui/             tokens.ts, global.css
utils/          math.ts, types.ts
```

## Audio Engine (current)

- `AnalyserNode` fftSize=2048, 6 logarithmic bands: sub(20–60) bass(60–200) lowMid(200–600)
  mid(600–2000) highMid(2000–6000) treble(6000–16000).
- ADSR attack/release per band; energy + spectral-flux beat detection; beat phase.
- BPM: median interval from beat detection + tap regression + manual mode.
- Sources: mic (`getUserMedia` w/ processing disabled), file, demo synth, system audio
  (`getDisplayMedia`, Chrome-only). Demo fallback on permission failure.
- Base cues already extended: uSub, uLowMid, uHighMid, uSpectralCentroid, uBPM.

### Known debt

- Debug `console.log` block fires every 120 frames while system audio is active
  (`AudioEngine.ts` ~L576-597) — must be removed.
- No onset detection separate from beat; no real-time BPM locking/octave correction.
- Single energy beat detect can double-trip or drift from the musical grid.

## Shader System (current)

- `UNIFORM_HEADER` (version 300 es + all uniforms: uTime uResolution uMouse uBass uMid
  uTreble uVolume uBeat uBeatPhase uBPM uSub uLowMid uHighMid uSpectralCentroid,
  params speed/intensity/distortion/scale/brightness/hueShift/saturation) + `COMMON_NOISE`
  (hash, noise, fbm, palette) + wired body.
- `createShader` composes header + noise + body from `wireParams`-style GLSL strings.
- `SHADER_LIBRARY` = 381 shaders across 11 categories (library.ts + milkdrop-generated.ts + reactive-collection.ts).
- **Debt**: monolith file blocks tree-shaking; every shader ships on first load. No chunk
  grammar (`{{chunk:...}}`) yet — composition is full-source concatenation. Baked
  universal audio mappings hardcoded inside `library.ts` need de-baking into a profile.

## Renderer (current)

- Scene → RGBA16F FBO A → bloom (single 5-tap pass) → FBO B → composite
  (zoom, hue/sat/brightness, beat flash, NaN/Inf guard) → screen.
- `getActiveUniform` cache per program; DPR caps (2.0 desktop / 1.5 mobile); invalidate-frame on param change; offline FALLBACK_FRAG used as an emergency-first-type safety net.
- **Debt**: no program cache across shader switches (recompile hitches), no context-loss
  recovery, no GPU timers, no adaptive resolution ladder, bloom is a single pass (5-tap
  is blurry at >half-res), no crossfade transitions.

## State & UI (current)

- Zustand stores (ui, shader/params, favorites/recent) with cajoled guarded localStorage
  (`safeJSONParse`). UI: title/boot, source select, shader browser grid, EQ/mapping panel,
  parameter sliders, immersive mode w/ PREV/RANDOM/NEXT/EXIT touch targets, mobile
  optimizations (safe-area, touch-action, responsive carousel).
- **Debt**: no ErrorBoundary (a render crash blanks the app), no a11y announcer, raw
  slider soup for "mapping" (no macro knobs), no keyboard variant, previews are live-only.

## Config

- `vite.config.ts`: `base '/AniMesh/'` (or `/` on VERCEL), manualChunks vendor/state/motion,
  target es2020, esbuild minify, dev port 3000.
- Scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `lint`.
- No tests, no CI, no GLSL lint. Build gates green at baseline (409 modules).

## Git

- `main` clean at `734ecfc`. History: mobile/immersive feature → safeJSONParse guard →
  revert of an over-broad audio-reactivity layer that caused a desktop blank-screen
  regression (root cause: unguarded `JSON.parse` at module load in `stores.ts`).
- `gh-pages` branch holds the live `dist/` build; deployed manually via temp worktree.

## The Invariant That Matters

Several regressions reduced to the same failure class: **an exception during module load
or render must never blank the whole app.** Falling back to a demo shader/audio and
recovering gracefully is cheaper than any feature. All new work preserves that.