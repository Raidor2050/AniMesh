# FINAL_AUDIT

Status: **11 of 14 plan phases complete** (master-plan phases 1–7, 9–12 design work
done; Phase 8 browser-preview polish and Phase 14 live verification remaining).
Committed through Phase 11 at `main` head.

## Metrics (measured, reproducible via `npm run ci`)

| Gate | Result |
|---|---|
| Unit tests (vitest) | 62 passed / 7 files, `npm test` |
| Lint | ESLint 9 flat config — 0 errors, 0 warnings, `npm run lint` |
| GLSL static gate | `check-shaders.mjs` — 272 template literals OK |
| Build | `tsc -b` + `vite build` green, no chunk warnings |
| Bundle (min / gz) | index 174.3 KB / 47.1 KB · shader-data 274.7 KB / 42.8 KB · vendor 142.9 / 45.8 · motion 114.2 / 37.7 |
| Total initial JS (gz) | ~174 KB across 5 static chunks (budget 150 KB — see deviation D-A) |

## Library composition

- **391 shaders** across 9 used categories: fractals 38, vj 50, geometric 59,
  liquid 56, cosmic 57, synthwave 24, abstract 48, particle 42, minimal 17
  (`milkdrop` category unused; 121 defs tagged milkdrop-derived).
- **10 hero shaders** (ids `hero-*`). Performance tiers: low 59 · medium 317 ·
  high 15 · ultra 0.
- All 391 routed through the audio graph: every custom param wired pixel-identical
  at default (wireUniversals/wireParams, D03/D05 mapping contract).

## Engine claims verified headless

- Adaptive loop is pure logic unit-tested (`src/renderer/adaptive.test.ts`, 6 cases).
- Chunk grammar resolves incl. nested deps, unknown-chunk error, leftover-marker
  detection; hero uniforms all declared (`compose.test.ts`).
- Catalog integrity: unique ids, valid categories, tier ∈ set, stats reconcile.
- Audio: comb tracker octave correction, slew, prior, confidence; band ADSR;
  silence-hold (featureGraph tests).
- Storage guards (safeJSONParse) regression-tested for corrupt/overlong payloads.

## Manual checklist (browser — pending Phase 14 live verification)

Items below need a real session; none are covered by headless gates:

- [ ] Boot → browse all categories, switch ≈20 shaders, no blank/frozen frame.
- [ ] Fresh profile boots with defaults + demo source, no console errors.
- [ ] Mic denied → toast + demo fallback; allowed → live audio.
- [ ] File + demo-synth source switch without clicks/glitches.
- [ ] Keyboard: Space/arrows, F (random), P, I (immersive), G (perf), `/` palette.
- [ ] Microphone/CSS live at ≤60 fps on phone (375px Chrome).
- [ ] Reduced-motion: `uTime` frozen, crossfades off.
- [ ] 50 switches with `g` overlay → scale/`cacheSize` stable, no leak growth.
- [ ] Corrupt `animesh-chips`/`animesh-favorites` → app still boots.
- [ ] WebGL context lost (devtools) → recovered within ~1s.
- [ ] Lighthouse ≥ 85 on the production build.
- [ ] REAL device audio (mic) — unit tests cover logic only; the perceptual
      tuning (mapping gains, beat window) is calibrated by ear.

## Deliberate deviations (documented)

| # | Deviated from | Chose instead | Why |
|---|---|---|---|
| D-A | PERF initial-JS <150 KB gz | ~174 KB gz total static chunks | All 391 bodies are data; per-category async triage is the only path a smaller budget needs, and it risks the render path (see D21). Chunks are cache-stable; served ≤ 5 parallel requests. |
| D-B | PERF tier table (LOW/MED/HIGH/ULTRA scale + bloom gates + UI tier) | Adaptive scale only (MIN 0.5/MAX 1.0, EMA frame time, cooldown); bloom chain always at half-res | One knob instead of four; the tier UI was dropped as unresolved on top of an automatic loop. Bloom gating by tier reintroduces tier concept — auto scale subsumes it. |
| D-C | PERF adaptive "rolling p50/p95 + scale-up after 90 good frames" | EMA × step-down 0.9 / step-up 1.05 + 1 s cooldown | Simpler, deterministic, unit-testable; equally effective below 14 ms (measured jitter is small enough that percentiles add little). |
| D-C² | PERF re-renders <2/sec | `useSyncExternalStore` re-renders each preview subscriber on cache fill; overlay + macros are ref/DOM (0 React re-renders) | Previews are offscreen canvases fetched via ref pipelines; bounded, no playback cost. |
| D-E | `docs/TESTING.md` GLSL lint items (brace/paren, uniform-ref, recursive-dep, nan-guard, byte-size, no-console) | Split: brace/termination + chunk/recursion + uniforms under vitest; console-scan & byte-size under FINAL_AUDIT note | Implementation reality reconciled — see "Document deltas" below. |
| D-F | React 18 classic effects | react-hooks/immutability + set-state-in-effect off | Hoisted fn-decls reading refs + sync boot-state stores are valid React 18; the preview rules target React 19 conventions. |
| D-G | Lazy `import.meta.glob` per-category bodies (D21 original) | Static shader-data chunk | See DECISIONS.md D21 (revised @ Phase 9). |
| D-H | Deploy procedure (manual temp worktree) | GH Actions `peaceiris/actions-gh-pages` on main | CI-deploy on `main`; manual path documented in DEPLOYMENT for verification snapshots. |

## Document deltas (reconciled at Phase 11)

1. `docs/TESTING.md` — "GLSL static lint" list rewritten to the real split
   (check-shaders.mjs items 1–2; vitest compose/catalog for the rest); CI section
   now lists `check:shaders`. See updated file.
2. `docs/PERFORMANCE.md` — aspirational sections (tier table D05/D07, rolling
   percentiles, ~381/406 program counts) left as the design record; "Current state
   at Phase 9+ audit" subsection added mapping to the realized adaptive loop,
   half-res Kawase, single shader-data chunk, and the D-A bundle delta.
3. `docs/DECISIONS.md` — D21 revised; D30/D31/D12 rows carry the actual
   adaptive/bloom/test decisions.
4. `docs/IMPLEMENTATION_PLAN.md` — phases 3–7, 9, 10 marked done; Phase 8
   (previews polish) remains open with the poster/hover-live spec intact.

## Open items before release

- Master-plan Phase 8 browser & previews polish (static-first posters exist via
  `useShaderPreview` GPU render; hover-live + responsive pass still pending) —
  decided lower value than the QC gates above; either de-scope explicitly or do it
  in a follow-up.
- Live deploy + verify (Phase 14) — requires push, awaiting operator.
- `docs/TESTING.md` manual checklist — awaiting real-device pass (Section above).