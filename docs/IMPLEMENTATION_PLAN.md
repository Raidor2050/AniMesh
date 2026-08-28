# Implementation Plan (Phase 3–14)

Status legend: `[x] done · [ ] pending · [~] in progress`

## Phase 0 — Inspect `[x]`
Repo structure, configs, renderer, audio, shaders, state, UI, deploy method inventoried
(see CURRENT_STATE.md).

## Phase 1 — Research `[x]`
10 agents (5 web/technical, 3 GitHub research, 2 dedicated synthesis feeds). Outputs
condensed in RESEARCH.md / GITHUB_RESEARCH.md and resolved in DECISIONS.md.

## Phase 2 — Synthesis + Docs `[x]`
16 docs written; architecture locked (D01–D35).

## Phase 3 — Foundation refactor `[x]`
- `src/mappings/featureGraph.ts` (signals/macros/routes) + `profile.ts` + de-baked
  global profile; keep `Renderer` call-surface stable.
- `src/shaders/compose.ts` chunk resolver + `chunks.ts` registry; wire into `createShader`.
- Unit tests for both. **Build gate.**

## Phase 4 — Audio engine upgrade `[x]`
- Second (raw) analyser; SuperFlux onset; feature extras (rolloff/flatness/zcr);
  beat/clock split; `engineMode free|locked`; comb-filter tracker + octave correction +
  120 prior + slew + confidence; grid snapshots (bar/eighth/sixteenth); lfo1–4 output;
  remove debug log; silence handling. **Build + perf gate.**

## Phase 5 — Audio parameter graph wiring `[x]`
- FeatureGraph consumes snapshot → uniform map; renderer merges graph += params;
  MacroBar uniforms (uMacro…) into UNIFORM_HEADER + composite fan-out.
- Silence-hold + musicality live. **Build gate + manual audio bench.**

## Phase 6 — Shader system `[x]`
- `catalog.ts`; chunks + hero shaders + program cache + crossfade (dual FBO +
  uTransitionProgress); tier metadata pass on all 406.
- D21 lazy per-category split revised (see DECISIONS D21) → static `shader-data`
  chunk. **Build gate + switch-latency check.**

## Phase 7 — UX layer `[x]`
- MacroBar (5 faders) + advanced EQ subview; preset chips + undo; A11yAnnouncer;
  ErrorBoundary root+canvas; reduced-motion freeze; keyboard parity. **Build gate.**

## Phase 8 — Browser & previews `[ ]`
- Stationary-first preview posters (offscreen first-frame render), hover-live gated by
  tier; grid/carousel responsive check; implicit caching. **Build gate.**

## Phase 9 — Performance hardening `[x]`
- Kawase bloom replacement; adaptive scale loop w/ EXT timer-query hysteresis; DPR
  caps; context-loss listeners; perf overlay live data; leak check. **Frame-budget gate.**

## Phase 10 — Tooling & CI `[ ]`
- `scripts/check-shaders.mjs` wired into build; vitest suite complete; GH Actions
  workflow (lint+test+build; deploy on main). **npm test + build green in CI locally.**

## Phase 11 — Quality-control / audit `[ ]`
- Run TESTING.md manual checklist; fix; re-audit current-state doc deltas.
- Perf verification per PERFORMANCE.md budgets.

## Phase 12 — Final docs `[ ]`
- Update docs to final state; write `docs/FINAL_AUDIT.md` (checklist + metrics +
  deliberate deviations); refresh `Progress.md`.

## Phase 13 — Commit `[ ]`
- One logical commit (Angular style) per phase boundary already made; final commit(s)
  clean; ensure no secrets; review `git status`/`diff`.

## Phase 14 — Deploy + verify `[ ]`
- Push `main`; CI or manual deploy to `gh-pages`; verify live site (boot, categories,
  immersive, mobile, context-loss, no console spam).

## Risk register

| Risk | Mitigation |
|------|-----------|
| Lazy-load regression blanks library | Lint D21 + catalog tests; fallback = inline first 4 shaders |
| Clock/bpm hurts, not helps | Default mode stays `free`; locked engaged by user or confident clock |
| Kawase burns mobile budget | Tier-gating; measure p95; fall back to 3-pass half-res |
| Crossfade fights audio | Quantize to bar only when confident; else fixed 1.2s |
| Docs drift from code | FINAL_AUDIT diff + this plan updated each phase |