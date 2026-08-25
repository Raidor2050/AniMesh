# AniMesh — Research & Architecture Agents

## Research Swarm (8 Agents)

### Technical Research Agents (5)

| Agent | Role | Key Findings |
|-------|------|-------------|
| **Agent 1** | Browser Audio Engineer | AnalyserNode with fftSize=2048, energy-based beat detection, 6-band extraction, ADSR smoothing, getUserMedia constraints must disable processing, getDisplayMedia audio Chrome-only |
| **Agent 2** | Shader Engineer | WebGL2 targeting (96%+ support), string-template shader composition, SDF raymarching primitives, domain warping patterns, dual Kawase blur for post-fx, audio uniforms via float arrays |
| **Agent 3** | VJ / Audio-Reactive Specialist | Musical vs mechanical reactivity, bass→distortion/kick→scale/snare→impact/treble→sparkle mappings, logarithmic scaling, beat-synchronized transitions, autonomous motion during silence |
| **Agent 4** | Web Graphics Performance | Raw WebGL2 for VJ control, <14ms frame budget, adaptive resolution scaling, EXT_disjoint_timer_query for GPU timing, ref-based DOM updates bypassing React, shader compilation caching |
| **Agent 5** | Creative Technology / Interaction Designer | Canvas-first layout, glassmorphism only for overlays, proximity-reveal immersive mode, JetBrains Mono + Inter typography, boot sequence (4s generative), command palette for power users |

### GitHub Repository Research Agents (3)

| Agent | Repositories Evaluated | Top Adopt |
|-------|----------------------|-----------|
| **GitHub Agent 1** | Shader Repository Hunter (10 repos) | LYGIA (patterns), pmndrs/postprocessing, GL Transitions spec, Shader Park transpiler |
| **GitHub Agent 2** | Audio/VJ Repository Hunter (10 repos) | web-audio-beat-detector (algorithm insight), Butterchurn preset system, Codrops FBO particles, OpenVJ compositing |
| **GitHub Agent 3** | Creative UI Repository Hunter (10 repos) | Fragment IDE pattern, PolygonJS DAG, three-mesh-ui, Shpigford/studio SPA pattern |

**Total repositories evaluated: 30**

### Key GitHub-Derived Integrations

| Feature | Source | How Integrated |
|---------|--------|---------------|
| Shader transition spec (from/to/progress) | GL Transitions | Adopted uniform contract for shader crossfading |
| FBO particle architecture | Codrops Interactive Particles | Pattern used for GPU particle system |
| Surface-based compositing | OpenVJ | Multi-layer visual pipeline design |
| Rendering-backend abstraction | Fragment IDE | Shader browser thumbnail rendering |
| Composable GLSL modules | LYGIA patterns | Chunk-based shader composition system |
| Preset parameter system | Butterchurn | Audio-driven uniform update pattern |
| Adaptive quality system | fft-visualizer | Single-draw-call optimization insight |
| Multi-tool SPA layout | Shpigford/studio | Panel-based instrument layout |

## Architecture Agents (2)

| Agent | Role | Key Deliverables |
|-------|------|-----------------|
| **Architect 1** | Systems Architect | Module structure, shader engine architecture, audio pipeline, state management, render loop design, build configuration |
| **Architect 2** | Creative/UX Architect | Design token system, component hierarchy, shader browser spec, shader creator wizard flow, animation system, responsive strategy, accessibility |

## Development Conventions

### For Future Agents
1. **Never put GL updates in React state** — use refs exclusively for render-loop data
2. **All audio data flows through AudioSnapshot** — a single mutable object
3. **Shader composition uses `{{chunk:name}}`** template syntax
4. **Each shader category** is lazy-loaded via dynamic `import()`
5. **Panel animations** use motion library, not CSS transitions
6. **Design tokens** are in `src/ui/tokens.ts`
7. **GLSL strings** are `.ts` files exporting string constants (via vite-plugin-glsl or raw string imports)
8. **Performance overlay** updates via ref-based DOM, never React state
9. **Test shader switching** — always dispose old materials before creating new
10. **Audio permissions** must handle failure gracefully with demo mode fallback
