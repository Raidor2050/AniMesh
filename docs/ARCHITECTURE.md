# AniMesh Systems Architecture

## 1. Module Structure & Dependency Graph

```
src/
  core/                 — WebGL2 context, shader compiler, FBO manager, GPU timer
  core/gl-context.ts    — WebGL2RenderingContext lifecycle, context loss recovery
  core/shader-compiler.ts — Compile, link, validate, error reporting
  core/fbo-pool.ts      — Framebuffer object pool (ping-pong, MRT)
  core/uniforms.ts      — Uniform location cache, batch setter
  core/gpu-timer.ts     — EXT_disjoint_timer_query wrapper

  audio/                — Audio engine (zero React dependency)
  audio/context.ts      — AudioContext lifecycle, source routing
  audio/sources.ts      — Mic, file, demo oscillator, system audio (Chrome)
  audio/analyzer.ts     — FFT extraction, band splitting, smoothing
  audio/beat.ts         — Energy-based beat detection, BPM clock
  audio/envelope.ts     — Per-band ADSR smoothing envelopes

  shaders/              — Shader definitions & composition
  shaders/types.ts      — ShaderDefinition, ShaderParam, ShaderMeta
  shaders/registry.ts   — Global shader catalog (registration + lookup)
  shaders/chunks.ts     — GLSL chunk registry (name → source string)
  shaders/compose.ts    — String-template composer (inject chunks into template)
  shaders/transitions.ts— GL Transitions spec adapter (from/to/progress)

  renderer/             — Render loop & post-processing
  renderer/loop.ts      — rAF loop, frame budget enforcement
  renderer/quad.ts      — Fullscreen quad VAO (single shared)
  renderer/pipeline.ts  — Scene → post-fx chain orchestration
  renderer/quality.ts   — Adaptive resolution, quality tier auto-switch
  renderer/postfx.ts    — Individual post-processing pass definitions

  visuals/              — GPU-driven visual systems
  visuals/layers.ts     — Multi-layer compositing (additive, screen, overlay)
  visuals/particles.ts  — FBO particle system (Codrops pattern)
  visuals/noise-textures.ts — Precomputed noise LUTs (Perlin, Simplex, Voronoi)

  generator/            — Shader creator engine
  generator/primitives.ts — SDF primitives, noise functions, operators
  generator/templates.ts  — Base templates (2D fragment, 3D raymarch)
  generator/preview.ts    — Live preview compilation during edit

  mappings/             — Audio → visual bridge
  mappings/table.ts     — Mapping definitions (bass→distortion, etc.)
  mappings/interpolate.ts — Log scaling, exponential smoothing, beat-sync timing

  presets/              — Save/load system
  presets/definitions.ts — Preset schema, built-in presets
  presets/storage.ts    — localStorage + JSON serialization
  presets/bank.ts       — Preset bank manager (import/export)

  components/           — React UI (presentation only, no shader logic)
  components/App.tsx    — Root shell, hash router
  components/Canvas.tsx — WebGL canvas mount (imperative, ref-based)
  components/panels/    — ShaderBrowser, Parameters, Transport, Creator
  components/overlays/  — CommandPalette, ErrorOverlay, BootSequence
  components/perf/      — PerformanceOverlay (2D canvas, ref-based)

  hooks/                — React ↔ state bridge
  hooks/use-store.ts    — Zustand selectors with shallow equality
  hooks/use-audio.ts    — Audio state subscription (low-frequency only)
  hooks/use-shader.ts   — Shader selection/params subscription
  hooks/use-render.ts   — Connect canvas ref to render loop

  state/                — Zustand stores (framework-agnostic)
  state/shader-store.ts — Active shader, params, compilation status
  state/audio-store.ts  — Source type, volume, bands, beat state
  state/ui-store.ts     — Panel visibility, mode, active overlays
  state/preset-store.ts — Current preset, favorites, recent
  state/perf-store.ts   — FPS, GPU time, quality tier

  utils/                — Pure utilities
  utils/math.ts         — clamp, lerp, map, dbToLinear, freqToBin
  utils/constants.ts    — Color palette, default params, budget thresholds
  utils/url.ts          — Hash router helpers, query param parsing

  data/                 — Static data
  data/shaders/         — Shader definition JSONs + embedded GLSL
  data/categories.ts    — Shader category tree
  data/default-mappings.ts — Default audio→visual mapping table
```

### Dependency Direction

```
components → hooks → state
                         ↓
              audio ← renderer → core
                ↓         ↓        ↓
             mappings  visuals  shaders
                         ↑
                      generator
```

**Rule**: Dependencies flow downward. `core/` and `audio/` have zero upward deps. `renderer/` depends on `core/`, `audio/` (data only), `shaders/`, `visuals/`. `components/` and `hooks/` are leaf nodes — they subscribe to `state/` but never import from `core/`, `audio/`, or `renderer/`. The render loop is entirely imperative; React never triggers a GL draw call.

---

## 2. Shader Engine Architecture

### ShaderDefinition

```ts
type ShaderCategory = 'generative' | 'raymarch' | 'particle' | 'transition' | 'distortion';

type ShaderParam = {
  id: string;                          // uniform name, e.g. "uScale"
  label: string;                       // Display name
  type: 'float' | 'int' | 'vec2' | 'vec3' | 'vec4' | 'color' | 'bool';
  default: number | [number, number, number] | boolean;
  min?: number;
  max?: number;
  step?: number;
  group?: string;                      // UI grouping, e.g. "Geometry"
};

type ShaderMeta = {
  id: string;                          // Unique, URL-safe, e.g. "gen-voronoi-fractal"
  name: string;                        // Display name
  category: ShaderCategory;
  author: string;
  description: string;
  tags: string[];
  thumbnail?: string;                  // Data URL or built-in asset
  audioReactive: boolean;             // Does this shader use audio uniforms?
  qualityTier: 'low' | 'medium' | 'high'; // Minimum tier to run
};

type ShaderDefinition = {
  meta: ShaderMeta;
  params: ShaderParam[];
  vertex: string;                      // GLSL source (or chunk references)
  fragment: string;                    // GLSL source with chunk placeholders
  chunks?: string[];                   // Required chunk names for composition
  transition?: {                       // GL Transitions contract
    mode: 'from' | 'to';
    fromId?: string;
  };
};
```

### Chunk Registry

```ts
// shaders/chunks.ts
type ChunkSource = string; // Raw GLSL

const chunkRegistry = new Map<string, ChunkSource>();

// Register a chunk
function registerChunk(name: string, source: ChunkSource): void;

// Retrieve with dependency resolution
function resolveChunk(name: string, visited?: Set<string>): string;

// Built-in chunks (~12):
// "noise-2d", "noise-3d", "simplex", "voronoi"
// "sdf-primitives", "sdf-ops", "domain-warp", "fractals"
// "materials", "lighting", "raymarching"
// "postfx-bloom", "postfx-ca", "postfx-crt"
// "audio-reactive" — contains uBass, uMid, uHigh, uBeat, uVolume, uBeatPhase declarations + helpers
```

### Composition Pipeline

```ts
// shaders/compose.ts
function composeShader(def: ShaderDefinition): { vertex: string; fragment: string } {
  // 1. Start with template (vertex or fragment)
  let source = def.fragment;

  // 2. Replace chunk placeholders: {{chunk:noise-2d}} → resolved GLSL
  source = source.replace(/\{\{chunk:(\w[\w-]*)\}\}/g, (_, name) => resolveChunk(name));

  // 3. Inject uniform declarations for required chunks
  const uniforms = extractUniforms(source);
  source = injectUniformBlock(source, uniforms);

  // 4. Inject param uniforms from ShaderParam definitions
  source = injectParamUniforms(source, def.params);

  return { vertex: def.vertex, fragment: source };
}
```

### Shader Compiler & Hot-Swap

```ts
// core/shader-compiler.ts
type CompileResult =
  | { ok: true; program: WebGLProgram; warnings: string[] }
  | { ok: false; error: string; line: number; column: number };

function compileProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string,
): CompileResult;

// Hot-swap: compile new, atomic swap on success
function hotSwap(
  gl: WebGL2RenderingContext,
  current: WebGLProgram | null,
  vertSrc: string,
  fragSrc: string,
): CompileResult {
  const result = compileProgram(gl, vertSrc, fragSrc);
  if (result.ok) {
    if (current) gl.deleteProgram(current);
    return result; // Caller assigns new program atomically
  }
  return result; // Caller shows error overlay, keeps old program
}
```

Error reporting parses `VALIDATE_STATUS` output to extract line numbers, maps back through chunk composition to original source positions.

### Uniform Management

```ts
// core/uniforms.ts
type UniformLocationCache = Map<string, WebGLUniformLocation>;

function cacheUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): UniformLocationCache;
function setUniforms(gl: WebGL2RenderingContext, cache: UniformLocationCache, values: Record<string, UniformValue>): void;
```

### Audio → Uniform Data Flow

```
AudioEngine.analyze()
  → AudioData { bands: Float32Array(6), beat: boolean, volume: number, beatPhase: number }
  → RenderLoop reads AudioData directly (no event, no store)
  → RenderLoop.setUniforms({
      uBass:      audioData.bands[0],
      uLowMid:    audioData.bands[1],
      uMid:       audioData.bands[2],
      uHighMid:   audioData.bands[3],
      uTreble:    audioData.bands[4],
      uSub:       audioData.bands[5],
      uBeat:      audioData.beat ? 1.0 : 0.0,
      uVolume:    audioData.volume,
      uBeatPhase: audioData.beatPhase,
      uTime:      elapsed,
      uResolution: [width, height],
      ...shaderParamUniforms,    // user-tweaked params
    })
```

The audio-reactive GLSL chunk provides helper functions:
```glsl
// chunks/audio-reactive.glsl
uniform float uBass, uLowMid, uMid, uHighMid, uTreble, uSub;
uniform float uBeat, uVolume, uBeatPhase;
uniform float uTime;
uniform vec2 uResolution;

float beatPulse(float decay) { return uBeat * exp(-decay * uBeatPhase); }
float bassEnergy() { return uBass * 0.5 + uSub * 0.5; }
float energy() { return (uBass + uLowMid + uMid + uHighMid + uTreble + uSub) / 6.0; }
```

---

## 3. Audio Engine Architecture

### AudioContext Lifecycle

```ts
// audio/context.ts
class AudioEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | OscillatorNode | null = null;
  private analyser: AnalyserNode;
  private gainNode: GainNode;

  private bandData: Float32Array(6);     // Pre-allocated
  private freqData: Uint8Array;           // Pre-allocated, fftSize/2
  private timeData: Uint8Array;           // Pre-allocated, fftSize

  // Snapshot written once per frame, read by render loop
  private snapshot: AudioSnapshot;
  private readonly SMOOTHING = {
    attack: [0.15, 0.12, 0.10, 0.08, 0.06, 0.05],  // Per-band, seconds
    release: [0.50, 0.45, 0.40, 0.35, 0.30, 0.25],  // Per-band, seconds
  };

  async init(): Promise<void>;
  async switchSource(type: SourceType, config?: SourceConfig): Promise<void>;
  analyze(): AudioSnapshot;  // Called once per frame by RenderLoop
  dispose(): void;
}
```

### Source Switching

```ts
type SourceType = 'mic' | 'file' | 'demo' | 'system';
type SourceConfig =
  | { type: 'file'; file: File }
  | { type: 'demo'; waveform: 'sine' | 'sawtooth' | 'square'; frequency: number }
  | { type: 'system' }; // Chrome getDisplayMedia

// Disconnect previous → connect new → resume context
// Always route through GainNode → AnalyserNode → destination
```

### Analysis Pipeline

```
SourceNode → GainNode → AnalyserNode → destination (silent for file/system)
                                      ↓
                              getByteFrequencyData(freqData)
                              getByteTimeData(timeData)
                                      ↓
                              ┌─────────────────────┐
                              │ Band Extraction      │
                              │ Map FFT bins to 6    │
                              │ frequency bands using │
                              │ logarithmic spacing   │
                              └─────────┬───────────┘
                                        ↓
                              ┌─────────────────────┐
                              │ Per-Band Smoothing   │
                              │ Exponential smoothing│
                              │ attack/release env    │
                              └─────────┬───────────┘
                                        ↓
                              ┌─────────────────────┐
                              │ Beat Detection       │
                              │ Energy = sum(bands)  │
                              │ Adaptive threshold   │
                              │ Min interval: 200ms  │
                              └─────────┬───────────┘
                                        ↓
                              AudioSnapshot { bands, beat, volume, beatPhase }
```

### AudioSnapshot (Frame-Read Object)

```ts
type AudioSnapshot = {
  bands: Float32Array;     // 6 elements, 0.0–1.0 normalized
  volume: number;          // Overall RMS, 0.0–1.0
  beat: boolean;           // True only on beat frame
  beatPhase: number;       // 0.0–1.0, resets on beat, used for decay curves
  bpm: number;             // Estimated BPM (0 if silent)
  freqData: Uint8Array;    // Full FFT for texture upload (optional)
};
```

### Performance

- `analyser.getByteFrequencyData()` is the only expensive call (~0.3ms).
- Pre-allocated typed arrays; zero GC during playback.
- `fftSize=2048` → 1024 bins, `smoothingTimeConstant=0.8`.
- Beat detection is O(1) — just compare current energy to adaptive threshold.
- Total audio processing budget: <1ms per frame.

---

## 4. State Management

### Store Design

```ts
// state/shader-store.ts
type ShaderState = {
  activeId: string | null;           // Current shader ID
  params: Record<string, any>;       // Current shader parameter values
  compilationStatus: 'idle' | 'compiling' | 'success' | 'error';
  compilationError: string | null;   // Error message with line numbers
  favorites: Set<string>;            // Favorited shader IDs
  recent: string[];                  // Last 20 shader IDs (LRU)
  actions: {
    selectShader: (id: string) => void;
    setParam: (id: string, value: any) => void;
    resetParams: () => void;
    toggleFavorite: (id: string) => void;
  };
};

// state/audio-store.ts
type AudioState = {
  sourceType: SourceType;
  isPlaying: boolean;
  volume: number;                    // Master volume (0–1)
  muted: boolean;
  // High-frequency data — NOT in React state, stored in a ref-accessible buffer
  // See "High-Frequency Data" section below
  actions: {
    setSource: (type: SourceType, config?: SourceConfig) => void;
    setVolume: (v: number) => void;
    toggleMute: () => void;
  };
};

// state/ui-store.ts
type UIState = {
  mode: 'edit' | 'perform';         // Edit mode: panels visible. Perform: HUD only
  activePanel: 'shader' | 'params' | null;
  overlays: {
    commandPalette: boolean;
    bootSequence: boolean;
    errorOverlay: boolean;
  };
  immersive: boolean;                // Full takeover, proximity-reveal
  actions: {
    setMode: (mode: 'edit' | 'perform') => void;
    togglePanel: (panel: string) => void;
    toggleOverlay: (overlay: string) => void;
  };
};

// state/preset-store.ts
type PresetState = {
  currentPresetId: string | null;
  presets: Preset[];                 // User-defined presets
  actions: {
    save: (name: string) => void;
    load: (id: string) => void;
    delete: (id: string) => void;
    exportAll: () => string;         // JSON blob
    importAll: (json: string) => void;
  };
};

// state/perf-store.ts
type PerfState = {
  fps: number;
  gpuTime: number | null;           // ms, from GPU timer
  qualityTier: 'low' | 'medium' | 'high' | 'ultra';
  frameTimeHistory: Float32Array;    // Circular buffer, 120 entries
  actions: {
    update: (fps: number, gpuTime: number | null) => void;
    setTier: (tier: string) => void;
  };
};
```

### High-Frequency Data Avoids React

Audio bands, FPS, and beat state are written 60×/sec. They **never** go into Zustand stores that trigger React renders. Instead:

```ts
// A plain mutable object — no Zustand, no React
class AudioDataBridge {
  readonly snapshot: AudioSnapshot = {
    bands: new Float32Array(6),
    volume: 0,
    beat: false,
    beatPhase: 0,
    bpm: 0,
    freqData: new Uint8Array(1024),
  };

  // Called by AudioEngine.analyze() once per frame
  update(source: AudioSnapshot): void {
    this.snapshot.bands.set(source.bands);
    this.snapshot.volume = source.volume;
    this.snapshot.beat = source.beat;
    this.snapshot.beatPhase = source.beatPhase;
    this.snapshot.bpm = source.bpm;
  }
}

// RenderLoop reads from this bridge directly — zero overhead
// React components that need audio data (e.g., visualizer bars in transport panel)
// read via a ref to the bridge, updating DOM directly, not via state
```

### Persistence

- **Favorites**: `localStorage.setItem('animesh:favorites', JSON.stringify([...]))`
- **User presets**: `localStorage.setItem('animesh:presets', JSON.stringify(...))`
- **Last shader + params**: `localStorage.setItem('animesh:session', JSON.stringify({...}))`
- **No persistence for**: FPS, quality tier (auto-detected per session), audio source (defaults to demo)

---

## 5. Render Loop Architecture

### Loop Structure

```ts
// renderer/loop.ts
class RenderLoop {
  private gl: WebGL2RenderingContext;
  private quad: FullscreenQuad;              // Single shared VAO
  private audioBridge: AudioDataBridge;
  private gpuTimer: GPUTimer;
  private adaptiveQuality: AdaptiveQuality;
  private perfStore: PerfState;

  private elapsed = 0;
  private frameCount = 0;
  private lastFpsTime = 0;
  private currentFps = 0;

  // Active render state — mutated imperatively, never via React
  private activeProgram: WebGLProgram | null = null;
  private uniformCache: UniformLocationCache = new Map();
  private postfxChain: PostfxPass[] = [];

  start(): void { requestAnimationFrame(this.tick); }
  stop(): void { this.running = false; }

  private tick = (timestamp: number) => {
    if (!this.running) return;
    requestAnimationFrame(this.tick);

    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1); // Cap at 100ms
    this.lastTimestamp = timestamp;
    this.elapsed += dt;

    // ── Phase 1: Audio analysis (<1ms) ──
    const snapshot = this.audioEngine.analyze();
    this.audioBridge.update(snapshot);

    // ── Phase 2: Quality check (<0.1ms) ──
    const gpuTime = this.gpuTimer.poll(this.gl);
    this.adaptiveQuality.update(dt, gpuTime);
    this.adaptiveQuality.apply(this.gl, this.canvasSize);

    // ── Phase 3: Uniform updates (<0.5ms) ──
    const res = this.adaptiveQuality.getScaledSize();
    const uniformValues = {
      uTime: this.elapsed,
      uResolution: [res.width, res.height],
      uBass: snapshot.bands[0],
      uLowMid: snapshot.bands[1],
      uMid: snapshot.bands[2],
      uHighMid: snapshot.bands[3],
      uTreble: snapshot.bands[4],
      uSub: snapshot.bands[5],
      uBeat: snapshot.beat ? 1.0 : 0.0,
      uVolume: snapshot.volume,
      uBeatPhase: snapshot.beatPhase,
      ...this.getParamUniforms(),  // User-tweaked shader params
    };

    // ── Phase 4: Scene pass (4-12ms) ──
    this.gpuTimer.begin(this.gl);
    this.renderScenePass(uniformValues);

    // ── Phase 5: Post-processing (2-6ms) ──
    this.renderPostfxChain();

    this.gpuTimer.end(this.gl);

    // ── Phase 6: Stats (0.1ms) ──
    this.updateFps(timestamp);
    this.perfStore.update(this.currentFps, gpuTime);
  };

  private renderScenePass(uniforms: Record<string, UniformValue>): void {
    // Bind scene FBO (if postfx active) or default framebuffer
    const target = this.postfxChain.length > 0 ? this.sceneFbo : null;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target);
    this.gl.viewport(0, 0, ...this.adaptiveQuality.getScaledSize());
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.useProgram(this.activeProgram);
    setUniforms(this.gl, this.uniformCache, uniforms);
    this.quad.draw(); // Single draw call
  }

  private renderPostfxChain(): void {
    for (const pass of this.postfxChain) {
      pass.bind(this.gl);          // Bind FBO + set previous texture
      this.gl.useProgram(pass.program);
      setUniforms(this.gl, pass.uniformCache, {
        uTexture: pass.inputTexture,
        uResolution: this.adaptiveQuality.getScaledSize(),
        ...pass.params,
      });
      this.quad.draw();
    }
    // Final pass renders to screen (framebuffer = null)
    this.postfxChain[this.postfxChain.length - 1]?.drawToScreen(this.gl);
  }
}
```

### Post-Processing Pipeline

```
Scene FBO → Bright Extract → Horizontal Blur → Vertical Blur
          → Composite (additive blend with scene) 
          → Chromatic Aberration → Vignette → Screen
```

Each postfx pass is a `{ program, uniforms, inputTexture, outputFbo }` tuple. A `PostfxPass` class manages the FBO and texture bindings. Quality tier controls how many passes run:

| Tier | Bloom | CA | Vignette | Total Passes |
|------|-------|----|----------|-------------- |
| LOW | off | off | on | 1 |
| MEDIUM | half-res | off | on | 2 |
| HIGH | full-res | on | on | 3 |
| ULTRA | full-res+HDR | on | on | 4 |

### Adaptive Quality

```ts
class AdaptiveQuality {
  private scale = 1.0;           // 0.25 – 1.0
  private tier: QualityTier = 'high';
  private scaleUpCounter = 0;
  private readonly FRAME_BUDGET = 14; // ms
  private readonly SCALE_UP_THRESHOLD = 60;

  update(dt: number, gpuTime: number | null): void;
  apply(gl: WebGL2RenderingContext, canvasSize: Size): void;
  getScaledSize(): Size;
}
```

Logic: If frame time > 14ms → scale down proportionally. If frame time < 12ms for 60 consecutive frames → scale up by 2%. Quality tier is derived from scale (0.25–0.39=LOW, 0.4–0.64=MEDIUM, 0.65–0.84=HIGH, 0.85–1.0=ULTRA).

---

## 6. Shader Transition System

Adapted from the GL Transitions spec:

```ts
// shaders/transitions.ts
type TransitionDef = {
  id: string;
  name: string;
  glsl: string;           // Fragment shader source
  defaultParams?: Record<string, number>;
};

// Contract: each transition shader receives these uniforms
// uniform sampler2D from;     // outgoing shader texture
// uniform sampler2D to;       // incoming shader texture
// uniform float progress;     // 0.0 → 1.0
// uniform float ratio;        // aspect ratio
// uniform vec2 resolution;    // viewport size
```

During transition: both shaders render to separate FBOs. Transition shader reads both textures and blends based on `progress`. User controls progress via timeline scrubber or beat-synchronized auto-advance.

---

## 7. Build & Deployment

### Vite Configuration

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/AniMesh/',
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'zustand', 'motion'],
        },
      },
    },
  },
  define: {
    'import.meta.env.SHADER_VERSION': JSON.stringify(Date.now()), // Cache bust for shader changes
  },
});
```

### Code Splitting

```
Initial bundle (<150KB gzipped):
  - Core app shell, hash router
  - WebGL2 context + shader compiler
  - Audio engine
  - Render loop
  - Zustand stores
  - UI components
  - First 4 shaders (inline)

Lazy-loaded chunks:
  - shaders/generative/    (~8KB gz)
  - shaders/raymarch/      (~12KB gz)
  - shaders/particle/      (~6KB gz)
  - shaders/transition/    (~4KB gz)
  - generator/             (~10KB gz)
  - presets/bank/          (~3KB gz)
```

Lazy loading uses dynamic `import()`:

```ts
// Triggered when user navigates to shader category
const generativeShaders = await import('./shaders/generative');
```

### Shader as Inline Strings

GLSL files are inlined at build time via `vite-plugin-glsl` or raw imports (`import frag from './shaders/gen/voronoi.frag?raw'`). No runtime shader fetching — everything is in the JS bundle. This eliminates a network round-trip and simplifies the error path.

### Hash Router

```tsx
// components/App.tsx
import { HashRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
      <Canvas />
      <Routes>
        <Route path="/" element={<MainLab />} />
        <Route path="/creator" element={<CreatorView />} />
        <Route path="/gallery" element={<GalleryView />} />
      </Routes>
    </HashRouter>
  );
}
```

### GitHub Pages Deployment

- `base: '/AniMesh/'` in Vite config ensures asset paths are correct
- No server-side config needed; hash routing handles all paths
- Assets get content hashes for immutable caching
- `index.html` gets `no-cache` headers (handled by default on GH Pages)

---

## Key Invariants

1. **React never triggers GL draw calls.** Canvas is imperative. React only manages UI overlays.
2. **Audio data never enters Zustand.** `AudioDataBridge` is a plain object mutated once per frame, read by render loop and ref-based DOM updates.
3. **Shader hot-swap is atomic.** New program compiles fully before replacing old. Old is deleted only after successful swap. Error overlay shows compile errors without crashing.
4. **Frame budget is enforced, not measured.** If a phase exceeds its budget, quality degrades next frame. No frame skipping.
5. **All GPU resources are pooled or disposed.** FBO pool reuses textures. Shader programs are deleted on swap. No monotonic growth in `gl.info.memory`.
6. **Zero allocations in render loop.** All typed arrays, vectors, and objects are pre-allocated. `Math` functions only.
