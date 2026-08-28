# GitHub Research Findings (2 hunters, 28 repos)

Everything we adopted is **structure/ideas**, not code. Licenses were checked; only
permissive patterns were transferred.

## Hunter A — Shader / generative resources (14 evaluated)

| Repo | Takeaway | Adopted? |
|------|----------|----------|
| **lygia** (Prosperity license) | Best-organized GLSL chunk library | Ideas only — license forbids reuse. Our chunk grammar mimics organization, not source (D23) |
| **butterchurn** (MIT) | Preset blending + JSON preset schema per-frame param curves | Crossfade contract + preset-chip pattern (D03/D27) |
| **butterchurn-presets** (MIT) | 1000+ preset bodies as data | Structure only; we hand-curate instead (curation as authorship) |
| **stims** (MIT/0BSD) | adaptive quality ladder, WebGL2/WebGPU dual backend | Adaptive-scale ladder concept (D05) |
| **web-audio-beat-detector** (MIT) | autocorrelation/comb comparisons, tempo sanity priors | Comb tracker + priors + octave correction rationale (D10) |
| **Shadertoys / IQ** (CC-BY-NC for most) | domain warp, smooth-min repetition, palette functions | Technique patterns; written fresh |
| **glsl-transitions** (MIT) | `from/to/progress` uniform contract | Adopted verbatim as crossfade contract (D03) |
| **Shader Park** (MIT) | transpiler DSL over GLSL | Rejected — codegen complexity out of scope (D35) |
| + 6 more (Voronoi repos, noise packs, FBM Hq depots) | noise/voronoi implementations | Written fresh from published math |

## Hunter B — Audio / VJ / production resources (14 evaluated)

| Repo | Takeaway | Adopted? |
|------|----------|----------|
| **butterchurn** (MIT) | `loadPreset(preset, seconds)` transition; shader-per-layer | Crossfade API + layers-not-needed for single-quad |
| **PicoGL** (MIT) | thin WebGL2 wrapper | Concept review only — our core is already lean |
| **regl / twgl** (MIT) | declarative draw patterns | Pattern ideas (clear-state caching); not imported |
| **pmndrs/postprocessing** (MIT) | Effect swap graph + render-target pools | Kawase pass ordering concept; written ourselves (D04) |
| **ShaderFrog** (Web) | metadata-driven shader browser | Browser metadata contract (title/tags/thumbnail) (D25) |
| **glslify** (MIT) | `#pragma glslify: import` dependency graph | Chunk-grammar dependency idea; our `{{chunk:name}}` (D22) |
| **glslang / glslint** | GLSL validator CLIs | Not GA'd into CI (too heavy a dep); static lint script instead (D32) |
| **webamp** (MIT) | browser audio-visualizer production | Star-UI patterns; litigation-free clean-room |
| **murderszn/motion** (MIT) | fluid visualizer w/ WebGL2 | Realization that auto-motion during silence is achievable in-fragment (D12/D20) |
| **OpenVJ / surface.compositing** | multi-layer VJ compositing | Layers de-scoped; single-quad + composite kept (D35) |
| **Shader Park studio / Fragment IDE** (MIT) | thumbnail rendering pipeline | Static-first preview pattern (D25) |
| **PolygonJS DAG** | node graph for visuals | Inspires the route graph shape (D16), not the UI |
| **fft-visualizer** (MIT) | single-draw-call + DPR caps | Confirm DPR caps 2.0/1.5 in quality docs |
| + 1 more (disco-fever, confetti) | share-shader-portfolio SPA | Curation/marketing structure for our gallery |

## Net adoption list
1. GL Transitions contract for crossfades (A) — D03.
2. Butterchurn-style preset blending + chip presets (A/B) — D27.
3. Combat-style tempo tracker + priors (stims, web-audio-beat-detector) — D10.
4. Adaptive quality ladder (stims/fft-visualizer) — D05.
5. Kawase post-processing pipeline concept (pmndrs) — D04.
6. Static-first thumbnail preview (Fragment IDE) — D25.
7. Chunk-grammar composition (glslify-style, our own registry) — D22.

## Anti-adoptions (explicit)
- LYGIA/Shadertoys source text — license.
- WebGPU/regl/twgl/PicoGL — do not need abstractions.
- Playwright E2E, WebGL valorization in CI — cost > value (D35).
- Layers compositing (OpenVJ) — single-quad is the product.

## Phase 25 — Visual expansion (5 hunters, 30 repos → 765 visuals)

Phase 25 grew the library from 391 to **705 shaders + 60 SVG objects (765 visuals)**.
Everything transferred is again structure/technique math written fresh; only permissive
sources informed direct patterns.

### Technical research (5 agents)
- **Browser Audio Engineer** — AnalyserNode `fftSize=2048`; energy-based beat detection; 6-band
  extraction + ADSR smoothing; `getUserMedia` constraints must disable processing (echoCancellation/net
  off); `getDisplayMedia` audio is Chrome-only.
- **Shader Engineer** — WebGL2 targeting (96%+ support); string-template GLSL composition; SDF
  raymarch primitives; domain warping; dual Kawase blur post-fx; audio uniforms as float arrays.
- **VJ / Audio-Reactive Specialist** — musical vs mechanical reactivity; bass→distortion,
  kick→scale, snare→impact, treble→sparkle; logarithmic scaling; beat-synchronized transitions;
  autonomous motion during silence.
- **Web Graphics Performance** — raw WebGL2 for VJ control; <14ms frame budget; adaptive
  resolution scaling; `EXT_disjoint_timer_query` for GPU timing; ref-based DOM updates bypassing
  React; shader compilation caching.
- **Creative Technology / Interaction** — canvas-first layout; glassmorphism only for overlays;
  proximity-reveal immersive mode; JetBrains Mono + Inter; 4s generative boot sequence; command
  palette.

### GitHub findings (30 repos evaluated; top adopt)
| Repo | License | How integrated |
|------|---------|---------------|
| iq/iquilezles | CC-BY-NC | Technique patterns only — SDF raymarch, domain warp, palette fns, kalis (written fresh) |
| mercury.sexy/hg_sdf | CC-BY-NC | SDF primitives concept; written fresh from published math |
| tuxalin/procedural-tileable-shaders | MIT/CC0 | Tileable FBM/truchet/worley patterns as generators |
| vista-art/fragmentcolor | MIT | Meta feedback/pixel-sorting inspiration for dp-* family |
| jberg/butterchurn (+presets) | MIT/BSD-3 | Same JSON-preset param-curve idea reused for deep family defaults |
| lostjared/shaders | MIT | Orbit/bass-driven object-shader choreography ideas |
| gl-transitions | MIT | `from/to/progress` contract reused for backdrop swaps |
| Snorfield The-Library-Of-Shaders | CC0 | Gyroid/lyapunov/logistic map generators |
| jerosoler/waveform-path / evan-decker/lissajous-svg / audioMotion-analyzer | MIT | SVG layout math for rings/rose/spiro/lissajous/orbits (paths written fresh) |
| pmndrs/postprocessing | MIT | Kawase ordering concept retained for post pipeline |
| OpenVJ / Fragment IDE / Shader Park | MIT | Compositing + thumbnail + transpiler concepts — transpiler rejected |
| milkdrop presets (various) | unclear | Concepts/parameters adapted, no preset bodies copied |

### Phase-25 techniques added to the library
SDF raymarching (orb/box/torus scenes), domain warping, kalis sets, truchet tilings,
worley/voronoi, gyroid fields, lyapunov/logistic attractors, spectral kaleidoscope + oscilloscope,
rose folds, star polygons, Lissajous curves, radial EQ arcs, orbit-by-bass choreography, onset
spark bursts, autonomous drift during silence. SVG objects: 12 layouts (rings, rose, spiro,
lissajous, polarSpectrum, radialBars, waveform, mandala, orbits, flowDash, grid, petals) × 5
variants each; runtime is a ref/rAF SVG layer over the GL backdrop, sharing the same
`AudioSnapshot`.

### Verification (this phase)
- All 314 new fragments (cx-/dp-/obj-) compiled 314/314 offline on ANGLE/D3D11 (strict driver);
  760-press headless sweep: 0 compile errors, 0 warm failures, 0 boundary crashes, 0 pageerrors.
  e2e 29/29 on Edge (Chrome headless fake-mic is a known flake; Edge is CI source of truth).
  `npm run ci` green: 71 tests / 8 files.