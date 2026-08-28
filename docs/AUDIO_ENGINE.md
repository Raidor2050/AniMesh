# Audio Engine (`audio/AudioEngine.ts`)

## Design

```
Source (mic/file/system/demo)
   → GainNode
   → smAnalyser (smoothingTimeConstant=0.8)   // best data for visuals
   → rawAnalyser (smoothingTimeConstant=0)    // onset/SuperFlux detection
   → destination (silent for file/system)
```

Two analysers (D08). `getByteFrequencyData` on both = ~0.6ms/frame, budgeted.

## Pipeline per frame

```
getByteFrequencyData (sm + raw)
   → 6-band log-spaced extraction (sub 20-60, bass 60-200, lowMid 200-600,
        mid 600-2000, highMid 2000-6000, treble 6000-16000)
   → per-band ADSR smoothing (attack ~150/120/100/80/60/50ms,
        release ~500/450/400/350/300/250ms)
   → volume (RMS), spectral centroid, rolloff, flatness, ZCR
   → onset detection (SuperFlux on raw streak) → onsetStrength, onsetOn
   → beat/clock subsystem (see BPM_ENGINE)
   → write AudioSnapshot (mutable, reused object — zero alloc)
```

## AudioSnapshot contract

```ts
type AudioSnapshot = {
  bands: Float32Array(6);          // [sub,bass,lowMid,mid,highMid,treble] smoothed 0..1
  volume: number; rms: number;
  beatOn: boolean; beatPhase: number;       // 0..1 within current beat
  bpm: number; confidence: number;          // clock confidence 0..1
  barPhase: number; downbeatConfidence: number;
  eighthPhase: number; sixteenthPhase: number;
  engineMode: 'free' | 'locked';
  onsetStrength: number; onsetOn: boolean;
  spectralCentroid: number; rolloff: number; flatness: number; zcr: number;
  derived: { flux, fluxEnv, bandEnv, lfo1..4, noiseS, rand };  // memoized by FeatureGraph
  silence: boolean;
};
```

All fields pre-allocated. `derived` fields are computed by the FeatureGraph (D17), not the
engine — the engine only fills primitives.

## Onset detection (SuperFlux, on raw analyser — D09)

```
flux[n] = Σ max(0, rawMag[n] - rawMag[n-1])       // HWR spectral flux, ~1700 Hz band
threshold = local max filter of flux over ~1s window
onsetOn  = flux > threshold * sensitivity
onsetStrength = flux / threshold                  // 0..~3
```

Onsets are one-frame events; shaders should read `onsetStrength` (decayed) not raw bool.
Sensitivity is user-adjustable (default ~1.3).

## Feature extractions

- **spectralCentroid** = Σ (bin*freqMag)/Σ freqMag (bands-weighted, cheaper than full FFT math).
- **rolloff** = bin where cumulative energy crosses 85%.
- **flatness** = geometric/arithmetic mean ratio per band-set (noise detector: drum ≈ low, noise ≈ high).
- **zcr** = zero-crossing rate on time data (percussive vs tonal).
These feed `flatness`/`zcr`-sensitive routes so shaders can react to *texture*, not just level.

## Engine API (stable surface)

```ts
class AudioEngine {
  init(): Promise<void>';
  switchSource(type: SourceType, cfg?): Promise<void>;   // mic/file/demo/system
  analyze(): AudioSnapshot;                              // 1/frame, mutates + returns
  setEngineMode(mode: 'free' | 'locked'): void;
  setManualBPM(bpm: number | null, strong?: boolean): void;
  onTap(): void;                                         // feed tap regression
  setOnsetSensitivity(s: number): void;
  dispose(): void;
}
```

## Silence handling (D20/D12)

When total energy < floor for > 3s: `silence = true`, confidence → 0, clock free-runs,
beat decay envelopes run to zero. FeatureGraph holds last values instead of shiver-decay
(silence identity). Demo source auto-drifts a gentle autonomous motion.

## No-alloc rules

- All Float32Arrays/Uint8Arrays pre-allocated at init; `analyze()` returns the same object
  mutated in place. No object creation inside the frame loop except where unavoidable in
  the graph (which memoizes).