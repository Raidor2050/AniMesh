import { ShaderDefinition, ShaderCategory } from '../utils/types'

const MILKDROP_ADAPTER_FRAG = `#version 300 es
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
uniform float mdCx;
uniform float mdCy;
uniform float mdDecay;
uniform float mdGammaAdj;
uniform float mdWarp;
uniform float mdWaveMode;
uniform float mdWaveAlpha;
uniform float mdWaveScale;
uniform float mdWaveSmoothing;
uniform float mdWaveParam;
uniform float mdWaveR;
uniform float mdWaveG;
uniform float mdWaveB;
uniform float mdWaveX;
uniform float mdWaveY;
uniform float mdObSize;
uniform float mdObR;
uniform float mdObG;
uniform float mdObB;
uniform float mdObA;
uniform float mdIbSize;
uniform float mdIbR;
uniform float mdIbG;
uniform float mdIbB;
uniform float mdIbA;
uniform float mdDarken;
uniform float mdBrighten;
uniform float mdSolarize;
uniform float mdInvert;
uniform float mdDarkenCenter;
out vec4 fragColor;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float f=0.0;float a=0.5;for(int i=0;i<5;i++){f+=a*noise(p);p*=2.01;a*=0.5;}return f;}

vec3 palette(float t,vec3 a,vec3 b,vec3 c,vec3 d){return a+b*cos(6.28318*(c*t+d));}

void main(){
  vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
  float t=uTime*speed;
  float bass=uBass*intensity;
  float beat=uBeat;
  float treb=uTreble;

  vec2 center=vec2(mdCx-0.5,0.5-mdCy);
  uv-=center;

  float z=mdZoom*(1.0+bass*0.25+uVolume*0.1);
  uv*=z;
  float r=mdRot+t*0.02+beat*0.15;
  float cs=cos(r);float sn=sin(r);
  uv=mat2(cs,-sn,sn,cs)*uv;
  uv+=center;

  if(mdWarp>0.001){
    float warpStr=mdWarp*(0.5+bass*0.5);
    uv+=vec2(fbm(uv*3.0+t*0.3),fbm(uv*3.0+t*0.3+100.0))*warpStr*0.15;
  }

  float decay=mdDecay;
  float trail=sin(t*(1.0-decay)*8.0+fbm(uv*2.0)*3.14)*0.5+0.5;
  trail=mix(0.3,1.0,trail*decay);

  vec3 col=vec3(0.0);

  vec3 waveCol=vec3(mdWaveR,mdWaveG,mdWaveB);
  if(length(waveCol)<0.01)waveCol=palette(mdWaveParam*0.5+t*0.05,vec3(0.5),vec3(0.5),vec3(1.0,1.0,0.5),vec3(0.8,0.9,0.3));
  waveCol+=vec3(bass*0.2,0.0,treb*0.3);
  waveCol*=trail*brightness;

  float waveMode=mdWaveMode;
  if(waveMode<1.5){
    float d=length(uv-vec2(mdWaveX,1.0-mdWaveY));
    float ring=abs(d-mdWaveScale*0.3-bass*0.1);
    float wave=smoothstep(0.02,0.005,ring)*mdWaveAlpha;
    col+=waveCol*wave;
  }else if(waveMode<3.5){
    float a=atan(uv.y-0.5,uv.x-0.5);
    float d=length(uv-vec2(0.5));
    float bars=sin(a*(8.0+mdWaveParam*4.0)+t*2.0)*0.5+0.5;
    float mask=smoothstep(mdWaveScale*0.2,mdWaveScale*0.4,d);
    col+=waveCol*bars*mask*mdWaveAlpha*trail;
  }else if(waveMode<5.5){
    float sx=floor(uv.x*40.0)/40.0;
    float waveVal=noise(vec2(sx*10.0,t*3.0+mdWaveParam))*mdWaveScale;
    float d=abs(uv.y-0.5-waveVal*0.2);
    float line=smoothstep(0.02,0.002,d)*mdWaveAlpha;
    col+=waveCol*line*trail;
  }else{
    float d=length(uv-vec2(0.5));
    float spiral=sin(d*20.0*mdWaveScale-t*3.0+atan(uv.y-0.5,uv.x-0.5)*mdWaveParam)*0.5+0.5;
    float mask=smoothstep(0.5,0.1,d);
    col+=waveCol*spiral*mask*mdWaveAlpha*trail;
  }

  if(mdDarkenCenter>0.01){
    float d=length(uv-vec2(0.5));
    col*=1.0-mdDarkenCenter*smoothstep(0.0,0.5,d);
  }
  if(mdBrighten>0.01)col+=mdBrighten*0.05;

  if(mdObA>0.01){
    float d=length(uv-vec2(0.5));
    float ob=smoothstep(0.5-mdObSize,0.5-mdObSize+0.01,d)*smoothstep(0.5,0.5-0.01,d);
    col=mix(col,vec3(mdObR,mdObG,mdObB),ob*mdObA);
  }
  if(mdIbA>0.01){
    float d=length(uv-vec2(0.5));
    float ib=smoothstep(mdIbSize,mdIbSize+0.01,d)*smoothstep(0.0,0.01,d);
    col=mix(col,vec3(mdIbR,mdIbG,mdIbB),ib*mdIbA);
  }

  col=pow(max(col,vec3(0.0)),vec3(1.0/mdGammaAdj));

  if(mdSolarize>0.01)col=mix(col,1.0-col,mdSolarize);
  if(mdInvert>0.01)col=mix(col,1.0-col,mdInvert);
  if(mdDarken>0.01)col*=1.0-mdDarken*0.3;

  col*=0.8+uBeatPhase*0.2;

  float h=uSpectralCentroid+hueShift;
  vec3 tint=palette(h,vec3(0.5),vec3(0.5),vec3(1.0),vec3(0.0,0.33,0.67));
  col=mix(col,col*tint,0.15);

  float gray=dot(col,vec3(0.299,0.587,0.114));
  col=mix(vec3(gray),col,saturation);

  col=clamp(col,0.0,1.0);
  fragColor=vec4(col,1.0);
}`

export { MILKDROP_ADAPTER_FRAG }
