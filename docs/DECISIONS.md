# Design Decisions (Team Synthesis)

This is the resolved architecture after 10 research agents + synthesis. Each decision
names the conflict it resolves. Anything not listed here is up for grabs; anything
listed is binding for Phase 3+.

## Platform & Rendering

| # | Decision | Rationale |
|---|----------|-----------|
| D01 | **Stay raw WebGL2. No three.js, no regl, no WebGPU.** | 96%+ support, full control, existing pipeline works. Three.js risk (context-loss handling, RTT churn, bundle) exceeds its value for a single-quad app. WebGPU = no (support + tooling). |
| D02 | **Program cache keyed by fragment source hash + pre-warm on idle** (`requestIdleCallback`) | Kills switch hitches — measured payback on a 380-shader library. Browser driver cache still applies; getProgramBinary only if trivially available (don't depend on it). |
| D03 | **Crossfade transitions via dual FBO + `uTransitionProgress`** (GL Transitions uniform contract, adapted) | Butterchurn's `loadPreset(preset, secs)` proves the UX; bar-quantized crossfade is the signature feature. Blend UNIFORM_HEADER candidates; quantize start to next beat. |
| D04 | **Dual Kawase bloom** replaces the single 5-tap pass (down×2, up×3, half-res) | One-pass 5-tap reads 25 texels at low quality — blurry. Kawase gives soft bloom at ~5 cheap passes, trivially tier-gated. Keep composite grading + NaN/Inf guard + beat floor. |
| D05 | **Adaptive quality ladder with hysteresis** (low .5 / med .7 / high .85 / ultra 1.0 render scale) + DPR caps (2.0/1.5) | Ext_disjoint_timer_query async sample (2-frame poll, GPU_DISJOINT check) drives a closed loop. Scale down on overshoot, slow scale up after 60*N good frames. Manual override in settings. |
| D06 | **`webglcontextlost`/`restored` handlers are mandatory production hardening** | Rated the #1 production risk. preventDefault, freeze clock, show toast, rebuild resources on restore. |
| D07 | **Tier-gated post-FX**: low = none, med = bloom half-res, high/ultra = bloom + grading | Matches adaptive scale; keeps mobile 17ms budget. |

## Audio & Tempo

| # | Decision | Rationale |
|---|----------|-----------|
| D08 | **Two analysers**: current smoothed one + a second exact (`smoothingTimeConstant=0`) for onset work | Smoothed data destroys transients; SuperFlux-style onsets need unsmoothed magnitude. Cost is one extra `getByteFrequencyData` — negligible. |
| D09 | **SuperFlux onset detection** on the unsmoothed analyser (HWR spectral flux + adaptive threshold via local max filter) | Robust, cheap, standard. Drives onset signals + kick emphasis. |
| D10 | **Comb-filter tempo tracker (locked mode)** + octave correction + 120 BPM prior + slew-limit | Autocorrelation is cheaper to implement but comb filtering is the standard for robustness; octave correction is mandatory (harmonic doubling is the #1 live-BPM failure). |
| D11 | **Confidence-gated lock**: BPM estimate only becomes authoritative after N consistent frames; confidence drives a TrustGrid for beat phase | Prevents the beat clock chasing noise; silence drops confidence to 0 and the clock free-runs. |
| D12 | **`engineMode: 'free' | 'locked'`** = the RAW SOUND vs BPM mode. Free = old energy/spectral flux beat. Locked = grid-synced clock (bar/quarter/eighth/16th, swing). Beat detection ≠ BPM tracking; they are separate subsystems. | Either mode must survive both silence (demo drift) and chaos (all-samples). |
| D13 | **Bar/eighth/16th grid + downbeat confidence + `barPhase`** added to AudioSnapshot | Shader bodies need phase within the bar (drop visuals), not just "did a beat fire." |
| D14 | **Phase re-anchor, never reset** on BPM change; slew the interval, permit drift < max | Resetting the clock on each correction glitches visuals. Smooth wins. |
| D15 | **Remove the 120-frame debug log block** in AudioEngine | Unshipped console traffic; 1-line deletion. |

## Audio → Visual Mapping (the differentiator)

| # | Decision | Rationale |
|---|----------|-----------|
| D16 | **4-stage pipeline**: raw signals → derived features → macros → per-param routes. Replaces the naive `signalValue * amount` mapper. | The current mapper ADDS naive products; the research (Agent 7 + Resolume/21st.dev UX work) mandates range-aware amounts (fraction of param span), per-route attack/release, and musicality as gain staging. |
| D17 | **Derived signal registry** (memoized): bandEnv, flux, fluxEnv, onset, barPhase, lfo1–4 (BPM-synced), noiseS, rand. | Shader authors compose musical motion from these, not raw FFT pointer-jitter. |
| D18 | **Route semantics**: attenuverter amount ∈ [−1,1], curve ∈ {linear, log, exp}, op ∈ {add, multiply, mix}, one-pole attack/release per route, min/max span clamping. | Elide register—this replaces AudioMappingEngine with a graph. |
| D19 | **De-bake hardcoded universal mappings out of `library.ts`**; a single `global` profile maps macro→universal uniforms in the composite stage. Per-shader routes live in ShaderDefinition metadata. | Removes 6 magic constants per shader from the monolith; makes ranges explicit and editable. |
| D20 | **Silence identity guard**: when total energy ≈ 0, routes hold last values (no decay-to-zero shiver). | Survives silence — a disclosed principle. |

## Shader System

| # | Decision | Rationale |
|---|----------|-----------|
| D21 | **Catalog split (revised @ Phase 9)**: `catalog.ts` metadata stays in the entry chunk; shader bodies are isolated in a static `shader-data` chunk via `manualChunks` (library/milkdrop/reactive/heroes), NOT per-category `import.meta.glob`. | Intended lazy split re-scoped: 9 static importers + the sync crossfade/cache flow made per-category async a blank-library regression risk for only ~90KB-gz first-load gain. Static split clears the 500KB warning and gives a cache-stable bodies chunk with zero runtime risk (browsed categories share one fetch). |
| D22 | **Chunk grammar `{{chunk:name}}`** with a built-time-time registry (`chunks.ts`) — resolve bullets(s) in createShader. Chunks: noise, warp, palette, sdf, raymarch, kaleid, etc. | AGENTS.md convention, matches LYGIA/glslify ideas without their licenses/copyright concerns. |
| D23 | **LGChoice resolution: LYGIA = ideas only** (Prosperity license forbids reuse). Butterchurn = MIT (structure/contract patterns OK with attribution). We adapt patterns, not code. | No license-reuse risk in shipped GLSL. |
| D24 | **New hero shaders** (thin categories): moiré-feedback, pseudo-feedback galaxies, quaternion 4D slice beat-pop, mandelbox-lite, smooth Voronoi warpgrid, curl flow, kaleid memorb | One thought per shader; candidates elevate 2 underrepresented categories; use chunk grammar + tiers. |
| D25 | **Static-first previews** (first frame rendered offscreen → dataURL poster) + `aria-busy` + hover-live toggle gated by tier; `A11yAnnouncer` announces shader switches. | Previews no longer compile hundreds of shaders at once; ≤1-2 live canvases. |

## UX / Product

| # | Decision | Rationale |
|---|----------|-----------|
| D26 | **MacroBar replaces raw mapping sliders as the default**: Energy, Complexity, Motion, Musicality, Atmosphere — 5 semantic knobs mapped through the Profile. Raw EQ panel becomes subview "Advanced". | Both 21st.dev Shader Builder and Resolume converge on 3-6 semantic knobs over parameter soup. |
| D27 | **Preset chips per shader**: 3-5 named param presets (chips on the shader panel) with instant recall; undo via history. | Instant musicality; matches Butterchurn preset ethos. |
| D28 | **ErrorBoundary at root + CanvasLayer**; every panel self-contains failures. | The invariant: a crash must never blank the canvas. |
| D29 | **Reduced-motion consumers**: freeze `uTime` under `prefers-reduced-motion`, disable crossfade/auto-advance. | WCAG; trivial. |
| D30 | **Boot sequence stays** (4s generative, skippable) — brand; then land on Browse. | Existing asset, just wire it. |

## Process & Delivery

| # | Decision | Rationale |
|---|----------|-----------|
| D31 | **vitest for pure logic only** (feature graph math, curve eval, BPM octave/median, band mapping, wireParams output). No DOM/WebGL tests in CI. | Speed + determinism; GL stays a manual checklist + static lint. |
| D32 | **Static GLSL lint in build** (balanced braces, uniform contract compliance, unresolved chunk error, NaN-guard presence in composite). | We have no GLSL compiler in-CI; lint script `scripts/check-shaders.mjs` is the cheapest safety net. |
| D33 | **CI (GitHub Actions)**: lint + test + build on push/PR; on `main` deploy `dist/` to `gh-pages` via `GITHUB_TOKEN`. Keep manual deploy path for emergencies. | Move off 100%-manual deploys without secret-dance. |
| D34 | **Commit discipline**: Hmm — one logical commit per phase (Angular style), `Progress.md` updated, build gate green before each commit. | AGENTS.md. |
| D35 | **De-scope (explicitly NOT doing)**: WebGPU, WebGL1 fallback, reactive feedback ping-pong (pseudo-feedback in shaders instead), Playwright E2E, offline PWA, complete generator/creator UI. | Each is weeks of work with poor ROI for the core instrument. |

## Architecture Constants

- `AudioSnapshot` is the only audio→visual contract (mutated once/frame, read by render loop).
- React never calls GL. Renderer is opaque; UI subscribes to zustand at low frequency.
- One shared fullscreen quad; every pass is `drawArrays(TRIANGLE_STRIP, 0, 4)`.
- Budgets: 14ms frame target, GPU <12ms, one-frame effects on adaptive scale.