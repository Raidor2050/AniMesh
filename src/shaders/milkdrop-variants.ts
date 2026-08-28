// Deterministic per-index GLSL variant builder for the MilkDrop preset set.
// The 120 presets previously shared one adapter fragment; each now gets a
// unique body assembled from distinct domain/wave/color/post blocks plus a
// per-index seed constant, guaranteeing 120 textually-unique fragments.
export const MILKDROP_HEADER = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform float uVolume;
uniform float uBeat;
uniform float uBeatPhase;
uniform float uBPM;
uniform float uSub;
uniform float uLowMid;
uniform float uHighMid;
uniform float uSpectralCentroid;
uniform float speed;
uniform float intensity;
uniform float distortion;
uniform float scale;
uniform float brightness;
uniform float hueShift;
uniform float saturation;
uniform float mdZoom;
uniform float mdRot;
uniform float mdDecay;
uniform float mdWarp;
uniform float mdGamma;
uniform float mdWaveMode;
uniform float mdWaveAlpha;
uniform float mdWaveScale;
uniform float mdWaveFreq;
uniform float mdObSize;
uniform float mdObAlpha;
uniform float mdIbSize;
uniform float mdIbAlpha;
out vec4 fragColor;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float f=0.0;float a=0.5;for(int i=0;i<5;i++){f+=a*noise(p);p*=2.01;a*=0.5;}return f;}

vec3 pal(float t){return 0.5+0.5*cos(6.28318*(vec3(1.0,0.7,0.4)*t+vec3(0.0,0.15,0.2)));}
`

const DOMAIN_SWIRL = `  { float r2=length(uv);
    float ang=(t*0.03+bass*0.05)*r2;
    uv*=mdZoom;
    uv=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*uv;
    uv*=1.0/(0.2+r2*0.4); }`

const DOMAIN_TUNNEL = `  { float r2=length(uv);
    uv*=mdZoom*(0.35+r2);
    float ang=1.0/(0.05+r2)*(t*0.02+mdRot*0.2);
    uv=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*uv; }`

const DOMAIN_KALEIDO = `  { uv*=mdZoom;
    float a=atan(uv.y,uv.x);
    float seg=6.28318/(3.0+mod(seed,3.0)+abs(mdWaveFreq));
    a=mod(a,seg); a=min(a,seg-a);
    uv=vec2(cos(a),sin(a))*length(uv); }`

const DOMAIN_MIRROR = `  { uv*=mdZoom;
    uv=abs(uv);
    float ang=mdRot+t*0.04;
    uv=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*uv;
    uv+=0.45*vec2(sin(uv.y*3.0+t),cos(uv.x*3.0-t)); }`

const DOMAIN_BREATH = `  { uv*=mdZoom*(1.0+0.15*sin(t*1.3+seed)+0.08*beat);
    float r2=length(uv);
    uv*=1.0-smoothstep(0.15,0.85,r2); }`

const DOMAINS = [DOMAIN_SWIRL, DOMAIN_TUNNEL, DOMAIN_KALEIDO, DOMAIN_MIRROR, DOMAIN_BREATH]

const WAVE_RINGS = `  { float d=length(uv);
    float ring=abs(d-0.32-bass*0.12);
    col+=pal(mdWaveFreq*0.5+t*0.05)*smoothstep(0.03,0.004,ring)*mdWaveAlpha; }`

const WAVE_BARS = `  { float a=atan(uv.y,uv.x);
    float bars=sin(a*mdWaveFreq*2.0+t*1.5)*0.5+0.5;
    col+=pal(mdWaveFreq*0.5+t*0.05)*bars*mdWaveAlpha*(0.7+0.3*bass); }`

const WAVE_LINES = `  { float line=sin(uv.x*mdWaveFreq*8.0+t*2.2)*0.12;
    float d=abs(uv.y-line);
    col+=pal(mdWaveFreq*0.5+t*0.04)*smoothstep(0.02,0.002,d)*mdWaveAlpha; }`

const WAVE_SPIRAL = `  { float a=atan(uv.y,uv.x);
    float sp=sin(length(uv)*22.0-t*3.0+a*mdWaveFreq)*0.5+0.5;
    col+=pal(mdWaveFreq*0.5+t*0.05)*sp*mdWaveAlpha*smoothstep(0.55,0.1,length(uv)); }`

const WAVE_BLOSSOM = `  { float a=atan(uv.y,uv.x);
    float r2=length(uv);
    float pet=cos(a*6.0+t*sqrt(abs(mdWaveFreq)+0.5))*r2;
    float d=abs(pet-0.16);
    col+=pal(r2*2.0+t*0.06)*smoothstep(0.03,0.003,d)*mdWaveAlpha*(0.8+0.4*beat); }`

const WAVE_FLOW = `  { float ff=fbm(uv*2.4+t*0.12);
    float d=abs(uv.y-sin(uv.x*6.0+ff*6.28+t*1.6)*0.18);
    col+=pal(ff*2.0+t*0.05)*smoothstep(0.015,0.002,d)*mdWaveAlpha; }`

const WAVES = [WAVE_RINGS, WAVE_BARS, WAVE_LINES, WAVE_SPIRAL, WAVE_BLOSSOM, WAVE_FLOW]

const COLOR_PULSE = `  col*=0.85+0.3*sin(t*0.7+seed);
  col+=uSpectralCentroid*0.12*pal(uSpectralCentroid+hueShift);`

const COLOR_MIX = `  col=col*(0.9+0.2*uTreble)+uVolume*0.1*pal(t*0.1+hueShift);`

const COLOR_LAYER = `  col=col*1.6-0.6;
  col*=vec3(0.7+0.5*sin(t*0.5+uMid*2.0+seed));
  col+=0.1*uLowMid*pal(0.3+seed);`

const COLORS = [COLOR_PULSE, COLOR_MIX, COLOR_LAYER]

const POST_GAMMA = `  col=pow(max(col,vec3(0.0)),vec3(1.0/mdGamma));
  float gray=dot(col,vec3(0.299,0.587,0.114));
  col=mix(vec3(gray),col,saturation);
  col=clamp(col,0.0,1.0);`

const POST_SCAN = `  col*=0.92+0.16*smoothstep(0.0,0.1,fract(gl_FragCoord.y*0.5+t*1.4));
  float gray=dot(col,vec3(0.299,0.587,0.114));
  col=mix(vec3(gray),col,saturation);
  col*=pow(mdGamma,0.4);
  col=clamp(col,0.0,1.0);`

const POST_VIGNETTE = `  col*=0.6+0.6*smoothstep(1.2,0.3,length(uv)*mdZoom);
  col+=uBeat*uBass*0.15*pal(t*0.2);
  col=mix(vec3(dot(col,vec3(0.299,0.587,0.114))),col,saturation);
  col=clamp(col,0.0,1.0);`

const POSTS = [POST_GAMMA, POST_SCAN, POST_VIGNETTE]

const seedOf = (i: number) => '0.' + String((i % 1000) + 1).padStart(4, '0')

export function buildMilkdropVariantFrag(i: number): string {
  const n = Math.abs(Math.trunc(i))
  const domain = DOMAINS[n % DOMAINS.length]
  const wave = WAVES[Math.floor(n / DOMAINS.length) % WAVES.length]
  const color = COLORS[Math.floor(n / (DOMAINS.length * WAVES.length)) % COLORS.length]
  const post = POSTS[Math.floor(n / (DOMAINS.length * WAVES.length * COLORS.length)) % POSTS.length]
  const seed = seedOf(n)
  return `${MILKDROP_HEADER}
void main(){
  float seed=${seed};
  vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
  float t=uTime*speed+seed;
  float bass=uBass*intensity;
  float beat=uBeat;
  uv*=clamp(scale,0.01,10.0);
  { float ang=mdRot*0.5+bass*0.08; uv=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*uv; }
  if(mdWarp>0.001){ uv+=vec2(fbm(uv*3.0+t*0.3),fbm(uv*3.0-t*0.2+100.0))*mdWarp*(0.5+bass*0.5)*0.15; }
${domain}
  vec3 col=vec3(0.0);
${wave}
  col*=brightness;
${color}
${post}
  fragColor=vec4(col,1.0);
}
`
}