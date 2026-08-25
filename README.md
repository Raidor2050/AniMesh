# AniMesh

**Audio-Reactive Shader Laboratory & VJ Visualizer**

A browser-based instrument for electronic music visualization. AniMesh captures audio in real time and drives GLSL shaders through frequency analysis, beat detection, and smooth musical interpolation — creating a hypnotic, responsive visual experience.

---

## Features

### The AniMesh Core
A fullscreen WebGL2 shader canvas that responds to music in real time. Every shader is audio-reactive, driven by 6-band frequency analysis and beat detection tuned for electronic music (120-140 BPM).

### Audio Engine
- **Microphone input** — analyze live audio from any mic
- **System audio** — capture tab/system audio (Chrome)
- **Audio file** — upload any music file
- **Demo mode** — procedural audio for testing
- Energy-based beat detection with adaptive threshold
- 6-band frequency extraction: sub, bass, low-mid, mid, high-mid, treble
- Per-band ADSR smoothing envelopes

### Shader Library
40+ shaders across 9 categories:
- **Fractals** — Mandelbrot, Julia, Kaleidoscope, Menger, Sierpinski
- **VJ** — Tunnels, Radial Bursts, Spectrum, Waveforms, Strobes, Psychedelic
- **Geometric** — Grids, Voronoi, Mandala, Cellular
- **Liquid** — Fluid Distortion, Metaballs, Ink, Mercury
- **Cosmic** — Nebula, Black Hole, Galaxy, Aurora
- **Synthwave** — Horizon, City, Retrowave
- **Abstract** — Domain Warp, Interference, Plasma, Noise, Mesh
- **Particle** — Galaxy, Trails, Stardust
- **Minimal** — Pulse Circle, Lines, Breathing Light, Zen Circle, Concentric

### Shader Creator
A 5-step wizard for non-programmers:
1. **Mood** — Calm, Energetic, Dark, Cosmic, Organic, Chaotic
2. **Movement** — Flow, Pulse, Spiral, Drift, Burst, Orbit
3. **Intensity** — Subtle to Overwhelming
4. **Palette** — Neon, Pastel, Monochrome, Sunset, Ocean, Custom
5. **Generate** — Creates a unique shader with poetic naming

### Audio Mapping System
Connect audio signals to visual parameters:
- Bass → distortion, scale
- Kick → pulse, impact
- Treble → sparkle, particles
- Energy → brightness

### Shader Browser
- Masonry grid with live previews
- Category filtering and search
- Favorites (localStorage)
- Recently used shaders
- Keyboard shortcut: `B`

### Immersive Mode
Fullscreen shader with proximity-reveal HUD:
- Mouse near edge → controls fade in
- Mouse away → pure visual experience
- Keyboard: `←→` cycle shaders, `F` toggle, `ESC` exit

### Performance
- Raw WebGL2 rendering (no framework overhead)
- <14ms frame budget at 60 FPS
- Adaptive resolution scaling
- Total bundle: ~105KB gzipped

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `B` | Toggle Shader Browser |
| `N` | Open Shader Creator |
| `F` | Toggle Immersive Mode |
| `Ctrl+K` | Command Palette |
| `ESC` | Close active panel/overlay |
| `←` `→` | Cycle shaders (immersive) |
| `Space` | Pause/play time (immersive) |

---

## Tech Stack

- **TypeScript** + **Vite 6** — fast builds, ESM
- **React 18** — UI shell only, refs for all GL updates
- **Raw WebGL2** — maximum shader control
- **Web Audio API** — AnalyserNode with FFT
- **Zustand** — minimal state management
- **motion** — spring animations for panels

---

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Deployment

Built for GitHub Pages as a static SPA with hash routing.

```bash
npm run build
# Deploy dist/ to GitHub Pages
```

---

## Architecture

```
src/
├── core/          WebGL2 context, shader compiler, FBO manager
├── audio/         AudioContext, beat detection, band extraction
├── shaders/       Shader definitions, GLSL chunks, composition
├── renderer/      Render loop, post-processing, quality management
├── mappings/      Audio→visual mapping engine
├── components/    React UI (panels, controls, overlays)
├── ui/            Design tokens, CSS, animation presets
├── state/         Zustand stores (ui, shader, audio)
└── utils/         Math helpers, type definitions
```

---

## Audio-Reactive Mapping

| Audio Signal | Visual Effect | Genre Fit |
|-------------|---------------|-----------|
| Bass | Distortion, warp, scale | All electronic |
| Kick | Pulse, impact, flash | Techno, House |
| Snare | Particle burst | DnB, Breakbeat |
| Hi-hat | Fine sparkle, noise | House, Trance |
| Mid | Organic deformation | Trance, Progressive |
| Treble | Sparkle, particles | EDM, Festival |
| Beat | Scene transitions | All |
| Volume | Overall brightness | All |

---

## License

MIT

---

## Acknowledgments

Built with research from 30+ open-source repositories including LYGIA Shader Library, pmndrs/postprocessing, GL Transitions, Hydra Synth, Shader Park, Butterchurn, and Codrops Interactive Particles.
