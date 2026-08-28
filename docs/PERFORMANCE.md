# Performance

> This replaces the earlier Three.js-era performance doc. The app is raw WebGL2 singles
> full-screen quad; the blocker is fragment cost, not draw calls.

## Current state (Phase 9+ audit — supersedes aspirational spec below)

What shipped vs the budget tables in this doc (see FINAL_AUDIT for the full list):

- **Frame budgets met by construction**: single full-screen draw, <10 draw calls,
  adaptive resolution keeps GPU frame time under the 14 ms/16.7 ms desktop blanket
  (EMA over frame time, step-down 0.9 / step-up 1.05, 1 s cooldown,
  MIN 0.5×–MAX 1.0× — `src/renderer/adaptive.ts`, unit-tested).
- **GPU timing** via `EXT_disjoint_timer_query_webgl2` (polled async, disjoint
  discarded) with wall-clock EMA fallback.
- **Kawase bloom** at half-res (extract + 3 widening passes, ping-pong) — the
  aspirational 6-pass tier-gated chain is simplified: one always-on half-res
  chain (D04/D12); tier gates were dropped with the tier UI (D-B).
- **No quality-tier table in the UI.** D05's LOW/MED/HIGH/ULTRA table below is the
  design record; the realized system is a single automatic scale knob.
- **Initial JS ≈ 174 KB gz** (5 static chunks incl. the shader-data body chunk)
  vs the <150 KB target — accepted (D-A); bodies are cache-stable and the app
  chunk alone is 47 KB gz.
- **Pre-warm**: programs build on idle impl via `requestIdleCallback`; the
  compiled set is now **391 shaders** (not 381/406).

## Budgets (binding, per spec above — see "Current state" for realized deltas)

| Metric | Target | Hard limit |
|--------|--------|-----------|
| Frame time (total, desktop) | <14 ms | 16.7 ms |
| Frame time (mobile) | <17 ms | 20 ms (30fps floors acceptable) |
| GPU frame time | <12 ms | 15 ms |
| Draw calls | <10 (∅ ~7) | 20 |
| Texture memory | <256 MB | 512 MB |
| Initial JS (gzipped) | <150 KB | 175 KB (5 static chunks) |
| Full library LOADED (static shader-data chunk, 391 bodies) | <70 KB gz | 42.8 KB gz |
| Shader compile (cold, on switch) | <50 ms (paused ≤1 frame) | buddy to cache |
| React re-renders / sec during playback | 0 | <2 |
| Main-thread JS per frame (non-GL) | <1.5 ms | 3 ms |

## Quality system (D05/D07)

Tiers & render scale (applied to gl viewport; DPR caps 2.0 desktop / 1.5 mobile):

| Tier | Render scale | Bloom | Post | GPU timer |
|------|--------------|-------|------|-----------|
| LOW | 0.50× | off | grading only | on |
| MED | 0.70× | half-res Kawase | grading | on |
| HIGH | 0.85× | half-res Kawase | grading + vignette | on |
| ULTRA | 1.00× | full Kawase | grading + vignette | on |

Auto loop (closed, hysteresis):
1. GPU frame time sampled via `EXT_disjoint_timer_query_webgl2` async (begin/end per
   frame; QUERY_RESULT_AVAILABLE polled 2+ frames later; GPU_DISJOINT → discard).
2. Rolling percentile (p50/p95/p99) over last ~60 samples.
3. p95 > 14ms → step scale down once (min .5). Scale up by +0.05 only after 90
   consecutive good frames. Manual override stored in UI prefs.
4. Tier label = derived from resulting scale.

Fallback when timer-query unavailable: `performance.now()` around the GL calls
(approximate; relative drift acceptable).

## Kawase bloom (D04) cost model

bright-extract (1 pass) → down 2 levels (2) → up 3 levels (3) = 6 passes total on the
bright source, each at half of previous. Reads are 2×2 taps (cheap, sample-able). Memory:
×3 small FBOs + bright 512². vs single 5-tap: same pass count bracket, much softer high
frequencies, no banding bands in highlights. Tier-gated by scale (med/high: skip the
quarter-resolution upsample, run 3 passes).

## Adaptive resolution loop (D05)

```
per frame: if sampleReady: push sample
           tier = evaluate(p95)
           viewport = floor(canvas * scale * dpr)
uniform uResolution = viewport size (shaders adapt automatically)
```

Canvas element stays CSS 1:1; only backing store shrinks. uResolution passes the scaled
value to the fragment shader so SDFs don't stretch. Ghosting of composite math is fine
at 0.5× (we're within per-shader tolerance).

## Compile/caching (D02)

- `programCache: Map<hash(fragmentSource), WebGLProgram>` — hits skip compile entirely.
- `requestIdleCallback` pre-warm: build every category's program in priority order
  (default list, then library order). 391 programs × ~2–8 ms = seconds on idle
  backdrop; measure & cap with a per-slot budget (≤ 6 ms/slot).
- On switch: compile new if missing, atomically swap on success, keep old until then.

## Updates & GC

- Zero allocations in loop: re-used typed arrays, memoized map tables, LUT curves.
- localStorage writes batched (immediate on state change, throttled via requestIdleCallback in UI layer, never in audio/graph loop).

## React separations (D rule)

- Perf overlay, meters, fps — 2D canvas (or ref-DOM) updated at ~4 Hz by the loop.
- Store updates only on discrete user events (shader switch, tier, panel, source).

## Verification plan

- Chrome Performance panel 5s record: JS < 1.5ms/frame, no long tasks.
- `EXT_disjoint_timer_query` p95 check during raymarch hero at ULTRA.
- `renderer.info` — no texture/program growth across 50 switches (leak guard).
- Phone (Snapdragon 7-class, mobile Chrome): LOW at kicks, no dropped frames.