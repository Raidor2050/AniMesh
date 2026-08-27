# AniMesh Implementation Plan

Status: active — Universal Audio Reactivity + Web Experience Hardening
Branch: `main` (deploys to GitHub Pages via the `gh-pages` branch, `base: '/AniMesh/'`)

---

## 1. Objective

1. **Guarantee every shader (all 622) is visibly affected by sound** using proven,
   research-backed techniques (Butterchurn/MilkDrop universal-audio semantics).
2. **Harden the web experience** by adopting the top evaluated GitHub patterns
   (repo-hunter results), then ship: build, commit, and update the GitHub Pages site.

Prior work locks in the parameter-box contract: every shader's params (custom +
universal) are wired with pixel-identity at slider default (`wireParams` /
`wireUniversals`, commit `d373c47`). This plan builds **on top** of it.

---

## 2. Research Synthesis (5 agents + 3 GitHub hunters)

### Proven audio→visual semantics
| Source | Technique adopted |
|---|---|
| Butterchurn / MilkDrop | Universal audio uniform block pushed every frame; shaders opt in. Audio normalized to **1.0 = "normal"**, attack ≈0.2s / release ≈0.5s, long-term volume avg 0.992 |
| MilkDrop silence clamp | `if (longAvg < 0.001) { val = 1.0 }` → **identity at silence** (multiplicative params centered on 1.0) |
| AniMesh AudioEngine (exists) | 6-band RMS (sub…treble) with per-band attack/release smoothers, energy + spectral-flux beat detectors, BPM auto/tap, spectral centroid, noise gate at 0.02 |

### Guarantee architecture (3 layers, ordered by reach)
| Layer | Mechanism | Who it covers |
|---|---|---|
| A1. **Composite audio pump** | Post pass already runs on **every** shader. Add gated brightness / hue / zoom / bloom modulation driven by smoothed bass, volume, beat, spectral centroid. `uAudioGate` (0 at silence) multiplies every modulation → frame is pixel-identical in silence | All 622 |
| A2. **Per-body audio envelope** | `wireAudioEnvelope()` codegen: any body referencing **<2 audio uniforms** gets a gated `col *= (1 + envelope)` statement before `fragColor` | ~16 static hand-authored shaders (plus any marginal ones); covers direct-to-screen fallback when post-fx is unavailable |
| A3. (existing) **Audio mappings** | `AudioMappingEngine` drives universal params from signals (bass→scale, beat→intensity, mid→hueShift, treble→brightness, volume→brightness) | All custom + MilkDrop |

### Guardrails (from guardrail/architecture research)
- Unused/active uniforms: cache `getActiveUniform`-driven locations only (Renderer already does, `Renderer.ts:226`).
- Never redeclare built-ins (`length`, `dot`, `noise`, …) — parameter ids are renamed instead (existing `GLSL_BUILTINS` set).
- Injected snippets use nested braces / standalone statements — legal in GLSL ES 3.00.
- NaN guard must precede grading (exists at `Renderer.ts:61`).
- Brightness pumps stay small (≈×1.05–1.2) to avoid clipping/mechanical look.

### GitHub repo-hunter adoptions (top choices, verified licenses)
| Feature | From | License/Stars | Effort | Status |
|---|---|---|---|---|
| Command palette pattern | `pacocoursey/cmdk` | MIT ~14k★ | done (reasoned copy, zero-dep) | keep    |
| Error boundary | `bvaughn/react-error-boundary` | MIT ~7k★ | S | **add** |
| UI preference persistence | zustand `persist` pattern | MIT | S | **add (hand-rolled)** |
| PWA / offline shell | `vite-plugin-pwa` | MIT ~2.5k★ | S–M | **add (dependency-free)** |
| Perf/fps surface | `mrdoob/stats.js` | MIT 9.1k★ | M | skip this cycle (HUD space contested) |
| Shortcut surface | `react-hotkeys-hook` | MIT 3.5k★ | S | covered by existing `App` key handler + palette |
| WebGL robustness | AGENTS.md audit (`d070dda`) | n/a | done | context-loss recovery, dispose on switch, FBO fallback |

---

## 3. Implementation Steps

### 3.1 Universal audio reactivity
- `src/shaders/wireParams.ts`:
  - add `AUDIO_UNIFORMS` list + exported `wireAudioEnvelope(body)`; triggers when a body
    references fewer than 2 distinct audio uniforms; injects a gated envelope
    (`col = mix(col, col*(1 + 0.10*uVolume + 0.08*uBass + 0.05*uBeat + 0.04*uSub + 0.03*uSpectralCentroid), uAudioGate)`) before `fragColor`.
- `src/shaders/library.ts`:
  - add `uniform float uAudioGate;` to `UNIFORM_HEADER`;
  - `createShader`: `finalBody = wireAudioEnvelope(wireUniversals(wired.body, defs))`.
- `src/shaders/reactive-collection.ts`:
  - add `uAudioGate` to `HDR`; apply `wireAudioEnvelope` in `bld` (no-op for reactive bodies, safety net).
- `src/renderer/Renderer.ts`:
  - compute gate per frame: `clamp((volume − 0.008) / 0.032, 0, 1)` (volume pre-clamped 0…1, silenced ≈0);
  - `setUniforms(..., gate)`: upload `uAudioGate` (available to every shader header);
  - composite pass: gated bass zoom pulse, loudness/beat brightness pump, spectral-centroid hue drift, bass bloom gain — all × gate so silence ≠ identity.
- MilkDrop adapter untouched (`uBass`/`uBeat`/`uSpectralCentroid` already reference ≥2 audio → envelope skipped; composite layer covers post).

### 3.2 Web experience hardening (no new runtime deps)
- `src/components/ErrorBoundary.tsx`: class boundary + reload button (tokens-styled).
- `src/main.tsx`: wrap `<App/>`; register `{BASE_URL}sw.js` in production only.
- `src/state/stores.ts`: persist `qualityTier`, `streamPreset`, `minimizedPanels`, `panelsVisible` to `animesh-ui-prefs` (safeGet/safeSet pattern).
- `src/components/CommandPalette.tsx`: add commands (Cycle Quality Tier, Toggle Panels, Toggle Demo Audio, Reset UI Preferences); `role="dialog"`/`aria-modal`/`aria-label`/`aria-selected`.
- `public/manifest.webmanifest`, `public/icons/icon.svg`, `public/icons/mask-icon.svg`, `public/sw.js` (precache shell, runtime cache-first for hashed assets, network-first navigation), `index.html` meta/manifest/favicon links (Vite rewrites `/…` to base).

### 3.3 Deployment
- `npm run build`; verify with a shader-library audit script (acceptance below).
- Update `Progress.md`; commit on `main` (`feat: universal audio reactivity …`).
- Push `origin main`; build `dist` → `gh-pages` branch (git worktree) → push → verify `https://Raidor2050.github.io/AniMesh/`.

---

## 4. Acceptance Criteria
- **Every shader fragment** contains **≥2 distinct audio uniforms** OR a `uAudioGate`
  envelope statement (script-audited across `SHADER_LIBRARY` = 381-entry merged list of
  140 custom + 120 reactive + 121 MilkDrop).
- **uAudioGate** present in `UNIFORM_HEADER`, reactive `HDR`, and composite shader; silence ⇒ pixel-identical composite (modulations × 0).
- `npm run build` (tsc + vite) passes; no new dead params (scan), no unbalanced braces.
- PWA shell installable + offline-cached core; production assets prefixed `/AniMesh/`.
- UI prefs survive reload; command palette exposes new commands with working shortcuts.