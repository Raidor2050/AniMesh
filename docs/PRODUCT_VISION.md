# Product Vision

## What AniMesh Is

A **live audio-reactive shader instrument and library.** Not a generator-blog, not a
demo-lambda — an instrument you open, feed a mic/stream/file/mouse, and perform visuals
with : a shader browser (380+ visuals) driven by a real audio engine, BPM-synced clock,
and an audio-parameter graph that maps sound to light with musicality, not laundry.

## Positioning

**For**: VJs, musicians, creative coders, live-streamers (as a scene source via
browser/display capture), and audiences who just want a pretty visualizer.

**Against**: heavy local VJ stacks (Resolume), generic audio visualizers, shader blogs
with no audio graph.

**Differentiator**: the *graph* — signals → macros → routes — plus a BPM-synced clock
with octave-corrected tempo tracking. Sound becomes *musical* visuals with one
semantic knob (Energy, Complexity, Motion), and raw slider access hides underneath.

## Pillars (each maps to a phase)

1. **Audio-first.** Every visual decision emerges from the audio graph. Silence survives;
   chaos is contained by confidence-gated beats (D12/D20).
2. **Bury the config.** Macros first; EQ panel second; per-param routes third. Defaults
   must sound good on launch with any source.
3. **Shaders are instruments, not wallpapers.** Each has a name, a tier, a one-line
   description, preset chips, and a silence behavior.
4. **A library you can browse, love, and remix.** Fast switching (program cache +
   crossfade), favorites, recents, undo, a11y announcer, keyboard-first.
5. **Production-sanctioned.** Loads in <2s on 4G, never blanks, recovers from context
   loss, ships with tests + CI + budgets.

## Personas

- **VJ (live)**: immersive mode, macro faders, bare-thumb capture. Listed speed of
  switching + reliability > feature count.
- **Musician / bedroom producer**: file or demo source, stuck on one shader, wants
  preset chips + musicality knob to feel "timed to the song."
- **Creative coder**: wants the raw EQ panel, routes editor, and deep shader library to
  ship their own body text hookups.
- **Listener**: shader browser on shuffle, autoplay demos, no interaction needed.

## Success Criteria (validated at FINAL_AUDIT)

1. `npm run build`, lint, `npm test` all green in CI.
2. Live site: boot → browse → select → crossfade without a hitch; 30s on every
   category without a blank or red frame.
3. No frame > 16.7ms (desktop ULTRA w/ raymarch hero), p95 GPU < 12 ms at HIGH.
4. Switch latency < 100 ms warm (cache hit), < 250 ms cold.
5. Mic-deny → demo mode works; system-audio silent path doesn't spam console.
6. Favorites/session survive a corrupted localStorage write (guard works).
7. `webglcontextlost` toast + restore = no crash, no blank.
8. Deploy to `gh-pages` via CI token + manual fallback documented.

## Explicitly Out of Scope (D35)

WebGPU, WebGL1 fallback, hardware feedback ping-pong, PWA/offline, Playwright E2E,
full generative creator UI, audio-visual exporting (record to video). Revisit only after
the core is proven live.

## Roadmap

1. **Foundation**: feature graph engine, audio upgrades (onsets/clock), renderer
   hardening (cache/context-loss/timer/adaptive/bloom), catalog+chunk split, hero wave.
2. **UX layer**: MacroBar, preset chips, a11y announcer, ErrorBoundary, reduced-motion.
3. **Delivery**: vitest + GLSL lint + CI + docs + FINAL_AUDIT + deploy.