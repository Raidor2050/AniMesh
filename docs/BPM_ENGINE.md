# BPM Engine

Splits "beat detection" from "tempo tracking" (D12). Two planes live behind the single
`AudioSnapshot.beatOn/beatPhase/bpm` surface:

## Modes

### `engineMode: 'free'` (RAW SOUND)

Wall-clock driven, transient-driven feel. Uses energy + spectral-flux threshold beat
detection on the smoothed analyser with adaptive threshold and 200ms min interval
(existing behavior, retained). `beatPhase` resets on detected beat. No grid commitment.

### `engineMode: 'locked'` (BPM)

Musically reinforced grid. Beat clock runs continuously:

```
clock phase += dt / beatDuration
beatDuration (s) = 60 / currentBPM
```

Phase *re-anchors* to the nearest detected onset, never resets (D14). Grid derived from
phase: quarter, eighth (phase*2 % 1), sixteenth (phase*4 % 1), bar (phase/4 % 1), with
downbeat set by downbeat confidence. Swing applies a recorded offset to eighth/sixteenth
phases (swing amount 0..0.5, default 0, "triplet" presets pre-baked).

## Tempo estimation (locked mode only)

| Source | Priority | Notes |
|--------|----------|-------|
| MediaSession metadata (explicit BPM) | 1 | Authoritative when engine present |
| Comb-filter tracker | 2 | Primary live estimate |
| Tap regression (onTap) | 3 | User-explicit, clamps tracker |
| Manual override | 4 | Hard set, holds |

### Comb-filter tracker (D10, D11)

```
state: period (in samples), impulses[], confidence, lastJump
per onset impulse at t:
  for candidate period p in 50..1200ms (50→120 BPM search via comb comparisons of
  inter-onset gaps): combine evidence → correlation
  candidate with best evidence wins; apply octave correction:
    if candidate ≈ ~2× current → accept if it keeps musical identity of downbeat:
      correct to the harmonic that maximizes downbeat strength under the 120 BPM prior
  slew-limit the accepted BPM change (max ±X% per update window)
    — no sudden jumps (D14)
confidence = consistency ratio (agreement of last N intervals) × prior factor
  1.2× bias toward 120 BPM
if confidence < lockThreshold: clock stays in FREE drift (keeps last BPM guess),
  does NOT force-quantize random onsets (antifragile silence/chaos, D12).
```

Octave correction is the mandatory piece: raw inter-onset interval trackers systematically
report half/double tempo. The 120 BPM prior weights `2:1` subdivisions (dance music).

## Beat grid → snapshot

```
beatPhase      = phase % 1                       0..1
barPhase       = (phase / beatsPerBar) % 1       0..1  (beatsPerBar = 4)
eighthPhase    = (phase*2) % 1
sixteenthPhase = (phase*4) % 1
downbeatConfidence = max(0, confidence) when barPhase near 0, else decaying
beatOn = (previous bar of phase) crossed ms boundary
```

## TrustGrid (confidence model, D11)

Confidence drives three gates:
1. `bpm` is blnded toward the estimate only as confidence rises.
2. `barPhase`/`downbeatConfidence` are only reported as trustworthy above a threshold.
3. lfo1-4 (see feature graph) only align to bar exact at high confidence; else they
   free-run at estimated period.

## Free ↔ locked transitions

No hard switching mid-bar: entering locked aligns the clock phase to the most recent DOWN
onset; exiting free carries the last period as a running phase (drift until re-lock).
Crossfades and lfo alignment read `engineMode` and behave accordingly (crossfade quantizes
to bar only in locked mode with confident downbeat).