# AniMesh — Progress Tracker

## Milestones

### Phase 1: Research & Architecture ✅
- [x] Spawn 5 browser/audio/shader research agents
- [x] Spawn 3 GitHub repository research agents  
- [x] Synthesize all findings (30 repos evaluated)
- [x] Spawn 2 architecture agents
- [x] Create implementation.md

### Phase 2: Project Foundation ✅
- [x] Initialize Vite 6 + TypeScript + React 18 project
- [x] Install dependencies (Zustand, motion, react-router-dom)
- [x] Set up project structure (14 modules)
- [x] Configure build for GitHub Pages (hash router, base path /AniMesh/)
- [x] Create design tokens (colors, typography, spacing, animation)

### Phase 3: Core Engine ✅
- [x] WebGL2 context manager
- [x] Shader compiler with error reporting
- [x] GLSL chunk registry and composition
- [x] FBO management (scene, bloom, composite)
- [x] Render loop (requestAnimationFrame)
- [x] Post-processing pipeline (bloom + vignette + composite)

### Phase 4: Audio Engine ✅
- [x] AudioContext lifecycle management
- [x] Source switching (mic/file/demo/system)
- [x] FFT band extraction (6 bands: sub, bass, lowMid, mid, highMid, treble)
- [x] Beat detection (adaptive threshold, 200ms min interval)
- [x] Per-band smoothing envelopes (ADSR)
- [x] AudioSnapshot bridge (mutable, ref-based)

### Phase 5: Shader Library ✅ — 41 Shaders
- [x] Fractals: 6 (Mandelbrot, Julia, Kaleidoscope, Menger, Sierpinski)
- [x] VJ: 7 (Tunnel, Radial Burst, Spectrum, Waveform, Strobe, Psychedelic)
- [x] Geometric: 4 (Grid, Voronoi, Mandala, Cellular)
- [x] Liquid: 4 (Fluid, Metaballs, Ink, Mercury)
- [x] Cosmic: 4 (Nebula, Black Hole, Galaxy, Aurora)
- [x] Synthwave: 3 (Horizon, City, Retrowave)
- [x] Abstract: 5 (Domain Warp, Interference, Noise, Plasma, Mesh)
- [x] Particle: 3 (Galaxy, Trails, Stardust)
- [x] Minimal: 5 (Circle, Lines, Breathing, Zen, Concentric)

### Phase 6: Audio Mapping System ✅
- [x] Mapping engine with per-signal curves (linear/log/exp)
- [x] Per-shader default mappings
- [x] Exponential decay smoothing

### Phase 7: UI ✅
- [x] Canvas layer (WebGL mount, always rendered)
- [x] HUD (TopBar with logo + FPS, Transport bar, Audio meter)
- [x] Panel system with spring animations
- [x] Shader browser (masonry, categories, search, favorites)
- [x] Parameter panel (dynamic controls from shader schema)
- [x] Command palette (Ctrl+K, fuzzy search)

### Phase 8: Shader Creator ✅
- [x] 5-step wizard (Mood → Movement → Intensity → Palette → Generate)
- [x] Composable shader generation
- [x] Poetic naming system
- [x] Randomize / Regenerate

### Phase 9: Branding ✅
- [x] SVG Penrose Triangle logo
- [x] Boot sequence (4s generative animation)

### Phase 10: Immersive Mode ✅
- [x] Full takeover mode (F key)
- [x] Proximity-reveal HUD (80px edge detection)
- [x] Keyboard shortcuts

### Phase 11: Documentation ✅
- [x] README.md
- [x] implementation.md
- [x] Progress.md
- [x] Agents.md

### Phase 12: Build & Deploy ✅
- [x] Production build (4.4s, 110KB gzipped)
- [x] TypeScript: 0 errors
- [x] Git initialized and pushed
- [x] GitHub Pages configured (gh-pages branch)
- [x] Live site: https://raidor2050.github.io/AniMesh/

### Phase 13: Bootstrap Resilience ✅
- [x] Revert regression-prone audio/PWA layer (a7ed6a9) back to stable param-wiring baseline (d373c47)
- [x] Guard localStorage `JSON.parse` (favorites/recent) against corrupt prefs — module-load crash that blanked shaders + tray previews
- [x] Extract `randomShader`/`cycleShader` into shared `src/state/shaderActions.ts`

### Phase 14: Mobile Optimization + Immersive Controls ✅
- [x] Immersive mode: tap/touch to reveal HUD (edge proximity + any-touch)
- [x] Immersive nav buttons: PREV / RANDOM / NEXT / EXIT (44px touch targets)
- [x] Safe-area insets for immersive bars (notch / home indicator)
- [x] `viewport-fit=cover` + `touch-action: manipulation` + `overscroll-behavior: none`
- [x] Responsive shader carousel panel (full-width under 700px)
- [x] `prefers-reduced-motion` fallback

### Phase 15: Feature Graph Engine ✅ (master-plan Phase 3 + 5)
- [x] 4-stage graph: signals → derived → macros → routes (`src/mappings/featureGraph.ts`)
- [x] 8 shader-friendly derived signals (bandEnv, flux, onset, clock, lfo1-4, noiseS, rand)
- [x] 5 macro uniforms (uMacroEnergy/Complexity/Motion/Musicality/Atmosphere) driven by signal + macro bars
- [x] Route semantics: attenuverter (−1..1 of span), curves linear/log/exp, ops add/multiply/mix, per-route one-pole envelope, min/max clamps
- [x] Params accumulate onto per-frame base reset (legacy parity), stale-target cleanup on shader switch
- [x] Silence-hold (D20): freezes last-loud frame on first quiet frame, no envelope pre-decay
- [x] Renderer wiring: FeatureGraph replaces AudioMappingEngine; param ranges incl. composites (bloom/zoom/uBass/uMid/uTreble); custom-route cache keyed by JSON
- [x] De-baked the 6 universal mappings from library.ts → global profile; uMacro* in UNIFORM_HEADER
- [x] 15 vitest tests green (`npm test`), build green (~7.3s, 409 modules)

### Phase 16: Audio Engine Upgrade ✅ (master-plan Phase 4)
- [x] Second raw analyser (smoothingTimeConstant=0) for streak-truth onset data (D08)
- [x] SuperFlux onset: HWR flux + local-max 1s threshold on raw; onsetStrength/onsetOn + user sensitivity (D09)
- [x] Comb-filter tempo tracker: harmonic/subdivision scoring, octave correction, 95–135 groove band, 120 prior, slew limit ±3%/event, confidence (D10/D11)
- [x] `engineMode 'free'|'locked'` (D12): free = transient-reset beatPhase; locked = continuous clock that re-anchors to the nearest onset, never resets (D14)
- [x] Beat grid snapshot: bar/eighth/sixteenth phases, downbeat confidence (D13); TrustGrid gates bpm blend/confidence
- [x] New feature extras: rolloff (85% cumulative), flatness (geo/arith), ZCR (percussive vs tonal), rms
- [x] Silence handling (D20): >3s under floor → silence flag, confidence→0 with smooth fade
- [x] Diversity check: 750/375/187.5ms patterns all resolve to 160 BPM; 600ms hip-hop stays 100
- [x] Removed debug console.log block; no-alloc frame (arrays pre-allocated, snapshot object reused)
- [x] 17 new vitest tests (comb tracker + grid phases) — 32 total green; build green (476KB / 101.7KB gz)

## Performance Metrics
| Metric | Value | Target |
|--------|-------|--------|
| Total JS (gzipped) | ~110KB | <150KB ✅ |
| Shader count | 381 | 40+ ✅ |
| Build time | 8.4s | <10s ✅ |
| TypeScript errors | 0 | 0 ✅ |
| Categories | 11 + milkdrop | 9 ✅ |

## Key Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-25 | Raw WebGL2 over Three.js | VJ use-case needs max control, smaller bundle |
| 2026-08-25 | AnalyserNode over AudioWorklet | Sufficient for visualization, universal support |
| 2026-08-25 | React for UI only, not rendering | Refs for GL bridge, zero re-renders during playback |
| 2026-08-25 | Hash router for GitHub Pages | No server-side routing needed |
| 2026-08-25 | Zustand over Context | Transient subscriptions, performance |
| 2026-08-25 | motion library for panels | Spring physics, performant animations |
| 2026-08-25 | gh-pages branch over Actions | Token scope limitation, still effective |
| 2026-08-28 | Reverted a7ed6a9 → d373c47 | User directive: restore stable shader baseline, then enhance |
| 2026-08-28 | Safe-parse localStorage at bootstrap | Corrupt prefs must never blank the whole app |
| 2026-08-28 | Touch-native immersive nudging | edge-proximity already mobile-friendly; tap reveals controls |
| 2026-08-28 | 4-stage feature graph replaces AudioMappingEngine | macros as user-facing semantic knobs; routes accumulate onto base reset for legacy parity |
| 2026-08-28 | Silence-hold freezes on first quiet frame | fast-release envelopes must not pre-decay the last loud frame; relative 0.25× energy clause keeps quiet pads alive |
| 2026-08-28 | 15 vitest pure-logic tests | test the impactful math; GL stays untested by design (D31) |
| 2026-08-28 | Second raw analyser + SuperFlux onsets | smoothed data lies to transient detectors; raw streak is truth (D08/D09) |
| 2026-08-28 | Comb octave rule: fastest legal near-peak unless 95–135 BMP groove | onset trackers misreport half/double tempo; keep hip-hop/house identities slow, dance fast |
| 2026-08-28 | Locked clock re-anchors to nearest onset, never resets | D14: phase continuity over hard resets when beat spacing is stable |
| 2026-08-28 | engineMode defaults to free | risk register: grid must never hurt the base experience deliberately |
| 2026-08-28 | Chunk grammar `{{chunk:name}}` + `shaders/chunks.ts` registry | AGENTS.md #3; compose resolver is dumb substitution, chunks must precede main() (GLSL ES 3.00 decl-before-use) |
| 2026-08-28 | Program LRU cache owns program lifetime | callers must never deleteProgram cached programs; eviction frees; crossfade holds both programs resident |

## Phase 17: Shader System Foundations (master-plan Phase 6 part 1)
- [x] `{{chunk:name}}` grammar + registry (`src/shaders/chunks.ts`, 13 chunks) + resolver (`src/shaders/compose.ts`)
- [x] Shader factory extracted (`src/shaders/factory.ts`): UNIFORM_HEADER + COMMON_NOISE + createShader; chunks resolve BEFORE wireParams/universals so injected GLSL participates
- [x] `uniform float uTransitionProgress` added to UNIFORM_HEADER (D3 contract + hero/crossfade use)
- [x] 10 flagship Hero shaders (`src/shaders/heroes.ts`) composed from chunks across 7 categories, with own uniforms + audio mappings (D24)
- [x] Program LRU cache (`src/renderer/programCache.ts`, cap 16) — cache owns compile + evict; boot fallback cached so first switch crossfades
- [x] Renderer rewired: programs via cache; crossfade dual-scene pipeline (out→fboA, in→fboB, eased blend→fboC, bloom fboC→fboB, composite→screen) over 0.7s (D3)
- [x] Idle pre-warm in CanvasLayer: warm next 3 catalog entries on boot (450ms) and after each switch (D2/D6)
- [x] Catalog metadata layer (`src/shaders/catalog.ts`): categories/heroes/tier stats + audit getters; full-library integrity test (unique ids, valid category/tier, body presence, audio mappings target declared defaults) (D21, tier pass)
- [x] 16 vitest tests added (compose 9 + catalog 7); 48 total green; build green (496.88KB / 106.04KB gz)

## Phase 18: UX — MacroBar, Preset Chips, Announcer, ErrorBoundary (master-plan Phase 7)
- [x] MacroBar (D26): 5 semantic vertical faders (Energy / Complexity / Motion / Musicality / Atmosphere) → ref bridge `audioDataBridge.macros` → graph profile, read every frame (no React per pointer-motion); uncontrolled sliders, 10Hz label refresh; reset + Advanced (un-minimizes EQ panel) buttons
- [x] Renderer per-frame macro sync + reduced-motion freeze (D29): `frozenTime` locks `uTime`, crossfades disabled (hard switch), freeze cancelled when reduced motion off
- [x] Preset chips (D27): `src/shaders/heroPresets.ts` with 3 named presets per hero (params ⊆ defaults, test-locked); ParameterPanel chip row with save (inline input, aria), apply → `commitParams` + undo (Ctrl+Z), custom-chip delete
- [x] Param history + undo: `src/state/history.ts` (`HISTORY_CAP=24`, pure push/applyUndo, tested); `commitParams`/`setActiveShader` push history; Ctrl+Z handler (CMD/Ctrl, input-aware) in App.tsx announces on undo
- [x] Accessibility: `src/a11y/announcer.ts` (module-level announce bus) + `A11yAnnouncer.tsx` live region; `setActiveShader` announces shader name; presets/Advanced announce
- [x] ErrorBoundary (D28): class boundary, root + panel variants (retry + reload), announces recoverable errors; wraps root layout + CanvasLayer
- [x] 8 vitest tests added (heroPresets 4 + history 4); 56 total green; build green (507.47KB / 109.16KB gz)

## Phase 19: Renderer Hardening (master-plan Phase 8)
- [x] Kawase bloom chain (D12): half-res FBO pair (fboD/fboE via `createFBOScaled`), extract-downsample with bright gate (radius 0.5, uThreshold, uIntensity) + three widening passes (1.5→3.0→6.0 texel) ping-ponged; composite reads half-res bloom (¼ fill rate of scene); degrades to identity-bloom when chain allocation fails
- [x] Adaptive resolution scaling (D30): pure `src/renderer/adaptive.ts` controller (EMA of wall+GPU ms, 14ms budget, step-down 10% / step-up 5%, 1s cooldown, clamps 0.5–1.0; unit-tested) wired into `render()`; scale changes re-resize canvas + all five FBOs; settles 30 frames before re-gauging
- [x] GPU timing via `EXT_disjoint_timer_query_webgl2` (D30): two query slots, result read one frame behind, fallback to wall-clock EMA when unsupported
- [x] Context-loss hardening: stale `warmed` tag cleared on re-init so neighbor pre-warm resumes after `webglcontextrestored`; dispose cleans timing queries + bloom FBOs
- [x] Perf overlay (`PerformanceOverlay.tsx`): ref-driven DOM text (never React state, AGENTS.md #8), shows fps / frame ms / gpu ms / scale / resolution / cache size; toggled with `g`; values published via `audioDataBridge` (frameMs, gpuMs, scale, resolution, cacheSize)
- [x] 6 vitest tests added (adaptive 6); 62 total green; build green (512.94KB / 110.83KB gz — chunk-size warning tracked in risk register)

## Phase 20: Chunk Split + Dead-Code Pass (D21 re-scope)
- [x] Shader bodies isolated in a static `shader-data` chunk via `manualChunks(id)` function form (library + milkdrop-generated + reactive-collection + heroes); app chunk 512KB→174KB min (110.8→47.2KB gz), shader-data 274.7KB (42.8KB gz) — 500KB warning cleared, bodies chunk cache-stable
- [x] D21 revised in DECISIONS.md: full per-category `import.meta.glob` deliberately NOT done — 9 sync importers (stores/canvas/catalog/shaderActions/previews/browser) + sync crossfade-cache flow make the ~90KB-gz first-load gain a blank-library regression risk (top risk-register row); static split delivers warning+hygiene with zero runtime risk. `catalog.ts` note updated to match.
- [x] Dead code removed: `library.ts` `getShadersByCategory`/`getShaderById` (duplicated by `catalog.ts`, unused by any consumer), UIStore `qualityTier`/`setQualityTier` (zero consumers; superseded by adaptive scale D30)
- [x] Statuses reconciled in IMPLEMENTATION_PLAN.md (phases 3–7, 9 → `[x]`); master-plan Phase 8 (stationary-first preview posters, hover-live by tier) still open
- [x] 62 total green; build green — no chunk warnings

## Phase 21: Tooling + CI (ESLint, check-shaders, GH Actions)
- [x] `scripts/check-shaders.mjs` — static GLSL gate (unterminated-literal detection; every `void main()` fragment must be brace-balanced; skips `__tests__` + chunk-grammar pieces) → 272 literals scanned, wired as `npm run check:shaders`; architecture notes in file header
- [x] ESLint 9 flat config (`eslint.config.js`): typescript-eslint recommended + react-hooks + react-refresh; relaxations documented in-file: unused-vars→warn (dead-code pass lives in Progress), `no-explicit-any` off (bridge snapshots), `no-empty` allows empty catches (context-error swallowing), `set-state-in-effect` + `immutability` off (store/mount sync + hoisted fn-decl patterns are valid React 18)
- [x] 34-warning cleanup as part of the dead-code pass (Phase 20-21): removed dead imports/locals across CommandPalette, EQMappingPanel, ImmersiveMode, LeftPanel, LeftToolbar, ParameterPanel, ShaderBrowser, ShaderCarousel, StreamGraph, TopBar, useDraggable, useShaderPreview, AudioMappingEngine, featureGraph, ShaderPreviewManager, library, wireParams, AudioEngine, vite.config — `lint` exit 0, zero warnings
- [x] `.github/workflows/ci.yml`: push/PR on main → lint + check:shaders + build + test; deploy job (peaceiris/actions-gh-pages, force_orphan) auto-publishes `dist` to gh-pages on main push
- [x] `npm run ci` = lint && check:shaders && build && test — full pass green locally; 7 test files / 62 tests; build clean, no chunk warnings

## Phase 22: QC audit + final docs (master Phase 11/12)
- [x] Measured real library composition via throwaway vitest probe (probe deleted): **391 shaders** — fractals 38, vj 50, geometric 59, liquid 56, cosmic 57, synthwave 24, abstract 48, particle 42, minimal 17, milkdrop 0 (category unused, 121 milkdrop-tagged); 10 heroes; tiers low 59 / medium 317 / high 15 / ultra 0
- [x] `scripts/check-shaders.mjs` hard data: 272 GLSL template literals scanned
- [x] `docs/FINAL_AUDIT.md` written: metrics, verified claims, 12-item manual browser checklist (pending live verification), 9 deliberate deviations (D-A…D-H), doc-delta ledger, open-items (master Phase 8 preview polish de-scoped/deferred)
- [x] `docs/TESTING.md` reconciled: GLSL lint list rewritten as (check-shaders.mjs items ∪ vitest items); no-console & byte-size recorded as accepted gaps; CI section now matches `ci.yml` (lint → check:shaders → build → test)
- [x] `docs/PERFORMANCE.md` reconciled: "Current state (Phase 9+ audit)" section maps realized adaptive loop / half-res bloom / 391-shader pre-warm / ~174KB-gz 5-chunk initial vs aspirational spec; budget table rows updated (lazy-per-category → static shader-data chunk 42.8 KB gz; compile list → 391)
- [x] All gates green after doc edits (lint 0/0, check-shaders OK, build clean, 62 tests)

## Phase 23: Release + live verification (master Phase 13/14)
- [x] Pushed `main` (a7ed6a9..f39b946 then ..932124c) — required `gh auth refresh -s workflow` for the ci.yml push (OAuth scope gate)
- [x] First CI run on GitHub green end-to-end: lint ✓ check:shaders ✓ build ✓ test ✓ deploy ✓ (peaceiris → gh-pages); run 33153564574
- [x] Live site verified: `https://raidor2050.github.io/AniMesh/` serves current build (index-BA1onMI6 / shader-data-CulWpNii / vendor / motion / state), shader-data chunk 200 (274,696 B)
- [x] Fixed PWA 404s found during live check: `public/` had been gutted by the Phase 1 revert but `index.html` hardcodes manifest/icon refs → restored `manifest.webmanifest` (stale "622+ shaders" claim fixed) + `icons/icon.svg` + `mask-icon.svg`; sw.js stays de-scoped. CI redeploy (33153839963) success; manifest/icon/mask-icon all live 200
- [x] Deterministic builds confirmed: local dist hashes == CI-ubuntu hashes

## Manual live checklist — closed item-by-item by Phase 24 automation
- [x] Boot; browse all categories; shader switches; no blank/frozen frame (50-cycle e2e + 391 sweep on a real GPU)
- [x] File + demo-synth source switch (D1/D5), mic allowed-path with fake stream (D2)
- [x] Keyboard F/I/G + Escape (B1/C groups); `/` palette + Space/arrows → real-device glance
- [x] Reduced-motion freeze (E group); 50-switch leak proxy=heap growth 1–2 MB ≪ 40 MB budget
- [x] webglcontextlost recovery (F group); Lighthouse ≥85 (live 93/100/96/100)
- [ ] REMOVED for good: real-device mic calibration + phone fps / immersive tap-target eyeball

## Phase 24: Headless release verification + strict-driver shader fixes ✅
- [x] **Root-caused the systemic compile failures (344/391 on real ANGLE/D3D11; 0 on the boot path).** Three genuine GLSL defects, all invisible on forgiving compilers:
  - `wireParams.num()` emitted bare ints (`1`, `4`, `0`) into float math; strict compilers reject `uniform float - int` / `float / int`. Emits `.0` floats now (regression test added).
  - `pal(colr, 0)` — GLSL ES has NO implicit int→float for function args; whole `H` values (`0.0`) stringified to `0`. reactive-collection now interpolates float literals.
  - Misc: milkdrop adapter `#version` not first line (121 shaders); `dot` shadowing the builtin in Halftone/Dot Grid; `vec2 ring`/`vec2 pt` scalar-constructor misuse (Vorton, geo-voronoi).
- [x] Removed the ineffective compile-time spin-retry + `[CF]` diagnostics from `WebGL.ts` (once real fixes landed, both were noise).
- [x] Renderer hardening stays: `setShader`/`warmShader` never throw through the ErrorBoundary; double-compile failure retains the previous live program.
- [x] `npm run ci` green (63 tests); **391/391 sweep** zero compile errors on AMD Vega 8; e2e-smoke **29/29** (favicon 404 killed via SVG icon link; file-source test drives the real `createElement→onchange→connectFile` path through an input polyfill); live Lighthouse **93 perf / 100 a11y / 96 bp / 100 seo**.
- [x] ONE commit `57817c2` pushed to `main` → CI redeploys live.
- [ ] Remaining manual-only: real-device mic calibration + phone fps/tap-target eyeball.

## Phase 25: Visual expansion — 391 → 705 shaders + 60 SVG objects (765 visuals)
- [x] **18 complex shaders (`cx-*`)** — SDF raymarch scenes, domain-warped erosion, kalis/gyroid fields, spectral kaleidoscope; hand-tuned audio submappings.
- [x] **96 GL object shaders (`obj-*`)** — procedurally generated orbs, tunnels, rings, spires, portals, wires, bars, gears, tendrils with `'pure'` epilogue (mac users: no alpha wash).
- [x] **200 deep-generative shaders (`dp-*`)** — attractors (lyapunov/logistic), truchet/worley tilings, lyapunov flows, oscilloscopes, rose/star polygons, orbit-by-bass; deterministic seeds, curate-able metadata.
- [x] **60 SVG objects (12 layouts × 5 variants)** — rings/rose/spiro/lissajous/polarSpectrum/radialBars/waveform/mandala/orbits/flowDash/grid/petals; `mountSvgObject` ref/rAF runtime reading `useShaderStore.params` + `audioDataBridge.snapshot`, reduced-motion aware, `'pure'` GL backdrop (`SVG_BACKDROP`, uses `uBeat`).
- [x] **Visual union type** — `Visual = ShaderDefinition | SvgObjectDefinition`; `kind?: 'shader'` discriminant added to shaders, required `kind: 'svg'` on SVG defs; `VISUAL_LIBRARY` merges both; `getVisualById`/`isSvg`/`asShader` helpers.
- [x] **Store/actions** — `activeVisual` + `setActiveVisual` (history-backed with undo); `randomVisual`/`cycleVisual`; `isActiveSvg()`; immersive Space/arrows + ImmersiveMode PREV/RANDOM/NEXT shuffle across shaders AND SVG objects (global `r`/`[`/`]` stay shader-only).
- [x] **UI** — `SvgObjectLayer.tsx` overlay (pointer-events none, zIndex 1) mounted on activeVisual change; ImmersiveMode shows visual name + GL/SVG badge + flash on change; CanvasLayer dispatches to SVG_BACKDROP when an SVG is active.
- [x] **Generator core** — `_gen-core.ts` prologue (`P()`) reserves `uv,t,p,bass,mid,treb,vol,sub,cnt,beat,gate`; epilogue modes `'wash'|'pure'`; `pal(u,h)` moved into COMMON_NOISE so wireParams-injected fragments compile standalone.
- [x] **Strict-driver fixes** — `mid`→`uMid`, `sub`→`uSub` in complex.ts; `fbm(vec3)`→`fbm(qv.xy)` (cx-marble-orb); epilogue `'E2'`→`'pure'` and `float cnt`→`float nb` (obj-orbits-*) found via the offline compile harness.
- [x] **Debug tooling (thrown away after use)** — fragments dumped via throwaway vitest spec, compiled in an isolated puppeteer WebGL2 harness (ANGLE/D3D11) to catch errors the browser reports with empty info logs; 314/314 new fragments compile.
- [x] **Verification** — `npm run ci` green (71 tests / 8 files; check-shaders 518 literals); **760-press sweep: 0 compile errors, 0 warm failures, 0 boundary crashes, 0 pageerrors**; e2e **29/29 on Edge** (Chrome headless fake-mic known flake). `visual-expansion.test.ts`: 8 tests (unique ids, 60 SVGs, VISUAL_LIBRARY merge, shuffle in-bounds, kind discrimination).
- [x] Research findings recorded in `docs/GITHUB_RESEARCH.md` (Phase 25 section).
- [ ] Live-site sanity after CI deploy (index/manifest/icon 200 + one manual immersive glance).

## Risk Register (master-plan phases 6–9)
| When | What | Mitigation |
| --- | --- | --- |
| 2026-08-28 | Main chunk 512.94KB / 110.83KB gz still over the 500KB rollup warning | D21 re-scoped to a static `shader-data` manualChunks split (Phase 20): app chunk → 47.2KB gz, bodies chunk 42.8KB gz, warning cleared, no runtime risk |
| 2026-08-28 | EXT_disjoint_timer_query result may lag a frame or be unavailable | gpuBegin only re-arms when the previous result is readable (never overwrites in-flight); adaptive falls back to wall-clock EMA |
