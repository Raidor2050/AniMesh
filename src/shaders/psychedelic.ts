// Psychedelic collection (613 shaders, max 3 variants per family).
//
// Composition: 205 uniquely-named "scenes", each a distinct (domain × kernel ×
// colour) technique — kaleido folds, star folds, spirals, tunnels, warp vortices,
// plasma, mandalas, rosettes, interference, caustics, maze/truchet, spirograph,
// voronoi cells, vortex aura. Every scene has ≤ 3 seeded variants that differ in
// audio-signal binding, hue offset, seed and layout density, so no family ever
// exceeds the 3-variation budget and every fragment is textually unique.
//
// Audio reactivity is meaningful: bass swells zoom/warp, beat strobes, the entry's
// bound signal (bass/mid/treble/volume/sub/beat) drives the pattern phase and is
// also wired into `distortion` via audioMappings, and the color wash is
// centroid/beat-lit. Strict-GLSL-safe (see _gen-core.ts header).
import { AudioMapping } from '../utils/types'
import { bld, F, H, body } from './_gen-core'

const ADJ = [
  'Astral', 'Liquid', 'Solar', 'Chromatic', 'Acid', 'Primal', 'Morphic', 'Nebular',
  'Electric', 'Quantum', 'Hypnotic', 'Luminous', 'Spectral', 'Crystal', 'Iridescent',
  'Pulsar', 'Mirage', 'Tidal', 'Kaleidoscopic', 'Mercurial',
]
const NOUN = [
  'Lotus', 'Bloom', 'Veil', 'Maze', 'Ocean', 'Garden', 'Storm', 'Cascade', 'Waltz',
  'Current', 'Nova', 'Whirl', 'Mantra', 'Serpent', 'Haze', 'Oracle', 'Mirror',
  'Pulse', 'Vortex', 'Ember', 'Thrum', 'Lattice', 'Lava', 'Fracture', 'Cosmos', 'Reed',
]

const DNAME = ['Warp', 'Kaleido', 'Spiral', 'Tunnel', 'Starfold', 'Mirror', 'Orbit', 'Breathe']
const KNAME = ['Plasma', 'Mandala', 'Rosette', 'Arms', 'Rings', 'Interference', 'Caustic', 'Maze', 'Spiro', 'Bloom', 'Lattice', 'Cells', 'Vortex', 'Aura']

// Signals a variant can bind. All are prologue locals in _gen-core's P()`.
const MY_SIG = ['bass', 'mid', 'treb', 'vol', 'sub', 'beat']

const mapSignal = (x: string): AudioMapping['signal'] => {
  if (x === 'treb') return 'treble'
  if (x === 'vol') return 'volume'
  if (x === 'sub') return 'mid'
  return x as AudioMapping['signal']
}

// Domain transforms — mutate `p` before the kernel runs.
// `PARAM` is replaced by the entry's shape parameter id.
const DOMAINS: string[][] = [
  [`p+=vec2(fbm(p*2.0+t*0.3),fbm(p*2.0-t*0.3+9.0))*distortion*0.4;`],
  [`float ka=atan(p.y,p.x);float kr=length(p);float kf=(6.28318)/PARAM;ka=mod(ka,kf);ka=min(ka,kf-ka);p=vec2(cos(ka),sin(ka))*kr;`],
  [`float sa2=atan(p.y,p.x)+0.5*log(length(p)+0.02)+t*(0.2+${'${s}'}*0.2);p=length(p)*vec2(cos(sa2),sin(sa2));`],
  [`float tr=1.0/(length(p)+0.04);p*=tr*(0.8+0.6*bass);`],
  [`float sang=atan(p.y,p.x);p/=max(0.2,abs(cos(0.5*PARAM*sang)));`],
  [`p=abs(fract(p*PARAM)-0.5)+fbm(p*1.5+t*0.1)*distortion*0.2;`],
  [`p+=vec2(noise(p*4.0+t*0.3),noise(p*4.0-t*0.3));p*=1.0+0.25*sin(t*0.5+${'${s}'}*3.0);`],
  [`p*=1.0+0.3*sin(t*0.7+bass*2.0+${'${s}'});`],
]

// Kernels produce `float v`. `PARAM` is the entry's shape parameter id;
// `${s}` binds the entry's audio signal (bass/mid/treb/vol/sub/beat).
const KERNELS: string[][] = [
  [`float v=sin(p.x*PARAM+t)+sin(p.y*1.1*PARAM-t*1.2)+fbm(p*2.5+t*0.25)+${'${s}'}*2.0+bass*0.9;`],
  [
    `float a=atan(p.y,p.x);float rr=length(p);`,
    `float raysP=0.5+0.5*sin(a*PARAM+t*2.0);`,
    `float ringsP=pow(max(0.0,sin(rr*7.0-t*3.0+${'${s}'}*4.0)),3.0);`,
    `float v=raysP*ringsP*1.2+${'${s}'}*0.8;`,
  ],
  [
    `float a=atan(p.y,p.x);float rr=length(p);`,
    `float ro=0.5+0.4*cos(a*PARAM*0.5+t*1.5)+${'${s}'}*0.1;`,
    `float v=exp(-abs(rr-ro)*24.0)+0.4*pow(max(0.0,sin(rr*11.0-t*2.0)),2.0);`,
  ],
  [
    `float a=atan(p.y,p.x);float rr=length(p);`,
    `float spA=mod(a/6.28318*PARAM-log(rr+0.05)*1.6+t*0.6+${'${s}'}*0.5,1.0);`,
    `float v=smoothstep(0.3,0.0,abs(fract(spA*PARAM)-0.5));`,
  ],
  [
    `float rr=length(p)*(0.6+0.5*bass+${'${s}'}*0.2);`,
    `float ringT=exp(-abs(fract(rr*PARAM)-0.5)*7.0);`,
    `float v=ringT*(0.4+0.7*beat);`,
  ],
  [`float v=sin(length(p)*PARAM*2.0-t*2.0)+sin(atan(p.y,p.x)*PARAM+t*1.5)+sin(length(p)*PARAM+${'${s}'}*1.5);`],
  [`float v=fbm(p*PARAM+t*0.2+${'${s}'}*0.4+seed*0.01);`],
  [
    `vec2 gm=floor(p*PARAM);`,
    `vec2 fm=fract(p*PARAM)-0.5;`,
    `float vm=hash(gm+floor(t*(0.3+${'${s}'})));`,
    `vec2 fw=step(0.5,vm)==1.0?vec2(fm.y,fm.x):fm;`,
    `float v=exp(-abs(abs(fw.x)-abs(fw.y))*14.0);`,
  ],
  [`float v=0.5+0.5*sin(6.0*atan(p.y,p.x)+${'${s}'}*sin(length(p)*PARAM+t)*0.5-t*2.0);`],
  [
    `float a=atan(p.y,p.x);float rr=length(p);`,
    `float v=exp(-rr*(0.9+0.6*treb))+0.3*sin(a*PARAM-t*3.0)*exp(-rr*2.5);`,
  ],
  [
    `float gg=fbm(p*PARAM+t*0.2+seed*0.01);`,
    `float v=0.5+0.5*sin(p.x*PARAM*3.1415+gg*${'${s}'}*4.0+t*2.0);`,
  ],
  [
    `vec2 iv=floor(p*PARAM);`,
    `vec2 fr=fract(p*PARAM)-0.5;`,
    `float m=1.0;`,
    `for(int i=-1;i<=1;i++){`,
    `  for(int j=-1;j<=1;j++){`,
    `    vec2 of=vec2(float(i),float(j));`,
    `    vec2 gw=iv+of;`,
    `    vec2 rw=of+vec2(hash(gw),hash(gw+vec2(7.1,3.7)))-fr;`,
    `    float dd=dot(rw,rw);`,
    `    m=min(m,dd);`,
    `  }`,
    `}`,
    `float v=smoothstep(0.5,0.0,sqrt(m))*(0.5+0.5*sin(t*2.0+${'${s}'}*2.0));`,
  ],
  [`float v=0.5+0.5*sin(length(p)*PARAM-atan(p.y,p.x)*2.0+t*${'${s}'}*4.0+seed*0.01);`],
  [
    `float rr=length(p);`,
    `float wav=0.5+0.5*sin(rr*8.0-t*(1.0+0.5*bass)+${'${s}'}*2.0);`,
    `float v=wav*exp(-rr*1.6)*(0.5+0.6*bass)+exp(-abs(rr-0.45-0.15*bass)*20.0)*(0.3+0.8*beat);`,
  ],
]

// Colour expressions — `main` fed the kernel scalar `v`.
// `${s}` is the bound signal, `${h}` the hue offset (0.0–0.6).
const COLORS: string[] = [
  `pal(v*0.8+${'${h}'}+${'${s}'}*0.4, ${'${h}'})*(0.5+0.8*bass)+pal2(v, ${'${h}'})*${'${s}'}*0.3`,
  `pal(v+${'${h}'}+cnt*0.5, ${'${h}'})*(0.5+0.5*vol)+pal(v*1.5+${'${h}'}+0.3, ${'${h}'})*0.25*beat`,
  `pal(v*1.2+${'${h}'}+t*0.03, ${'${h}'})*(0.4+0.6*vol)+pal2(v*0.8+${'${s}'}, ${'${h}'})*0.35*treb`,
  `pal(v+${'${h}'}+t*0.04, ${'${h}'})*(0.55+0.55*beat)+pal(${'${s}'}*0.5+v*0.3+${'${h}'}, ${'${h}'})*${'${s}'}*0.35`,
  `pal(v*0.6+${'${h}'}, ${'${h}'})*(0.6+0.7*bass)*clamp(v,0.05,1.4)+pal2(v*1.5+${'${s}'}, ${'${h}'})*0.5*sub`,
]

const KERNEL_PARAM = ['freq', 'petals', 'petals', 'arms', 'rings', 'freq', 'freq', 'cells', 'freq', 'petals', 'freq', 'cells', 'petals', 'rings']
const D_PARAM_DOMAIN = new Set([1, 4, 5]) // domains that need a `sides` param

const PARAM_RANGE: Record<string, { min: number; max: number; label: string }> = {
  sides: { min: 3, max: 12, label: 'Sides' },
  petals: { min: 3, max: 18, label: 'Petals' },
  arms: { min: 2, max: 12, label: 'Arms' },
  rings: { min: 2, max: 14, label: 'Rings' },
  freq: { min: 2, max: 12, label: 'Frequency' },
  cells: { min: 2, max: 12, label: 'Cells' },
}

const SLUG_COUNT = 205 // 615 scene slots; trimmed to exactly 613 entries
const VARIANT_MAX = 3

function genPsychedelic(): ReturnType<typeof bld>[] {
  const out: ReturnType<typeof bld>[] = []
  for (let t = 0; t < SLUG_COUNT; t++) {
    const d = t % DOMAINS.length
    const k = Math.floor(t / DOMAINS.length) % KERNELS.length
    const c = Math.floor(t / (DOMAINS.length * KERNELS.length)) % COLORS.length
    const name = ADJ[Math.floor(t / NOUN.length) % ADJ.length] + ' ' + NOUN[t % NOUN.length]
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    // Every scene gets exactly 3 seeded variants — except the very last (1).
    const members = t < SLUG_COUNT - 1 ? VARIANT_MAX : 1
    for (let m = 0; m < members; m++) {
      const h = H[(t * 5 + m * 7) % H.length]
      const sig = MY_SIG[(t * 3 + m * 9) % MY_SIG.length]
      const paramId = D_PARAM_DOMAIN.has(d) ? 'sides' : KERNEL_PARAM[k]
      const n = 3 + ((t * 3 + m * 2) % 12)
      const range = PARAM_RANGE[paramId]
      const seed = F(out.length + 1)

      const extra = [
        `float seed=${seed};`,
        ...DOMAINS[d].map(l => l.replace(/PARAM/g, paramId).replace(/\$\{s\}/g, sig)),
        ...KERNELS[k].map(l => l.replace(/PARAM/g, paramId).replace(/\$\{s\}/g, sig)),
      ]
      const main = COLORS[c].replace(/\$\{s\}/g, sig).replace(/\$\{h\}/g, h)
      out.push(bld(
        `psy-${slug}-${m + 1}`, name, 'psychedelic',
        `Psychedelic '${name}' — ${KNAME[k]} in a ${DNAME[d]} domain, driven by ${sig}`,
        body(extra, main),
        [{ id: paramId, label: range.label, min: range.min, max: range.max, def: n, step: 1, group: 'shape' }],
        { audio: [{ signal: mapSignal(sig), param: 'distortion', amount: 0.5, curve: 'log' }], tier: out.length % 2 === 0 ? 'medium' : 'high' },
      ))
    }
  }
  return out
}

export const GENERATED_PSYCHEDELIC: ReturnType<typeof bld>[] = genPsychedelic()
export function getPsychedelicCount() { return GENERATED_PSYCHEDELIC.length }