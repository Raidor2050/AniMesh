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
