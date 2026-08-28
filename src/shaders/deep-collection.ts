// Extreme-collection: DEEP generative families (200 shaders).
//
// Structurally adapted techniques from Phase-25 GitHub research (iq domain
// warp, kalis sets, truchet tiles, worley fields, gyroid, lyapunov chaos,
// spectral kaleidoscope, rosettes). Every family is enumerated over 20 seeded
// variants (hue offset × audio signal × warp seed × layout count) so each entry
// is a distinct, tweakable, compile-identical preset. Bodies are strict-GLSL
// safe by construction (see _gen-core.ts header).
import { bld, F, H, SIG, sigToSignal, body } from './_gen-core'

function genDeep(): ReturnType<typeof bld>[] {
  const out = []

  // 1. Warp Tunnel (20) — polar tunnel, bass-swelled, domain-warped walls
  for (let k = 0; k < 20; k++) {
    const h = H[k], s = SIG[k], n = 4 + (k % 11)
    const wq = 0.2 + 0.2 * (k % 3)
    const extra = [
      `float a=atan(p.y,p.x);`,
      `float rr=length(p);`,
      `float dst=1.0/(rr+0.05)+t*(0.25+${F(wq)});`,
      `dst+=${s}*0.4;`,
      `vec2 wq2=p+fbm(p*3.0+t*0.2)*distortion;`,
      `float ang=mod(a*folds+dst*2.0+fbm(wq2)*2.0,6.28318);`,
      `float wall=exp(-abs(fract(dst*0.4+noise(vec2(ang,dst)*1.5+t*0.1))-0.5)*8.0);`,
    ]
    const main = `pal(ang/6.28318+rr*2.0+${s}*0.8,${h})*wall*(0.3+0.6*sub+bass*0.4)*0.7`
    out.push(bld(`dp-tunnel-${k + 1}`, 'Warp Tunnel ' + (k + 1), 'fractals',
      `Domain-warped fractal tunnel swelling with ${s}`, body(extra, main),
      [{ id: 'folds', label: 'Folds', min: 2, max: 14, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'distortion', amount: 0.6, curve: 'log' }], tier: 'high' }))
  }

  // 2. Living Marble (20) — triple-fbm iq domain warp
  for (let k = 0; k < 20; k++) {
    const h = H[k], s = SIG[k]
    const base = 0.2 + 0.2 * (k % 3)
    const extra = [
      `vec2 q3=p+vec2(sin(t*0.3+${s}*2.0),cos(t*0.4+${s}))*(0.4+0.4*bass)*distortion;`,
      `float f1=fbm(q3*3.0+t*0.15);`,
      `float f2=fbm(q3*3.0+4.0*f1);`,
      `float f3=fbm(q3*5.0+4.0*f2);`,
      `float vein=exp(-abs(f2-0.5)*${F(8.0 + base * 6.0)});`,
    ]
    const main = `pal(f3*2.0+f1*0.5+f2+${s}*0.8,${h})*(0.35+0.65*f3)*(0.6+0.5*bass)+pal2(f3,${h})*vein*mid`
    out.push(bld(`dp-marble-${k + 1}`, 'Living Marble ' + (k + 1), 'abstract',
      `Triple-domain-warped flowing marble lit by ${s}`, body(extra, main),
      [],
      { audio: [{ signal: sigToSignal(s), param: 'distortion', amount: 0.5, curve: 'log' }], tier: 'high' }))
  }

  // 3. Kalis Orbit (20) — absolute-fold escape-time studio
  for (let k = 0; k < 20; k++) {
    const h = H[k], s = SIG[k]
    const push = 0.3 + 0.3 * (k % 3)
    const extra = [
      `vec2 kp = p*1.15;`,
      `float acc=0.0;`,
      `for(int i=0;i<8;i++){`,
      `  kp=abs(kp)/max(dot(kp,kp),0.001)-${F(push)};`,
      `  kp+=vec2(${s}*0.22,0.0)+uBass*0.04;`,
      `  acc+=exp(-length(kp)*0.9);`,
      `}`,
      `float kd=exp(-abs(length(p)-0.9)*2.0);`,
    ]
    const main = `pal(acc*0.8+${s}*0.5+kd,${h})*(0.35+acc*0.5)*(0.5+0.6*bass)*(0.7+kd*0.5)`
    out.push(bld(`dp-kalis-${k + 1}`, 'Kalis Orbit ' + (k + 1), 'fractals',
      `Kalis escape-time orbit coloured by ${s}`, body(extra, main),
      [],
      { audio: [{ signal: sigToSignal(s), param: 'distortion', amount: 0.5, curve: 'log' }], tier: 'high' }))
  }

  // 4. Truchet Flow (20) — randomized tile arcs
  for (let k = 0; k < 20; k++) {
    const h = H[k], s = SIG[k], n = 5 + (k % 8)
    const flip = 0.0 + 0.2 * (k % 3)
    const extra = [
      `vec2 g=floor(p*cells);`,
      `vec2 f=fract(p*cells)-0.5;`,
      `float v=hash(g+floor(t*0.5*(1.0+${s})));`,
      `vec2 fw=step(0.5,v)==1.0?vec2(f.y,f.x):f;`,
      `float d=min(abs(fw.x-fw.y),0.7-abs(fw.x+fw.y));`,
      `float line=exp(-abs(d)*14.0)*(0.7+${F(flip)}*step(0.75,v));`,
    ]
    const main = `pal(fw.x+fw.y+${s}*0.5+t*0.05,${h})*line*(0.55+0.5*bass)`
    out.push(bld(`dp-truchet-${k + 1}`, 'Truchet Flow ' + (k + 1), 'geometric',
      `Randomized truchet tile arcs flowing on ${s}`, body(extra, main),
      [{ id: 'cells', label: 'Cells', min: 2, max: 16, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'scale', amount: 0.45, curve: 'log' }] }))
  }

  // 5. Voronoi Flux (20) — worley F1 cells with flow field offset
  for (let k = 0; k < 20; k++) {
    const h = H[k], s = SIG[k], n = 4 + (k % 7)
    const extra = [
      `vec2 idv=floor(p*cells);`,
      `vec2 frv=fract(p*cells)-0.5;`,
      `float m=1.0;`,
      `vec2 mc=vec2(0.0);`,
      `for(int i=-1;i<=1;i++){`,
      `  for(int j=-1;j<=1;j++){`,
      `    vec2 off=vec2(float(i),float(j));`,
      `    vec2 gw=idv+off;`,
      `    vec2 rw=off+vec2(hash(gw),hash(gw+vec2(1.7,9.2)))-frv;`,
      `    float d2=dot(rw,rw);`,
      `    if(d2<m){m=d2;mc=gw;}`,
      `  }`,
      `}`,
      `float cellb=smoothstep(0.4,0.0,sqrt(m));`,
      `vec2 flow=mc+${s}*0.5+t*0.05;`,
    ]
    const main = `pal(length(flow)*2.0+cellb*0.3+${s}*0.5,${h})*(cellb*0.75+0.25)*(0.55+0.6*bass)`
    out.push(bld(`dp-voronoi-${k + 1}`, 'Voronoi Flux ' + (k + 1), 'geometric',
      `Flowing worley cell field driven by ${s}`, body(extra, main),
      [{ id: 'cells', label: 'Cells', min: 3, max: 12, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'distortion', amount: 0.4, curve: 'log' }] }))
  }

  // 6. Gyroid Lattice (20) — tri-periodic gyroid sheets
  for (let k = 0; k < 20; k++) {
    const h = H[k], s = SIG[k], n = 3 + (k % 6)
    const wspd = 0.2 + 0.1 * (k % 3)
    const extra = [
      `vec2 gp=p*lattice;`,
      `float gy=sin(gp.x+${s}*2.0)*cos(gp.y-t*(0.3+${F(wspd)}))+sin(gp.y-t*0.4)*cos((gp.x+gp.y)*0.7+${s}*1.5)+sin((gp.x+gp.y)*0.7)*cos(gp.x+t*0.5);`,
      `float want=exp(-abs(gy)*4.5)*(0.25+0.8*sub);`,
    ]
    const main = `pal(gy*0.5+length(gp)*0.2+${s}*0.5+t*0.04,${h})*want*(0.5+0.8*bass)`
    out.push(bld(`dp-gyroid-${k + 1}`, 'Gyroid Lattice ' + (k + 1), 'abstract',
      `Tri-periodic gyroid sheets pulsing with ${s}`, body(extra, main),
      [{ id: 'lattice', label: 'Lattice', min: 1, max: 10, def: n, step: 0.5, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'intensity', amount: 0.5, curve: 'log' }] }))
  }

  // 7. Chaos Field (20) — indexed lyapunov/logistic exponent map
  for (let k = 0; k < 20; k++) {
    const h = H[k], s = SIG[k], n = 8 + (k % 9)
    const extra = [
      `vec2 cg=floor(p*cols);`,
      `vec2 cf=fract(p*cols);`,
      `float x=0.5+0.35*sin(t*0.3+${s}*2.0);`,
      `float rA=2.8+1.4*${s};`,
      `float rB=3.4+1.2*bass;`,
      `float logSum=0.0;`,
      `for(int i=0;i<14;i++){`,
      `  float rr2=mod(float(i),2.0)<1.0?rA:rB;`,
      `  x=rr2*x*(1.0-x);`,
      `  logSum+=log(max(abs(rr2*(1.0-2.0*x)),1e-4));`,
      `}`,
      `float lyap=logSum/14.0;`,
    ]
    const main = `pal(lyap*6.0+cf.x+cf.y+${s}*0.4+t*0.05,${h})*(0.3+0.7*smoothstep(0.15,0.85,lyap))*(0.6+0.5*bass)`
    out.push(bld(`dp-lyapunov-${k + 1}`, 'Chaos Field ' + (k + 1), 'fractals',
      `Lyapunov chaos field marching to ${s}`, body(extra, main),
      [{ id: 'cols', label: 'Columns', min: 4, max: 20, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'distortion', amount: 0.6, curve: 'log' }] }))
  }

  // 8. Spectral Kaleido (20) — polar-folded oscilloscope kaleidoscope
  for (let k = 0; k < 20; k++) {
    const h = H[k], s = SIG[k], n = 4 + (k % 7)
    const extra = [
      `float a=atan(p.y,p.x);`,
      `float rr=length(p);`,
      `float fold=(6.28318)/segs;`,
      `float sa=mod(a,fold)-0.5*fold;`,
      `vec2 fp=rr*vec2(cos(sa)+${s}*0.3,sin(sa));`,
      `float wv=sin(fp.x*freq*2.0-t*2.0)*0.5+sin(fp.x*freq*1.4+t*3.0+${s}*1.5)*0.3+treb*0.7*sin(fp.x*freq+t*4.0);`,
      `float wl=exp(-abs(fp.y-wv)*14.0);`,
    ]
    const main = `pal(fp.x*2.0+wv+rr+${s}*0.6,${h})*wl*(0.45+0.75*treb)+(pal(rr*3.0,${h})*exp(-rr*3.0)*0.25*bass)`
    out.push(bld(`dp-kscope-${k + 1}`, 'Spectral Kaleido ' + (k + 1), 'synthwave',
      `Polar-folded oscilloscope kaleidoscope fed by ${s}`, body(extra, main),
      [{ id: 'segs', label: 'Segments', min: 3, max: 12, def: n, step: 1, group: 'shape' },
       { id: 'freq', label: 'Frequency', min: 2, max: 10, def: 5, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'intensity', amount: 0.6, curve: 'log' }], tier: 'high' }))
  }

  // 9. Rose Fold (20) — kaleidoscopic rosette petals
  for (let k = 0; k < 20; k++) {
    const h = H[k], s = SIG[k], n = 4 + (k % 9)
    const extra = [
      `float a=atan(p.y,p.x);`,
      `float rr=length(p);`,
      `float roser=0.5+0.45*cos(a*petals*0.5)+${s}*0.12+uBeatPhase*0.08;`,
      `vec2 fp2=rr*vec2(cos(a)+sin(a)*0.0,sin(a));`,
      `float pet=exp(-abs(length(fp2)-roser)*26.0);`,
      `float disc=exp(-abs(rr-0.5-${s}*0.2)*16.0)*sub;`,
    ]
    const main = `pal(a/6.28318*petals+rr*2.0+${s}*0.5+t*0.1,${h})*(pet*(0.5+0.8*beat)+0.2*disc)`
    out.push(bld(`dp-rosefold-${k + 1}`, 'Rose Fold ' + (k + 1), 'geometric',
      `Kaleidoscopic rosette unfolding on ${s}`, body(extra, main),
      [{ id: 'petals', label: 'Petals', min: 3, max: 18, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'distortion', amount: 0.5, curve: 'log' }] }))
  }

  // 10. Fractal Plasma (20) — heavy chained domain-warp plasma (veg-nod to fbm soups)
  for (let k = 0; k < 20; k++) {
    const h = H[k], s = SIG[k]
    const amp = 1.2 + 0.4 * (k % 3)
    const extra = [
      `vec2 w=vec2(fbm(p*2.0+t*0.3),fbm(p*2.0-t*0.3));`,
      `vec2 w2=vec2(fbm(p*3.0+w*${F(amp)}+t*0.2),fbm(p*3.0-w*${F(amp)}-t*0.2));`,
      `float pl=sin(length(w2)*${F(14.0 + amp * 4.0)}-t*1.5+${s}*4.0)+fbm(p*1.5+w2*2.0)+${s}*2.0;`,
    ]
    const main = `pal(pl/4.0+0.5,${h})*(0.5+0.8*bass)+pal2(pl/5.0,${h})*${s}*0.4`
    out.push(bld(`dp-plasma-${k + 1}`, 'Fractal Plasma ' + (k + 1), 'liquid',
      `Chain-warped fractal plasma roaring with ${s}`, body(extra, main),
      [],
      { audio: [{ signal: sigToSignal(s), param: 'distortion', amount: 0.6, curve: 'log' }], tier: 'high' }))
  }

  return out
}

export const GENERATED_DEEP: ReturnType<typeof bld>[] = genDeep()
export function getDeepCount() { return GENERATED_DEEP.length }