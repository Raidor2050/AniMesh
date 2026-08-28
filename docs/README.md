# AniMesh — Documentation Index

AniMesh is a **production-grade, audio-reactive shader library** that runs in the browser.
Raw WebGL2, zero render-framework, a 381-shader library, real-time audio analysis (mic,
file, system audio, demo synth) and a performant GPU pipeline — all in a BootSequence →
Editor → Immersive UI.

This folder is the single source of truth for the system's design. It was produced by a
10-agent research swarm (5 technical, 2 creative-technology, 3 GitHub-research) and a
team-synthesis pass, then validated against the implemented codebase.

## Document Map

| Doc | What it answers |
|-----|-----------------|
| [CURRENT_STATE.md](./CURRENT_STATE.md) | Where the project actually is today (baseline snapshot) |
| [DECISIONS.md](./DECISIONS.md) | The resolved architecture — every key decision + rationale |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Module graph, data flow, render pipeline, invariants |
| [AUDIO_ENGINE.md](./AUDIO_ENGINE.md) | FFT/bases/onset/BPM/clock design + engine API |
| [BPM_ENGINE.md](./BPM_ENGINE.md) | Free vs locked (RAW SOUND vs BPM) timing modes |
| [AUDIO_PARAMETER_GRAPH.md](./AUDIO_PARAMETER_GRAPH.md) | signals → macros → routes → params pipeline |
| [SHADER_SYSTEM.md](./SHADER_SYSTEM.md) | Catalog, chunk grammar, composition, hero shaders |
| [UX_SYSTEM.md](./UX_SYSTEM.md) | Panels, MacroBar, previews, a11y, motion |
| [PERFORMANCE.md](./PERFORMANCE.md) | Budgets, tiers, adaptive quality, GPU timing |
| [TESTING.md](./TESTING.md) | Test strategy, GLSL lint, QA checklist |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | How the app ships (manual + CI) |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | The Phase 3–14 execution plan + status |
| [RESEARCH.md](./RESEARCH.md) | Web + creative-tech research findings (10 agents) |
| [GITHUB_RESEARCH.md](./GITHUB_RESEARCH.md) | 28 evaluated repos + what we adopted |
| [PRODUCT_VISION.md](./PRODUCT_VISION.md) | Positioning, personas, product pillars |

## Reading Order

- **Newcomers**: README → CURRENT_STATE → PRODUCT_VISION → ARCHITECTURE → DECISIONS.
- **Audio engineers**: AUDIO_ENGINE → BPM_ENGINE → AUDIO_PARAMETER_GRAPH.
- **Graphics engineers**: SHADER_SYSTEM → ARCHITECTURE → PERFORMANCE.
- **Operators**: DEPLOYMENT → TESTING → IMPLEMENTATION_PLAN.

## Source of Truth Invariants

1. GL updates NEVER happen in React state — refs and imperative objects only.
2. All audio flows through one mutable `AudioSnapshot`.
3. The shader uniform contract is fixed (`UNIFORM_HEADER`); new shaders must conform.
4. Never break the "no shader fails, never blank" invariant — fallback shader is sacred.

## Status

- Phase 0–2 (inspect + research + synthesis) — **done**
- Phase 3–11 (implementation) — see [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- Phase 12–14 (final audit, commit, deploy) — pending