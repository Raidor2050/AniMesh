# UX System

## Layout (existing, refined)

Canvas-first. UI overlays float over the live canvas: top title/source bar, left shader
browser (collapsible), right panel (params / EQ / macros / info), bottom transport.
Glassmorphism ONLY on overlays (never blocking the canvas). In immersive mode: HUD
reveals on tap/move; PREV/RANDOM/NEXT/EXIT with 44px targets; safe-area insets honored.

## MacroBar (D26) — the default controls

```
[ Energy ] [ Complexity ] [ Motion ] [ Musicality ] [ Atmosphere ]   ← 5 faders 0..1
```

Each fader maps through `Profile.macroDefs` → universal uniform (uMacroEnergy…) baked into
UNIFORM_HEADER and fan-out routes. Real-time, ref-driven (no React re-render per motion
event — single pointer handler updates graph.uniforms directly).
"Advanced" opens the full EQ/mapping panel (raw bands ↔ param sliders) for power users.

## Shader Browser

Grid of cards (thumbnail poster + name + category + tier badge + favorite). Card:
- static-first preview (D25): offscreen render of shader's first frame → poster dataURL
  persisted in catalog (per-build cache), `aria-busy` while true.
- hover: live preview toggle (tier-gated; ultra-tier browsers only by default),
  анонсед via A11yAnnouncer.
- click: switch with crossfade (D03) + announce.

## Preset chips (D27)

Per-shader panel shows 3–5 named param presets (e.g. "Tight", "Bloom", "Dark") — clicking
applies router+params, undo via one-step history (Ctrl+Z / back gesture). User can save a
custom chip (stored in presets store, guarded localStorage).

## A11y & motion safety

- `A11yAnnouncer` (sr-only live region): announces shader switches, mode changes, errors.
- Keyboard: arrows navigate grid, Enter/F apply/random, P toggle play, I immersive,
  ? palette. Focus ring visible, high contrast on overlays.
- `prefers-reduced-motion` (D29): freeze `uTime`, disable crossfades/auto-advance,
  static posters instead of hover-live.
- Touch: 44px targets, pe-dismiss HUD, `touch-action: manipulation`, `user-select: none`
  on controls, `overscroll-behavior: none`.
- Permission failures (mic/system): toast + demo-mode fallback, no dead-ends.

## Boot sequence (D30)

4s generative boot (brand + shader-instrument metaphor, skippable via tap/space or
keyboard shortcut) → lands on Browse (canvas already live with the last shader or "Bassdust").

## Error presentation

- ErrorBoundary panels render a slim inline error w/ retry, canvas ErrorBoundary falls
  back to FALLBACK shader + toast. Compile errors: overlay with shader id + line.
- Never a white/frozen screen; invariant (D28).

## Design tokens

Jetrova Mono + Inter (existing), tokens in `src/ui/tokens.ts` (dual-theme + glass values).
High-frequency UI (perf overlay, meters) = 2D canvas/ref-DOM, not React (perf rule).