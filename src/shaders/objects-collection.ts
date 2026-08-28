// GL OBJECT collection (96 entries): full-screen fragments that read as crisp
// audio-reactive OBJECTS on dark — rings, spectrum bars, lissajous, orbiting
// nodes, petals, waveform ribbons, strobe grids, spark bursts, polygon stars,
// chains, comet trails, torus scanners. Structurally shaped by Phase-25 object
// research (Lissajous XY, radial equalizer arcs, orbit-by-bass, onset impulse).
// Strict-GLSL safe (see _gen-core.ts); pure epilogue keeps objects clean.
import { bld, F, H, SIG, sigToSignal, body } from './_gen-core'

function genObjects(): ReturnType<typeof bld>[] {
  const out = []
  const q = (k: number) => 0.2 + 0.2 * (k % 3)

  // 1. Audio Rings (8) — rotating arc bands, radius pumped by bass
  for (let k = 0; k < 8; k++) {
    const h = H[k], s = SIG[k], n = 6 + (k % 5)
    const extra = [
      `float a=atan(p.y,p.x);`,
      `float rr=length(p);`,
      `float arch=0.5+0.5*sin(a*slots-t*1.5+${s}*2.0);`,
      `float bandR=0.22+0.32*arch*(0.5+0.5*bass)+uBeatPhase*0.05;`,
      `float ring=exp(-abs(rr-bandR)*width);`,
    ]
    const main = `pal(a/6.28318+rr*2.0+${s}*0.6,${h})*ring*(0.35+0.8*treb)+pal(rr*4.0,${h})*exp(-abs(rr-0.18)*30.0)*sub`
    out.push(bld(`obj-rings-${k + 1}`, 'Audio Rings ' + (k + 1), 'geometric',
      `Rotating spectral arc bands pumped by ${s}`, body(extra, main),
      [{ id: 'slots', label: 'Slots', min: 3, max: 16, def: n, step: 1, group: 'shape' },
       { id: 'width', label: 'Width', min: 8, max: 48, def: 26 + (k % 4) * 6, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'distortion', amount: 0.5, curve: 'log' }], tier: 'high', epilogue: 'pure' }))
  }

  // 2. Spectrum Bars (8) — radial equalizer bars
  for (let k = 0; k < 8; k++) {
    const h = H[k], s = SIG[k], n = 16 + (k % 9) * 4
    const extra = [
      `float a=atan(p.y,p.x);`,
      `float rr=length(p);`,
      `float bi=mod(a/6.28318+0.5,1.0);`,
      `float eh=0.5+0.5*sin(bi*24.0-t*(0.5+${F(q(k))})+${s}*3.0);`,
      `float barR=0.10+0.48*eh*(0.4+0.6*bass);`,
      `float seg=step(0.5,abs(fract(bi*bars)-0.5));`,
      `float bd=exp(-abs(rr-barR)*16.0)*seg;`,
    ]
    const main = `pal(bi+rr*1.5+${s}*0.5,${h})*bd`
    out.push(bld(`obj-bars-${k + 1}`, 'Spectrum Bars ' + (k + 1), 'particle',
      `Radial equalizer bars vibrating with ${s}`, body(extra, main),
      [{ id: 'bars', label: 'Bars', min: 8, max: 96, def: n, step: 2, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'intensity', amount: 0.6, curve: 'log' }], epilogue: 'pure' }))
  }

  // 3. Lissajous (8) — XY attractor trace, freq/phase from audio
  for (let k = 0; k < 8; k++) {
    const h = H[k], s = SIG[k]
    const ax = 1 + (k % 4), bx = 2 + (k % 4), ph = 1.1 + 0.2 * (k % 3)
    const extra = [
      `float lt=fract(t*(0.28+${s}*0.4));`,
      `float lx=cos(${F(ax)}*6.28318*lt+${s}*2.0+uBeatPhase*0.6);`,
      `float ly=sin(${F(bx)}*6.28318*lt+${F(ph)});`,
      `vec2 lp=vec2(lx,ly)*(0.72+0.35*bass);`,
      `float d=length(p-lp);`,
      `float trace=exp(-d*26.0);`,
      `float halo=exp(-d*7.0)*0.28;`,
    ]
    const main = `pal(lt*3.0+${s}*0.5,${h})*(trace+halo)+pal(lx*0.5+0.5,${h})*exp(-abs(length(p)-1.05-(0.15*bass))*10.0)*0.18*mid`
    out.push(bld(`obj-lissajous-${k + 1}`, 'Lissajous ' + (k + 1), 'abstract',
      `Stereo-pair lissajous trace chasing ${s}`, body(extra, main),
      [],
      { audio: [{ signal: sigToSignal(s), param: 'intensity', amount: 0.5, curve: 'log' }], tier: 'high', epilogue: 'pure' }))
  }

  // 4. Orbit Nodes (8) — bass-pumped orbital particles
  for (let k = 0; k < 8; k++) {
    const h = H[k], s = SIG[k], n = 5 + (k % 4)
    const extra = [
      `vec3 accn=vec3(0.0);`,
      `float nb=bodies;`,
      `for(int i=0;i<8;i++){`,
      `  float fi=float(i);`,
      `  float rat=mod(fi,nb)/nb;`,
      `  float angt=rat*6.28318*(1.0+fi*0.13)+t*(0.25+0.3*bass)+${s}*1.5;`,
      `  vec2 ctr=vec2(sin(angt),cos(angt*1.3))*vec2(0.7,0.62)*(0.8+0.28*sub);`,
      `  float rad=0.075+${s}*0.1+0.03*sin(t*4.0+fi);`,
      `  float dd=length(p-ctr);`,
      `  accn+=pal(rat+${h},${h})*exp(-dd*dd*34.0);`,
      `}`,
    ]
    const main = `accn*(0.6+0.8*bass)+pal(${s}*2.0,${h})*exp(-abs(length(p)-0.9)*9.0)*0.14*mid`
    out.push(bld(`obj-orbits-${k + 1}`, 'Orbit Nodes ' + (k + 1), 'particle',
      `Orbiting glow nodes on ${s}`, body(extra, main),
      [{ id: 'bodies', label: 'Bodies', min: 3, max: 9, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'scale', amount: 0.5, curve: 'log' }], epilogue: 'pure' }))
  }

  // 5. Petal Field (8) — radial petals blooming with bass
  for (let k = 0; k < 8; k++) {
    const h = H[k], s = SIG[k], n = 5 + (k % 6)
    const extra = [
      `float a=atan(p.y,p.x);`,
      `float rr=length(p);`,
      `float petalE=0.5+0.5*sin(a*petals*0.5-t*1.2+${s}*2.0);`,
      `float pr=0.3+0.42*petalE*(0.4+0.6*bass)+uBeatPhase*0.05;`,
      `float pd=exp(-abs(rr-pr)*22.0)*(0.6+0.6*step(0.35,petalE));`,
    ]
    const main = `pal(a/6.28318*petals+rr*1.5+${s}*0.5,${h})*pd`
    out.push(bld(`obj-petals-${k + 1}`, 'Petal Field ' + (k + 1), 'geometric',
      `Radial petal field blooming with ${s}`, body(extra, main),
      [{ id: 'petals', label: 'Petals', min: 3, max: 18, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'distortion', amount: 0.5, curve: 'log' }], epilogue: 'pure' }))
  }

  // 6. Wave Ribbon (8) — scrolling oscilloscope ribbon band
  for (let k = 0; k < 8; k++) {
    const h = H[k], s = SIG[k], n = 4 + (k % 6)
    const extra = [
      `float wvy=sin(p.x*freq+t*2.0)+${s}*1.2*sin(p.x*freq*0.7-t*3.0)+treb*0.5*sin(p.x*freq*0.4+t*4.0);`,
      `float wamp=0.13+${s}*0.3+sub*0.08;`,
      `float wvpos=wvy*wamp;`,
      `float fv=exp(-abs(p.y-wvpos)*12.0);`,
      `float fv2=exp(-abs(abs(p.y-wvpos)-0.028)*70.0);`,
    ]
    const main = `pal(p.x*2.0+${s}*2.0+t*0.2,${h})*(fv*0.5+fv2*1.2)*(0.5+0.6*treb)`
    out.push(bld(`obj-waves-${k + 1}`, 'Wave Ribbon ' + (k + 1), 'synthwave',
      `Oscilloscope ribbon waving on ${s}`, body(extra, main),
      [{ id: 'freq', label: 'Frequency', min: 2, max: 12, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'scale', amount: 0.45, curve: 'log' }], epilogue: 'pure' }))
  }

  // 7. Strobe Grid (8) — beat-gated equalizer grid cells
  for (let k = 0; k < 8; k++) {
    const h = H[k], s = SIG[k], n = 3 + (k % 5)
    const extra = [
      `vec2 gc=floor(p*gridN);`,
      `vec2 gf=fract(p*gridN)-0.5;`,
      `float gy=0.5+0.5*sin(gc.x*1.1+gc.y*1.7-t*(0.5+beat*2.0)+${s}*2.0);`,
      `float gcell=step(gf.x*gf.x+gf.y*gf.y,0.12)*(0.15+0.85*gy)*(0.3+0.7*beat);`,
      `float gline=exp(-abs(length(gf)-0.5)*32.0)*0.22;`,
    ]
    const main = `pal(gc.x*0.11+gc.y*0.07+${s}*0.4,${h})*(gcell+gline)`
    out.push(bld(`obj-grid-${k + 1}`, 'Strobe Grid ' + (k + 1), 'vj',
      `Beat-gated equalizer grid cells on ${s}`, body(extra, main),
      [{ id: 'gridN', label: 'Density', min: 2, max: 10, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'intensity', amount: 0.7, curve: 'log' }], epilogue: 'pure' }))
  }

  // 8. Spark Burst (8) — per-beat radial particle impulses
  for (let k = 0; k < 8; k++) {
    const h = H[k], s = SIG[k], n = 5 + (k % 6)
    const extra = [
      `vec2 sid=floor(p*sparks);`,
      `vec2 sf=fract(p*sparks)-0.5;`,
      `float rnd=hash(sid);`,
      `float life=fract(t*(0.35+${F(q(k))})+rnd*3.0);`,
      `float burst=1.0-smoothstep(0.0,0.6,abs(life-0.5));`,
      `vec2 dir=vec2(cos(rnd*6.28318),sin(rnd*6.28318));`,
      `float dist=life*0.9*(0.5+0.7*bass);`,
      `float dd2=length(sf*0.5-(dir*dist)*(0.25+0.12*${s}));`,
      `float sp=exp(-dd2*dd2*44.0)*burst*(0.35+0.8*beat);`,
    ]
    const main = `pal(rnd+${s}*0.5+t*0.05,${h})*sp`
    out.push(bld(`obj-sparks-${k + 1}`, 'Spark Burst ' + (k + 1), 'particle',
      `Radial spark bursts firing on ${s}`, body(extra, main),
      [{ id: 'sparks', label: 'Sparks', min: 4, max: 14, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'intensity', amount: 0.6, curve: 'log' }], epilogue: 'pure' }))
  }

  // 9. Polygon Morph (8) — star polygons, vertex count by centroid
  for (let k = 0; k < 8; k++) {
    const h = H[k], s = SIG[k], n = 4 + (k % 6)
    const extra = [
      `float a=atan(p.y,p.x);`,
      `float rr=length(p);`,
      `float radiusStar=(0.34+0.26*smoothstep(0.2,0.9,${s})+uBeatPhase*0.05)/abs(cos(0.5*sides*a));`,
      `float pol=exp(-abs(rr-radiusStar)*22.0);`,
    ]
    const main = `pal(a/6.28318*sides+rr*2.0+${s}*0.5,${h})*pol*(0.5+0.7*beat)`
    out.push(bld(`obj-polygons-${k + 1}`, 'Polygon Morph ' + (k + 1), 'geometric',
      `Star polygon morphing with ${s}`, body(extra, main),
      [{ id: 'sides', label: 'Sides', min: 3, max: 10, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'distortion', amount: 0.5, curve: 'log' }], epilogue: 'pure' }))
  }

  // 10. Audio Chain (8) — mirrored wobbling chain strands
  for (let k = 0; k < 8; k++) {
    const h = H[k], s = SIG[k], n = 5 + (k % 8)
    const extra = [
      `float cphase=fract((p.x+1.0)*0.5*links+${s})*6.28318-t*1.5*(0.7+0.4*bass);`,
      `float cwob=sin(cphase)*0.22;`,
      `float ch=exp(-abs(p.y-cwob)*16.0)*smoothstep(0.0,0.45,1.0-abs(p.x));`,
      `float ch2=exp(-abs(p.y+cwob)*16.0)*smoothstep(0.0,0.45,1.0-abs(p.x))*0.4;`,
    ]
    const main = `pal(p.x*1.5+${s}*0.5+cwob,${h})*ch+pal2(cwob,${h})*ch2`
    out.push(bld(`obj-chains-${k + 1}`, 'Audio Chain ' + (k + 1), 'abstract',
      `Mirrored wobbled chain strands on ${s}`, body(extra, main),
      [{ id: 'links', label: 'Links', min: 3, max: 24, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'distortion', amount: 0.6, curve: 'log' }], epilogue: 'pure' }))
  }

  // 11. Comet Trails (8) — rotating spur trails on sub-bass ring
  for (let k = 0; k < 8; k++) {
    const h = H[k], s = SIG[k]
    const extra = [
      `float a=atan(p.y,p.x);`,
      `float rr=length(p);`,
      `float theta=mod(a/6.28318-t*(0.2+0.3*bass),1.0);`,
      `float trail=smoothstep(0.92,0.0,abs(theta-fract(${s}*0.4+t*0.12)));`,
      `float hone=exp(-abs(rr-0.42-0.14*sub)*26.0)*trail;`,
    ]
    const main = `pal(theta+rr*2.0+${s}*0.5,${h})*hone*(0.5+0.8*treb)`
    out.push(bld(`obj-comets-${k + 1}`, 'Comet Trail ' + (k + 1), 'cosmic',
      `Rotating comet trails orbiting ${s}`, body(extra, main),
      [],
      { audio: [{ signal: sigToSignal(s), param: 'intensity', amount: 0.5, curve: 'log' }], epilogue: 'pure' }))
  }

  // 12. Torus Scan (8) — rotating ring scanner with spokes
  for (let k = 0; k < 8; k++) {
    const h = H[k], s = SIG[k], n = 6 + (k % 5)
    const extra = [
      `float a=atan(p.y,p.x);`,
      `float rr=length(p);`,
      `float spin=fract(t*0.25*(1.0+0.6*bass)+${s}*0.3);`,
      `float ring=exp(-abs(rr-0.4-0.09*sin(a*6.0+t*0.8+${s}*2.0)-0.07*bass)*38.0);`,
      `float spoke=smoothstep(0.78,0.38,rr)*exp(-abs(fract(a/6.28318*spokes+spin*spokes)-0.5)*20.0);`,
    ]
    const main = `pal(a/6.28318+rr*1.5+${s}*0.5,${h})*(ring+spoke*0.5)*(0.5+0.6*bass)`
    out.push(bld(`obj-torus-${k + 1}`, 'Torus Scan ' + (k + 1), 'vj',
      `Rotating scanner ring with spokes on ${s}`, body(extra, main),
      [{ id: 'spokes', label: 'Spokes', min: 3, max: 16, def: n, step: 1, group: 'shape' }],
      { audio: [{ signal: sigToSignal(s), param: 'scale', amount: 0.5, curve: 'log' }], epilogue: 'pure' }))
  }

  return out
}

export const GENERATED_OBJECTS: ReturnType<typeof bld>[] = genObjects()
export function getObjectsCount() { return GENERATED_OBJECTS.length }
