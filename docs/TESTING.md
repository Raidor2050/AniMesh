# Testing Strategy

## Principles (D31/D32)

- **vitest** for pure logic only — deterministic, fast, CI-safe. No WebGL, no DOM.
- GL stays: static lint (build-time) + manual regression checklist (human).
- Every bug class from the past (blank-on-corrupt-localStorage, NaN frames, drift)
  gets a regression test where the logic is testable.

## Unit surface (vitest)

| Suite | Covers |
|-------|--------|
| `mappings/featureGraph.test.ts` | Route math: amount-as-fraction-of-span, clamp min/max, attenuverter inversion, curve endpoints (linear/log/exp), op add/multiply/mix, musicality scaling, silence-hold, envelope one-pole step toward target |
| `mappings/derive.test.ts` | flux/fluxEnv/onset/onsetEnv decay, bandEnv, lfo phase align (locked) vs free-run, noiseS/rand determinism under fixed seed |
| `audio/tempo.test.ts` | comb vs known interval sequences (synthetic onset train), octave correction (2:1 and 1:2 cases), 120-BPM prior, slew-limit, confidence ramp, silence → confidence 0 |
| `audio/bands.test.ts` | log-spaced band edge mapping, ADSR smooth attack/release shapes, volume/RMS, centroid/rolloff/flatness/zcr edges |
| `shaders/compose.test.ts` | chunk resolution incl. nested deps + unknown-chunk error, header+noise+body concat shape, wireParams output stability |
| `state/guards.test.ts` | safeJSONParse: valid, malformed JSON, wrong-type, deep-corrupt (favorites/recent) |
| `shaders/catalog.test.ts` | every lazy body present for its catalog id; mandatory metadata fields; tier ∈ allowed set; route targets ∈ known uniforms |

## GLSL static lint (build-time, `scripts/check-shaders.mjs`)

Runs inside `npm run build` after `tsc -b`:
1. Per-body `{}`/`()` balance; unterminated string.
2. Uniform references resolve to UNIFORM_HEADER or local declarations.
3. `{{chunk:name}}` resolution incl. recursive-dep detection.
4. Composite nan-guard present.
5. Lint {{chunk}} expansion output byte-size sane (<64KB per body — compile safety).
6. No `console.` in `src/audio`, `src/renderer`, `src/mappings`.

## Manual regression checklist (FINAL_AUDIT phase)

- [ ] Boot → browse → every category open + shader switch, no blank/no red frame.
- [ ] Fresh profile: launches with defaults, demo source, no console errors.
- [ ] Mic deny → toast + demo fallback; allow → live.
- [ ] File mp3 + demo synth switch quickly.
- [ ] Immersive: tap reveal, all 4 buttons ≥44px, safe-area on iPhone.
- [ ] Keyboard: arrows, F/random, P, I, ? palette.
- [ ] Mobile (phone 375px Chrome): carousel/grid responsive, no overflow.
- [ ] Reduced-motion: time frozen, no crossfade jank.
- [ ] 50 shader switches → `renderer.info` textures/programs stable (no leak).
- [ ] Corrupt `animesh-favorites` in devtools → app still boots.
- [ ] `webglcontextlost` via devtools → toast + restored visual within 1s.
- [ ] Google Lighthouse perf ≥ 85 on production build.

## CI

On push/PR to `main`: `npm ci` → `npm run lint` → `npm test` → `npm run build`
(includes shader lint). On `main` only: deploy to `gh-pages` (see DEPLOYMENT).

## Known blind spots (accepted)

- No in-CI GLSL execution, no E2E screenshots, no cross-browser matrix beyond dev+CI
  (Safari/Firefox manually sampled). Cost of a real GL runner > value at this stage.