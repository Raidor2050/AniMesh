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