# AniMesh — Implementation Architecture

## Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Build | Vite 6 + TypeScript | Fast HMR, ESM, GitHub Pages compatible |
| UI Shell | React 18 | Component model for complex UI; strict ref-only for GL |
| State | Zustand | Minimal, no boilerplate, supports transient subscriptions |
| Animation | motion | Spring physics, layout animations, performant |
| Rendering | Raw WebGL2 | Maximum control, no framework overhead for VJ use-case |
| Audio | Web Audio API | Browser-native, AnalyserNode sufficient for visualization |
| Routing | Hash Router | GitHub Pages SPA support without server config |
| Fonts | JetBrains Mono + Inter | Monospace for data/code, sans for UI |

## Module Architecture

```
src/
├── core/              # WebGL context, shader compiler, FBO manager, timer
├── audio/             # AudioContext lifecycle, analysis pipeline, beat detection
├── shaders/           # ShaderDefinition registry, GLSL chunks, composition
├── renderer/          # Main render loop, post-processing chain, quality manager
├── visuals/           # Particle systems, layer compositing, transitions
├── generator/         # Shader creator engine, composable GLSL modules
├── mappings/          # Audio→visual mapping system, parameter binding
├── presets/           # Preset definitions, save/load, favorites
├── components/        # React UI components (panels, controls, overlays)
├── ui/                # Design tokens, animation presets, CSS utilities
├── hooks/             # React hooks bridging state to imperative systems
├── state/             # Zustand stores (ui, shader, audio, preset, creator)
├── utils/             # Math helpers, constants, type utilities
├── data/              # Shader library definitions, category metadata
└── glsl/              # Raw GLSL string modules (.ts files exporting strings)
    ├── chunks/        # Reusable GLSL functions (noise, sdf, warp, etc.)
    ├── shaders/       # Complete shader definitions
    └── postfx/        # Post-processing GLSL passes
```

## Dependency Graph (downward only)

```
utils ← core ← audio
              ← shaders ← renderer ← visuals
              ← mappings ← presets
              ← generator
state ← hooks ← components ← ui
```

## Key Type Definitions

```typescript
interface ShaderDefinition {
  id: string;
  name: string;
  category: ShaderCategory;
  description: string;
  tags: string[];
  fragment: string;         // GLSL fragment source
  vertex?: string;          // Optional custom vertex shader
  uniforms: UniformDef[];
  params: ParameterSchema[];
  defaults: Record<string, number>;
  audioMappings: AudioMapping[];
  performanceTier: 'low' | 'medium' | 'high' | 'ultra';
  transitions?: TransitionContract;
}

interface UniformDef {
  name: string;
  type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'sampler2D';
  default: number | number[];
  audioBindable: boolean;
}

interface ParameterSchema {
  id: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
  unit?: string;
  group?: string;
}

interface AudioMapping {
  signal: AudioSignal;      // 'bass' | 'mid' | 'treble' | 'beat' | 'volume' | etc.
  param: string;            // parameter ID
  amount: number;           // 0-1 scale
  curve: 'linear' | 'log' | 'exp';
}

type AudioSignal = 'sub' | 'bass' | 'lowMid' | 'mid' | 'highMid' | 'treble' | 'volume' | 'beat' | 'beatPhase';

interface AudioSnapshot {
  sub: number;
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  treble: number;
  volume: number;
  beat: boolean;
  beatPhase: number;
  beatIntensity: number;
  waveform: Float32Array;
  spectrum: Uint8Array;
  bpm: number;
  time: number;
}
```

## Render Loop (6-Phase Tick)

```
Phase 1: Audio Analysis    (<0.5ms)  — Read AnalyserNode, extract bands, detect beats
Phase 2: Quality Check     (<0.1ms)  — GPU timer query results, adjust resolution if needed
Phase 3: Uniform Update    (<0.2ms)  — Apply audio mappings, compute derived uniforms
Phase 4: Scene Pass        (<8ms)    — Render active shader to FBO
Phase 5: Post-FX Chain     (<3ms)    — Bloom → CA → Vignette → Screen
Phase 6: Stats Update      (<0.2ms)  — FPS counter, perf overlay (ref-based DOM)
                            ─────────
                            <12ms total (8ms headroom at 60fps)
```

## Audio Pipeline

```
AudioSource → AnalyserNode(fftSize=2048) → [Main Thread Read per rAF]
                          ↓
              Band Extraction (6 bands)
              Beat Detection (adaptive threshold)
              RMS Energy
                          ↓
              Per-Band Smoothing (ADSR envelopes)
                          ↓
              AudioSnapshot (mutable object, single writer)
                          ↓
         ┌────────────────┼────────────────┐
    AudioDataBridge   Zustand Store    Performance Overlay
    (ref-based DOM)   (UI-observable)  (ref-based DOM)
```

## Shader Composition System

GLSL chunks are composed via template strings:

```glsl
// Fragment shader template
precision highp float;

{{chunk:common_uniforms}}
{{chunk:noise}}
{{chunk:sdf_primitives}}
{{chunk:sdf_operations}}
{{chunk:domain_warp}}

// Shader-specific code
{{shader_body}}

// Audio-reactive utilities
{{chunk:audio_reactive}}
```

Chunks are resolved at shader-compile time. Audio uniform declarations are injected based on which audio signals the shader uses.

## Post-Processing Pipeline

```
Scene FBO → Bright Extract (threshold 0.8) → Kawase Blur (2 passes, quarter res)
         → Additive Composite → Chromatic Aberration → Vignette → Screen Quad
```

## State Management

| Store | Contents | Update Frequency |
|-------|----------|-----------------|
| uiStore | Panel states, immersive mode, boot status | On interaction |
| shaderStore | Active shader, param values, favorites | On interaction |
| audioStore | Source type, permission state, BPM | On interaction |
| presetStore | Saved presets, recent, favorites | On save/load |
| creatorStore | Wizard state, generated configs | On wizard step |

High-frequency data (audio, FPS, beat) bypasses Zustand entirely via AudioDataBridge — a plain mutable object read by ref-based DOM updates.

## Build Configuration

- Vite 6 with `vite-plugin-glsl` for GLSL string imports
- Manual chunk splitting: vendor (~150KB gz), shaders lazy-loaded per category
- Hash router for GitHub Pages
- Base path: `/AniMesh/` (repo name)
- Output: `dist/` directory, all static assets

## Performance Targets

| Metric | Target |
|--------|--------|
| FPS | 60 (desktop), 30 (mobile fallback) |
| Frame budget | <14ms |
| JS bundle (gz) | <150KB |
| Audio processing | <1ms/frame |
| Shader switch | <50ms (compile + swap) |
| DOM re-renders during playback | 0 |
| Draw calls | <10 |
