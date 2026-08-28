# Shader System

## Sources & composition model

Two GLSL sources today: `library.ts` (3480 lines, hand-written, cross-era) and
`milkdrop-generated.ts` (4837 lines, auto-generated) plus `reactive-collection.ts`.
`wireParams.ts` builds the "wired" full source per shader.

### Composition (unchanged contract, extended)

```
fragmentSource(id) = UNIFORM_HEADER + COMMON_NOISE + resolveChunks(body) + wiredBody
```

Where `resolveChunks` expands `{{chunk:name}}` tokens (D22). Chunks live in
`shaders/chunks.ts` (registry: noise variants, domain warp, palette, sdf prims,
raymarch, kaleid, moiré, feedback helpers). Chunks are shareable, dependency-aware
(`{{chunk:a}}` may reference `{{chunk:b}}`), and their expansion is cached.

## Catalog split (D21)

```
shaders/
  catalog.ts            // ShaderDefinition[] metadata: id,name,category,tier,params,routes
                        //      (entry-chunk weight ~40KB, mostly ids)
  chunks.ts             // chunk registry
  compose.ts            // header+noise+chunk resolve
  library/ …generative.ts …raymarch.ts …beat.ts …abstract.ts …
                        // lazy `import.meta.glob('./library/*.ts')` — bodies load on category open
  wireParams.ts         // retained (code-gen for wired bodies)
  types.ts              // ShaderDefinition/ShaderParam/ShaderMeta (extends library.ts's defs)
```

Every body exports the same shape (`{ body: string; meta: … }`) so the lazy loader can
register into `catalog.ts` metadata without circular imports.

## Metadata contract (`ShaderMeta`, per shader)

```ts
type ShaderDefinition = {
  meta: { id, name, category, author?, description, tags[], audioReactive,
          qualityTier: 'low'|'medium'|'high', visualEnergy: 0..1 };
  params: ShaderParam[];            // {id,label,type,default,min,max,step,group}
  routes: Route[];                  // per-shader audio routes (D18) — optional
  body: string;                     // wired GLSL or chunk-composed GLSL
  transitions?: string[];           // chunk names for crossfade candidates
};
```

## Categories (11) — reuse existing browser categories

generative, raymarch, milkdrop, beat-synced/beat, abstract, distortion,
particle, transition, noise, texture/pixel, feedback.

## Hero shader wave (D24) — 10 new shaders using chunk grammar

1. **moiré-feedback** (feedback) — domain-composed concentric moiré + slow feedback drift; `low`.
2. **ghost-rivers** (generative) — fbm domain-warp streamlines; `medium`, beats fan out into hue.
3. **quaternion-slice** (raymarch) — 4D quaternion Julia slice animated by beat-pop; `high`.
4. **mandelbox-lite** (raymarch) — cirumnescALE mandelbox, bass scales distance, low tier.
5. **voronoi-warpgrid** (generative) — smooth Voronoi + curl distortion; `medium`.
6. **palette-kaleid** (abstract) — polar kaleidoscope, saturation from spectral centroid; `low`.
7. **bass-dust** (particle-like) — pseudo-particle galaxy using hash+orbit, bass → orbit speed; `medium`.
8. **pulse-lines** (beat-synced) — eighth-grid pulse lines, barPhase gate; `low`.
9. **flat-earth-texture** (texture/pixel) — glitchy texture breakup reacting to flatness/ZCR; `low`.
10. **last-light** (transition) — crossfade-friendly gradient/afterglow, moiré-lite; `low`.

Each: single visual idea (A8), explicit silence behavior, tier recorded, ≤3 routes
auto-derived (e.g. bass→scale, centroid→saturation, onset→distortion).

## Rules for bodies

- Must reference only UNIFORM_HEADER names (D32 lint — unresolved uniform = fail).
- `{{chunk:...}}` must resolve (lint fails otherwise).
- No `#include`, no dynamic loops with runtime bounds unless tier=high.
- math consts at top, `mainImage`/`main()` naming consistent with existing contract
  (current via `wireParams`).
- A shader that ignores audio must still compile with `audioReactive:false` (works with
  demo drift / no permission, D10-safety).

## Crossfade (D03)

In renderer: two FBOs (from/to), both programs compiled & pre-warmed, `uTransitionProgress`
0→1 over N beats (locked) or fixed 1.2s (free); composite blends with soft-light-ish mix;
chunk candidates come from `transitions[]` metadata. Switch completes by deleting the `from`
program (program cache keeps it for recall).

## Lint (D32, in `scripts/check-shaders.mjs`, wired into build)

- Balanced `{}`/`()` counts per body.
- Every `uniform` reference in body appears in UNIFORM_HEADER or is declared locally.
- `{{chunk:...}}` known names + no unresolved recursive deps.
- Composite uniform list ⊇ graph universal output (de-baked universals lose nothing).
- NaN-guard string present in composite source.
- No `console.` in non-UI modules.