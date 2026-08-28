# Audio Parameter Graph

Replaces `mappings/AudioMappingEngine.ts` (naive `signalValue × amount` additive mapper)
with a four-stage graph (D16). The graph is the bridge between `AudioSnapshot` and the
uniforms the renderer feeds shaders with.

## Stages

```
 Stage 1  SIGNALS      raw snapshot + derived feature registry (memoized)
 Stage 2  MACROS       5 semantic knobs (Energy, Complexity, Motion, Musicality, Atmosphere)
 Stage 3  ROUTES       per-target: source → curve → envelope → amount(attenuverter) → op
 Stage 4  FAN-OUT      resolved values → uniform map (param ids + universal names)
```

## Types

```ts
export type Curve = 'linear' | 'log' | 'exp';
export type RouteOp = 'add' | 'multiply' | 'mix';
export type SignalSource =
  | keyof AudioSnapshot
  | 'bandEnv.sub' | 'bandEnv.bass' | 'bandEnv.lowMid' | 'bandEnv.mid'
  | 'bandEnv.highMid' | 'bandEnv.treble'
  | 'flux' | 'fluxEnv' | 'onset' | 'onsetEnv' | 'barPhase' | 'conf'
  | 'lfo1' | 'lfo2' | 'lfo3' | 'lfo4' | 'noiseS' | 'rand';

export interface Route {
  id: string; src: SignalSource;
  target: string;                  // uniform/param id (must exist)
  amount: number;                  // attenuverter −1..1 (fraction of span)
  curve?: Curve;                   // 'linear' default
  attack: number; release: number; // one-pole time constants (s)
  op?: RouteOp;                    // 'add' default
  min?; max?;                      // clamp to target's span
  weight?: number;                 // per-route multiplier after envelope
}

export interface MacroDef {
  id: 'uMacroEnergy' | 'uMacroComplexity' | 'uMacroMotion'
     | 'uMacroMusicality' | 'uMacroAtmosphere';
  route: Omit<Route,'target'>;     // src + shaping; fan-out to universal uniform
  description: string;
}

export interface Profile {
  macros: Record<string, number>;         // UI override 0..1 (+1 default)
  macroDefs: MacroDef[];
  globalRoutes: Route[];                  // macro→universal composite fan-out (de-baked D19)
  perShader: Record<string, Route[]>;     // ShaderDefinition.routes override on load
}
```

## Semantics

- **Range-aware amounts (D16)**: `amount` is a fraction of the *target's* span, so a
  "$+0.4 speed" means +40% of the speed slider range, not some absolute product. This is
  the fix for the current mapper where amount is unitless and unclamped.
- **Attenuverter**: negative amount inverts the source (bass ducking treble = amount −,
  feels like sidechain without plugins).
- **Curves**: `linear` raw; `log` compresses loud low-end into gentle motion; `exp` makes
  mid/high events punchy (LUT-free exp approximation for frame cost).
- **Per-route one-pole attack/release** (defaults 40ms/260ms) — replaces the fixed 8/s
  expDecay in the old mapper. Short attack = punchy; long release = glow.
- **ops**: `add` (base ± curve), `multiply` (scaling, 0-safe: mix toward 1), `mix`
  (crossfade between target's default and the mapped value via amount).
- **Musicality (D18)**: a global `musicality` 0..1 gain applied after envelopes so the
  artist can tune "how literal" the graph is, rather than editing 60 routes.

## Derived signal registry (D17)

Computed lazily, memoized per frame, cleared only on frame flip:

```
bandEnv.bass, ...       per-band normalized energy with env
flux (raw), fluxEnv     spectral flux + envelope
onset, onsetEnv         onsetStrength + decayed strength
barPhase                from clock (locked) or free-run
conf                    clock confidence
lfo1..4                 BPM-synced LFOs (period = 1, 2, 4, 8 bars in locked;
                        free-run at estimated period otherwise)
noiseS                  smooth noise 0..1 (wander)
rand                    per-frame random 0..1 (dither)
```

## Silence identity guard (D20)

If `snapshot.silence`, routes freeze: envelopes hold last output; no decay-to-zero jitter
on bodies that map silence to empty. Only LFO/noiseS continue (ambient drift) per the
"survives silence" principle.

## Runtime cost

All float math, zero alloc (pre-allocated tables), <0.5ms typical. Worst case 381 shader
routes × ~10 routes is still far under; per-frame we evaluate routes lazily on target
dirty flag + cheap table lookups.

## Integration points

- `Renderer` keeps calling `graph.applySnapshot(snapshot)` then reads
  `graph.uniforms` (a flat `Map<string, number>`), merged into the same buffer that feeds
  shader params. The mapping UI (advanced EQ panel) edits `Profile`, the MacroBar edits
  `Profile.macros`.

## Test surface (vitest)

1. amount as fraction-of-span, clamping to min/max.
2. attenuverter negative inversion, curve endpoints, envelope decay constants.
3. op mix ≈ weighted crossfade; multiply never ≤ 0 via guard.
4. musicality gain staging; silence hold.
5. lfo phase alignment vs barPhase in locked mode; free-run fallback.
6. de-baked universals: every Route.target exists in global uniform list.