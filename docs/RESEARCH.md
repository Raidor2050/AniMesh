# Research Findings (Technical + Creative Agents)

Condensed from the Phase 1 swarm. Headlines that shaped DECISIONS.md.

## Agent 1 — Frontend / React-shell engineer
- Per-frame data already correctly lives outside React (zustand for low-freq only) — confirm, don't re-architect.
- **Gap: no ErrorBoundary anywhere** → render exceptions blank the whole surface (the app's historical regression class). Add root + per-canvas guards.
- Lazy load: prefer `import.meta.glob` directory maps over hand-maintained import lists (scales to 381 shaders).
- Keep `motion` for overlay presence; push panel transitions to CSS where they don't need orchestration.
- Registry pattern (definition list + lookup) beats scattered component maps for the browser.

## Agent 2 — Graphics / WebGL engineer
- **Program-cache + idle pre-warm** eliminates recompile hitch — highest-gain graphics fix for a 380-shader library.
- Dual **Kawase bloom** preferred over single 5-tap pass (soft, cheap, tier-friendly).
- **EXT_disjoint_timer_query_webgl2**: async usage — begin/end per frame, poll 2+ frames later, discard on `GPU_DISJOINT_EXT`. Drives adaptive resolution in a closed loop.
- Adaptive scale: rolling percentiles + hysteresis (don't thrash scale).
- Ping-pong FBO feedback is possible but risky on memory; **prefer pseudo-feedback inside shaders** (it's why moiré-feedback hero reuse works).
- Context-loss: add `webglcontextlost`/`restored` handlers — currently absent, rated top production risk.
- No WebGL1 fallback, no WebGPU — keep current target (96%+).
- Gate `highp` via `getShaderPrecisionFormat` where raymarch heroes run on mobile.

## Agent 3 — Audio engineer
- Keep AnalyserNode; add a **second exact analyser** (`smoothingTimeConstant=0`) for onset work — smoothed FFT destroys transients.
- **SuperFlux onset** (HWR spectral flux + local-max adaptive threshold) is the robust, cheap standard.
- Tempo: **comb-filter tracker** (over autocorrelation) with **octave correction mandatory**; add 120 BPM prior; confidence must gate the lock (a "TrustGrid").
- Keep tempo×slow, phase×fast: BPM recompute at ~10 Hz, clock phase per-frame. (Butterchurn doesn't do heavy math every frame.)
- **Remove the 120-frame debug `console.log`** in `AudioEngine.ts` when system audio path is live.
- Beat detection ≠ BPM tracking; treat separately (free vs locked).

## Agent 4 — UX / interaction designer
- **Macro knobs over raw sliders** — 21st.dev Shader Builder ships ~4-5 semantic knobs; Resolume uses compound/claw gestures; slider soup fails live use.
- **Hover-to-play cached previews** over always-live thumbs (compile hundreds = death).
- Keyboard-first + announcer; disabled/empty states everywhere.
- Reduced-motion = freeze time, no auto-advance (WCAG 2.2.2).

## Agent 5 — Production / disciplines
- **Context loss = #1 production risk** (nothing handles it today).
- Test the mobile highp-mobile path explicitly (half the raymarch heroes run there).
- No tests, no CI, no GLSL verification at all → add vitest for pure logic + static GLSL lint + GH Actions.
- Budgets table = the contract (see PERFORMANCE.md); enforce one-frame effects on adaptive scale.

## Agent 6 — GLSL / shader author
- Dev-catalog of ~14 techniques viable at full-frame cost: fBm domain warp, 2D raymarch impostors, domain repetition + IQ poly smooth-min, orbit-trap Julia, quaternion 4D slice, mandelbox-lite, smooth & edge Voronoi, fake feedback, particle galaxies (hash+orbit), polar kaleidoscope, moiré, 2D metaballs, IQ palettes, chroma aberration.
- Cost tiers: raymarch ≥ heavy → tier=high; domain/texture tricks → low/medium.
- 3 hero recipes validated for "one thought per shader" (quaternion slice beat-pop, moiré-feedback, voronoi-warpgrid) — adopted as heroes (D24).

## Agent 7 — Audio-reactive mapping / feature-graph designer
- Design principles: **range-aware amount** = fraction of the target param span (fixes unitless products); attenuverter −1..1; per-route one-pole attack/release; musicality as gain staging.
- 4-stage pipeline: **signals → derived → routing → params** (adopted as D16).
- **Derived-signal registry** (bandEnv, flux, onset, barPhase, lfo1–4 BPM-synced, noiseS, rand) — the expressive layer shader authors actually reach for.
- De-bake hardcoded universals from `library.ts`; clean boundary: shader-routes → fragment uniforms, macro→universal routes → composite (D19).

## Agent 8 — Art director / creative
- 10 principles distilled: one thought per shader, restraint/negative space, color-role system (hero/structure/accent), musical syntax (movement follows musical grammar), visible causality (you see why it reacts), instrument honesty (each shader reads like one instrument), rhythm over richness, emergent simplicity, survives silence AND chaos, **curation as authorship**.
- Motion grammar: tempo-family, velocity ramp, attack shape catalog (kick≈fast-attack-slow-release, pad≈slow-swell).
- Category personalities: each of the 11 browser categories gets a motion + color + causality profile (fed the hero-shader spec, D24).
- Forbidden: test-pattern-level visual noise, 10-elements-a-frame soup, shaders that die without audio.

## Synthetic CAD (in-line attribution)
All technical docs (ARCHITECTURE, AUDIO_ENGINE, BPM_ENGINE, AUDIO_PARAMETER_GRAPH,
SHADER_SYSTEM, PERFORMANCE) derive directly from these agent outputs; conflicts were
resolved in DECISIONS.md.