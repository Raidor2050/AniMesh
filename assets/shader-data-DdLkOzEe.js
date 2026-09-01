const K=`#version 300 es
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
`,Y=`  { float r2=length(uv);
    float ang=(t*0.03+bass*0.05)*r2;
    uv*=mdZoom;
    uv=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*uv;
    uv*=1.0/(0.2+r2*0.4); }`,J=`  { float r2=length(uv);
    uv*=mdZoom*(0.35+r2);
    float ang=1.0/(0.05+r2)*(t*0.02+mdRot*0.2);
    uv=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*uv; }`,Q=`  { uv*=mdZoom;
    float a=atan(uv.y,uv.x);
    float seg=6.28318/(3.0+mod(seed,3.0)+abs(mdWaveFreq));
    a=mod(a,seg); a=min(a,seg-a);
    uv=vec2(cos(a),sin(a))*length(uv); }`,aa=`  { uv*=mdZoom;
    uv=abs(uv);
    float ang=mdRot+t*0.04;
    uv=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*uv;
    uv+=0.45*vec2(sin(uv.y*3.0+t),cos(uv.x*3.0-t)); }`,ea=`  { uv*=mdZoom*(1.0+0.15*sin(t*1.3+seed)+0.08*beat);
    float r2=length(uv);
    uv*=1.0-smoothstep(0.15,0.85,r2); }`,C=[Y,J,Q,aa,ea],ia=`  { float d=length(uv);
    float ring=abs(d-0.32-bass*0.12);
    col+=pal(mdWaveFreq*0.5+t*0.05)*smoothstep(0.03,0.004,ring)*mdWaveAlpha; }`,ta=`  { float a=atan(uv.y,uv.x);
    float bars=sin(a*mdWaveFreq*2.0+t*1.5)*0.5+0.5;
    col+=pal(mdWaveFreq*0.5+t*0.05)*bars*mdWaveAlpha*(0.7+0.3*bass); }`,oa=`  { float line=sin(uv.x*mdWaveFreq*8.0+t*2.2)*0.12;
    float d=abs(uv.y-line);
    col+=pal(mdWaveFreq*0.5+t*0.04)*smoothstep(0.02,0.002,d)*mdWaveAlpha; }`,la=`  { float a=atan(uv.y,uv.x);
    float sp=sin(length(uv)*22.0-t*3.0+a*mdWaveFreq)*0.5+0.5;
    col+=pal(mdWaveFreq*0.5+t*0.05)*sp*mdWaveAlpha*smoothstep(0.55,0.1,length(uv)); }`,ra=`  { float a=atan(uv.y,uv.x);
    float r2=length(uv);
    float pet=cos(a*6.0+t*sqrt(abs(mdWaveFreq)+0.5))*r2;
    float d=abs(pet-0.16);
    col+=pal(r2*2.0+t*0.06)*smoothstep(0.03,0.003,d)*mdWaveAlpha*(0.8+0.4*beat); }`,na=`  { float ff=fbm(uv*2.4+t*0.12);
    float d=abs(uv.y-sin(uv.x*6.0+ff*6.28+t*1.6)*0.18);
    col+=pal(ff*2.0+t*0.05)*smoothstep(0.015,0.002,d)*mdWaveAlpha; }`,q=[ia,ta,oa,la,ra,na],sa=`  col*=0.85+0.3*sin(t*0.7+seed);
  col+=uSpectralCentroid*0.12*pal(uSpectralCentroid+hueShift);`,ma="  col=col*(0.9+0.2*uTreble)+uVolume*0.1*pal(t*0.1+hueShift);",ua=`  col=col*1.6-0.6;
  col*=vec3(0.7+0.5*sin(t*0.5+uMid*2.0+seed));
  col+=0.1*uLowMid*pal(0.3+seed);`,D=[sa,ma,ua],ca=`  col=pow(max(col,vec3(0.0)),vec3(1.0/mdGamma));
  float gray=dot(col,vec3(0.299,0.587,0.114));
  col=mix(vec3(gray),col,saturation);
  col=clamp(col,0.0,1.0);`,da=`  col*=0.92+0.16*smoothstep(0.0,0.1,fract(gl_FragCoord.y*0.5+t*1.4));
  float gray=dot(col,vec3(0.299,0.587,0.114));
  col=mix(vec3(gray),col,saturation);
  col*=pow(mdGamma,0.4);
  col=clamp(col,0.0,1.0);`,pa=`  col*=0.6+0.6*smoothstep(1.2,0.3,length(uv)*mdZoom);
  col+=uBeat*uBass*0.15*pal(t*0.2);
  col=mix(vec3(dot(col,vec3(0.299,0.587,0.114))),col,saturation);
  col=clamp(col,0.0,1.0);`,j=[ca,da,pa],va=t=>"0."+String(t%1e3+1).padStart(4,"0");function ga(t){const o=Math.abs(Math.trunc(t)),a=C[o%C.length],l=q[Math.floor(o/C.length)%q.length],n=D[Math.floor(o/(C.length*q.length))%D.length],e=j[Math.floor(o/(C.length*q.length*D.length))%j.length],m=va(o);return`${K}
void main(){
  float seed=${m};
  vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
  float t=uTime*speed+seed;
  float bass=uBass*intensity;
  float beat=uBeat;
  uv*=clamp(scale,0.01,10.0);
  { float ang=mdRot*0.5+bass*0.08; uv=mat2(cos(ang),-sin(ang),sin(ang),cos(ang))*uv; }
  if(mdWarp>0.001){ uv+=vec2(fbm(uv*3.0+t*0.3),fbm(uv*3.0-t*0.2+100.0))*mdWarp*(0.5+bass*0.5)*0.15; }
${a}
  vec3 col=vec3(0.0);
${l}
  col*=brightness;
${n}
${e}
  fragColor=vec4(col,1.0);
}
`}const r=`#version 300 es
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

void main(){
  vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
  float t=uTime*speed;
  float bass=uBass*intensity;
  float beat=uBeat;

  float z=mdZoom+bass*0.15;
  uv*=z;
  float r=mdRot+t*0.02+beat*0.1;
  float cs=cos(r);float sn=sin(r);
  uv=mat2(cs,-sn,sn,cs)*uv;

  if(mdWarp>0.001){
    float ws=mdWarp*(0.5+bass*0.5);
    uv+=vec2(fbm(uv*3.0+t*0.3),fbm(uv*3.0+t*0.3+100.0))*ws*0.15;
  }

  float decay=mdDecay;
  float pulse=sin(t*(1.0-decay)*8.0+fbm(uv*2.0)*6.28)*0.5+0.5;
  pulse=mix(0.3,1.0,pulse*decay);

  vec3 col=vec3(0.0);
  vec3 wCol=pal(mdWaveFreq*0.5+t*0.05)*pulse*brightness;

  float mode=mdWaveMode;
  if(mode<1.5){
    float d=length(uv);
    float ring=abs(d-0.3-bass*0.1);
    col+=wCol*smoothstep(0.02,0.005,ring)*mdWaveAlpha;
  }else if(mode<3.5){
    float a=atan(uv.y,uv.x);
    float bars=sin(a*mdWaveFreq+t*2.0)*0.5+0.5;
    col+=wCol*bars*mdWaveAlpha*pulse;
  }else if(mode<5.5){
    float line=sin(uv.x*mdWaveFreq*10.0+t*3.0)*0.15;
    float d=abs(uv.y-line);
    col+=wCol*smoothstep(0.02,0.002,d)*mdWaveAlpha;
  }else{
    float sp=sin(length(uv)*20.0-t*3.0+atan(uv.y,uv.x)*mdWaveFreq)*0.5+0.5;
    col+=wCol*sp*mdWaveAlpha*smoothstep(0.5,0.1,length(uv));
  }

  if(mdObAlpha>0.01){
    float d=length(uv);
    col=mix(col,vec3(0.5),smoothstep(0.5-mdObSize,0.5,d)*mdObAlpha);
  }

  col=pow(max(col,vec3(0.0)),vec3(1.0/mdGamma));
  col+=uSpectralCentroid*0.1*pal(uSpectralCentroid+hueShift);
  float gray=dot(col,vec3(0.299,0.587,0.114));
  col=mix(vec3(gray),col,saturation);
  col=clamp(col,0.0,1.0);
  fragColor=vec4(col,1.0);
}
`,fa=[{id:"md-levels-effect-goody-s-lightning-ps-0",name:"levels effect === Goody's Lightning (ps",category:"vj",description:"MilkDrop: NestDropResources — levels effect === Goody's Lightning (ps",tags:["milkdrop","vj","nestdropresources"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.012,mdRot:0,mdDecay:.98,mdWarp:.263,mdGamma:1.9,mdWaveMode:4,mdWaveAlpha:.001,mdWaveScale:.692,mdWaveFreq:-1,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-gas-effect-zoom-in-orange-filter-1",name:"gas effect + zoom in + orange filter ===",category:"vj",description:"MilkDrop: NestDropResources — gas effect + zoom in + orange filter ===",tags:["milkdrop","vj","nestdropresources"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.975,mdWarp:.033,mdGamma:2.4,mdWaveMode:5,mdWaveAlpha:.001,mdWaveScale:.888,mdWaveFreq:-.3,mdObSize:0,mdObAlpha:0,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-adamfx-flexi-amandio-c-n-martin-star-2",name:"AdamFx,Flexi,Amandio c n Martin - Star",category:"vj",description:"MilkDrop: Hypnotic — AdamFx,Flexi,Amandio c n Martin - Star",tags:["milkdrop","vj","hypnotic"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:1,mdWarp:.089,mdGamma:1,mdWaveMode:4,mdWaveAlpha:.331,mdWaveScale:.898,mdWaveFreq:.1,mdObSize:.5,mdObAlpha:0,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-fractopia-blame-hexcollie-3",name:"Fractopia [blame hexcollie]",category:"vj",description:"MilkDrop: Hypnotic — Fractopia [blame hexcollie]",tags:["milkdrop","vj","hypnotic"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.5,mdWarp:1,mdGamma:1,mdWaveMode:0,mdWaveAlpha:.009,mdWaveScale:2.136,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-blame-moebius-4",name:"blame moebius",category:"vj",description:"MilkDrop: Hypnotic — blame moebius",tags:["milkdrop","vj","hypnotic"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.025,mdRot:0,mdDecay:.98,mdWarp:.637,mdGamma:1,mdWaveMode:1,mdWaveAlpha:.004,mdWaveScale:.762,mdWaveFreq:-.44,mdObSize:0,mdObAlpha:1,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-explosive-minds-can-t-sex-this-5",name:"Explosive Minds [can't sex this]",category:"vj",description:"MilkDrop: Hypnotic — Explosive Minds [can't sex this]",tags:["milkdrop","vj","hypnotic"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.879,mdRot:0,mdDecay:1,mdWarp:.049,mdGamma:2,mdWaveMode:0,mdWaveAlpha:.8,mdWaveScale:.011,mdWaveFreq:-.42,mdObSize:.05,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-paint-spill-music-reactive-paint-mix-n-6",name:"Paint Spill (Music Reactive Paint Mix) n",category:"vj",description:"MilkDrop: Hypnotic — Paint Spill (Music Reactive Paint Mix) n",tags:["milkdrop","vj","hypnotic"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.98,mdWarp:1,mdGamma:2,mdWaveMode:2,mdWaveAlpha:.001,mdWaveScale:3,mdWaveFreq:-.38,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-data-crusher-7",name:"Data Crusher",category:"vj",description:"MilkDrop: Hypnotic — Data Crusher",tags:["milkdrop","vj","hypnotic"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:2.782,mdRot:0,mdDecay:1,mdWarp:.01,mdGamma:1.56,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:.653,mdWaveFreq:-.5,mdObSize:0,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-shelter-in-infinity-nz-ass-8",name:"shelter in infinity nz- ass",category:"vj",description:"MilkDrop: Hypnotic — shelter in infinity nz- ass",tags:["milkdrop","vj","hypnotic"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:13.301,mdRot:0,mdDecay:.95,mdWarp:.01,mdGamma:1,mdWaveMode:0,mdWaveAlpha:.5,mdWaveScale:.01,mdWaveFreq:-1,mdObSize:0,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-carpet-weaver-bipolar-01-9",name:"carpet weaver bipolar 01",category:"vj",description:"MilkDrop: Hypnotic — carpet weaver bipolar 01",tags:["milkdrop","vj","hypnotic"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.5,mdWarp:.01,mdGamma:1.98,mdWaveMode:6,mdWaveAlpha:.005,mdWaveScale:.527,mdWaveFreq:0,mdObSize:.01,mdObAlpha:1,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-tricolors-flexi-away-with-it-alien-10",name:"Tricolors [Flexi - away with it + alien",category:"vj",description:"MilkDrop: Hypnotic — Tricolors [Flexi - away with it + alien",tags:["milkdrop","vj","hypnotic"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.005,mdRot:0,mdDecay:1,mdWarp:.25,mdGamma:2,mdWaveMode:0,mdWaveAlpha:1,mdWaveScale:.05,mdWaveFreq:-.3,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-mashup-257-11",name:"Mashup (257)",category:"abstract",description:"MilkDrop: Dancer — Mashup (257)",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:.26,mdDecay:.9,mdWarp:.011,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.5,mdObAlpha:0,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-my-flashin-freyens-12",name:"my flashin freyens",category:"abstract",description:"MilkDrop: Dancer — my flashin freyens",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.996,mdWarp:.01,mdGamma:1,mdWaveMode:6,mdWaveAlpha:.001,mdWaveScale:2.63,mdWaveFreq:0,mdObSize:0,mdObAlpha:0,mdIbSize:.005,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-bounce-shape-exp-4-2-thelemaetic-ghoes-13",name:"bounce shape exp 4 2 - thelemaetic ghoes",category:"abstract",description:"MilkDrop: Dancer — bounce shape exp 4 2 - thelemaetic ghoes",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.995,mdWarp:.089,mdGamma:1,mdWaveMode:0,mdWaveAlpha:1.413,mdWaveScale:1.131,mdWaveFreq:-.66,mdObSize:.5,mdObAlpha:0,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-shifter-spincycle-labor-of-others-14",name:"shifter - spincycle + labor of others",category:"abstract",description:"MilkDrop: Dancer — shifter - spincycle + labor of others",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.01,mdRot:0,mdDecay:1,mdWarp:.162,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-pair-of-balls-15",name:"Pair of Balls",category:"abstract",description:"MilkDrop: Dancer — Pair of Balls",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.081,mdRot:0,mdDecay:.5,mdWarp:.01,mdGamma:1.98,mdWaveMode:6,mdWaveAlpha:.001,mdWaveScale:2.63,mdWaveFreq:0,mdObSize:0,mdObAlpha:.8,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-let-it-all-end-16",name:"let it all end",category:"abstract",description:"MilkDrop: Dancer — let it all end",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.989,mdWarp:1,mdGamma:1,mdWaveMode:0,mdWaveAlpha:2,mdWaveScale:3,mdWaveFreq:-1,mdObSize:0,mdObAlpha:1,mdIbSize:.02,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-horizon-17",name:"Horizon",category:"abstract",description:"MilkDrop: Dancer — Horizon",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.5,mdWarp:.01,mdGamma:1.98,mdWaveMode:6,mdWaveAlpha:2,mdWaveScale:.01,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.11,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-mashup-113-18",name:"Mashup (113)",category:"abstract",description:"MilkDrop: Dancer — Mashup (113)",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.01,mdRot:0,mdDecay:.96,mdWarp:1,mdGamma:1.7,mdWaveMode:2,mdWaveAlpha:.001,mdWaveScale:.012,mdWaveFreq:0,mdObSize:0,mdObAlpha:.3,mdIbSize:.09,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-liquid-firesticks-i-19",name:"liquid firesticks I",category:"abstract",description:"MilkDrop: Dancer — liquid firesticks I",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.7,mdWarp:.01,mdGamma:2,mdWaveMode:2,mdWaveAlpha:.001,mdWaveScale:.012,mdWaveFreq:0,mdObSize:.005,mdObAlpha:1,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-ne0n-thai-smokesticks-in-the-city-20",name:"Ne0n Thai SmokeSticks in the City",category:"abstract",description:"MilkDrop: Dancer — Ne0n Thai SmokeSticks in the City",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.16,mdRot:-.04,mdDecay:.99,mdWarp:.001,mdGamma:2,mdWaveMode:2,mdWaveAlpha:.001,mdWaveScale:.012,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-sicksticks-wid-it-v02alpha-21",name:"SickSticks wid It v02alpha",category:"abstract",description:"MilkDrop: Dancer — SickSticks wid It v02alpha",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.16,mdRot:-.04,mdDecay:.5,mdWarp:.001,mdGamma:1.98,mdWaveMode:2,mdWaveAlpha:.001,mdWaveScale:.012,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-omniscient-presence-i-22",name:"Omniscient Presence i",category:"abstract",description:"MilkDrop: Dancer — Omniscient Presence i",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.16,mdRot:-.04,mdDecay:.925,mdWarp:.001,mdGamma:1,mdWaveMode:2,mdWaveAlpha:.001,mdWaveScale:.012,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-sup-r-nova-universal-a-hole-23",name:"Sup-R-Nova (Universal A-hole)",category:"abstract",description:"MilkDrop: Dancer — Sup-R-Nova (Universal A-hole)",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.013,mdRot:0,mdDecay:.5,mdWarp:.063,mdGamma:1.98,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-crystal-palace007d-24",name:"crystal palace007d",category:"abstract",description:"MilkDrop: Dancer — crystal palace007d",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.5,mdWarp:.721,mdGamma:2,mdWaveMode:1,mdWaveAlpha:2,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.5,mdObAlpha:0,mdIbSize:.5,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-planetary-alignment-acidburn-flexi-n-r-25",name:"Planetary Alignment Acidburn - Flexi n R",category:"abstract",description:"MilkDrop: Dancer — Planetary Alignment Acidburn - Flexi n R",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:13.291,mdRot:0,mdDecay:.9,mdWarp:.01,mdGamma:1.9,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:.03,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-anime-vs-the-stalion-mang-26",name:"Anime vs The stalion Mang",category:"abstract",description:"MilkDrop: Dancer — Anime vs The stalion Mang",tags:["milkdrop","abstract","dancer"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:13.291,mdRot:0,mdDecay:.98,mdWarp:.01,mdGamma:2,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:.015,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-cultivating-quorum-sensing-magick-bacter-27",name:"cultivating quorum sensing magick bacter",category:"abstract",description:"MilkDrop: Drawing — cultivating quorum sensing magick bacter",tags:["milkdrop","abstract","drawing"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.5,mdWarp:1,mdGamma:1,mdWaveMode:3,mdWaveAlpha:.644,mdWaveScale:.39,mdWaveFreq:0,mdObSize:.5,mdObAlpha:0,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-sweet-choronzon-28",name:"sweet choronzon",category:"abstract",description:"MilkDrop: Drawing — sweet choronzon",tags:["milkdrop","abstract","drawing"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.025,mdRot:-.02,mdDecay:1,mdWarp:.309,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.01,mdObAlpha:.5,mdIbSize:.01,mdIbAlpha:.5},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-eye-disease-ngornggniq-say-what-you-thin-29",name:"eye disease ngornggniq say what you thin",category:"abstract",description:"MilkDrop: Drawing — eye disease ngornggniq say what you thin",tags:["milkdrop","abstract","drawing"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.02,mdRot:0,mdDecay:.5,mdWarp:.439,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.157,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-wave-function-collapse-majorly-dickles-30",name:"wave function collapse - majorly dickles",category:"abstract",description:"MilkDrop: Drawing — wave function collapse - majorly dickles",tags:["milkdrop","abstract","drawing"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.879,mdRot:0,mdDecay:1,mdWarp:.01,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.157,mdWaveFreq:0,mdObSize:0,mdObAlpha:0,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-dust-on-the-lens-31",name:"Dust on the Lens",category:"fractals",description:"MilkDrop: Fractal — Dust on the Lens",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.98,mdWarp:1,mdGamma:2,mdWaveMode:0,mdWaveAlpha:2,mdWaveScale:.01,mdWaveFreq:-.5,mdObSize:.005,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-airhandler-last-breath-clam-handler-32",name:"Airhandler (Last Breath - Clam Handler)",category:"fractals",description:"MilkDrop: Fractal — Airhandler (Last Breath - Clam Handler)",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:1,mdWarp:.01,mdGamma:1.4,mdWaveMode:5,mdWaveAlpha:.691,mdWaveScale:3,mdWaveFreq:0,mdObSize:.005,mdObAlpha:.1,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-self-similarity-i-love-flexi-a-lot-ap-33",name:"self similarity - i love flexi a lot (ap",category:"fractals",description:"MilkDrop: Fractal — self similarity - i love flexi a lot (ap",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.585,mdWarp:.01,mdGamma:1,mdWaveMode:6,mdWaveAlpha:.005,mdWaveScale:.167,mdWaveFreq:0,mdObSize:.005,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-smashing-fractals-acid-etching-mix-34",name:"smashing fractals [acid etching mix]",category:"fractals",description:"MilkDrop: Fractal — smashing fractals [acid etching mix]",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:1,mdWarp:.133,mdGamma:1,mdWaveMode:1,mdWaveAlpha:.004,mdWaveScale:.01,mdWaveFreq:-.44,mdObSize:.005,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-addicted-35",name:"Addicted",category:"fractals",description:"MilkDrop: Fractal — Addicted",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.303,mdRot:0,mdDecay:.98,mdWarp:1,mdGamma:2,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:.01,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-starfield-b-36",name:"Starfield B",category:"fractals",description:"MilkDrop: Fractal — Starfield B",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.5,mdWarp:.01,mdGamma:1.98,mdWaveMode:7,mdWaveAlpha:.1,mdWaveScale:2.781,mdWaveFreq:0,mdObSize:.005,mdObAlpha:0,mdIbSize:.05,mdIbAlpha:.014},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-flexi-fractrip-bccn-jelly-v4-burni-37",name:"flexi - fractrip (bccn Jelly V4) - burni",category:"fractals",description:"MilkDrop: Fractal — flexi - fractrip (bccn Jelly V4) - burni",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.99,mdRot:0,mdDecay:1,mdWarp:1,mdGamma:1,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:.01,mdWaveFreq:0,mdObSize:.005,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-alkehmikal-konflagellum-uslerpretation-38",name:"alkehmikal konflagellum uslerpretation -",category:"fractals",description:"MilkDrop: Fractal — alkehmikal konflagellum uslerpretation -",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.499,mdRot:0,mdDecay:.98,mdWarp:1,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.05,mdObAlpha:0,mdIbSize:.5,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-international-political-bargaining-chips-39",name:"international political bargaining chips",category:"fractals",description:"MilkDrop: Fractal — international political bargaining chips",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.925,mdWarp:.01,mdGamma:1,mdWaveMode:5,mdWaveAlpha:.312,mdWaveScale:1.758,mdWaveFreq:.14,mdObSize:.31,mdObAlpha:0,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-zylot-crystalball-aren-tfractals-40",name:"Zylot-CrystalBall(Aren'tFractals",category:"fractals",description:"MilkDrop: Fractal — Zylot-CrystalBall(Aren'tFractals",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.9,mdWarp:1,mdGamma:2,mdWaveMode:0,mdWaveAlpha:1,mdWaveScale:1,mdWaveFreq:0,mdObSize:0,mdObAlpha:0,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-mashup-136-41",name:"Mashup (136)",category:"fractals",description:"MilkDrop: Fractal — Mashup (136)",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.064,mdRot:0,mdDecay:.98,mdWarp:.2,mdGamma:1.9,mdWaveMode:6,mdWaveAlpha:.001,mdWaveScale:.01,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-fractal-explorer-122-42",name:"fractal explorer 122",category:"fractals",description:"MilkDrop: Fractal — fractal explorer 122",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.608,mdRot:0,mdDecay:.925,mdWarp:.01,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-bracer-vortex-43",name:"Bracer Vortex",category:"fractals",description:"MilkDrop: Fractal — Bracer Vortex",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.94,mdRot:-6.14,mdDecay:.9,mdWarp:1,mdGamma:1.94,mdWaveMode:6,mdWaveAlpha:.003,mdWaveScale:.262,mdWaveFreq:.173,mdObSize:.009,mdObAlpha:.15,mdIbSize:.005,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-bombyx-mori-ft-flexi-adamfx-stahlr-44",name:"bombyx mori - Ft Flexi - AdamFX - StahlR",category:"fractals",description:"MilkDrop: Fractal — bombyx mori - Ft Flexi - AdamFX - StahlR",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.5,mdWarp:1,mdGamma:1.98,mdWaveMode:1,mdWaveAlpha:.001,mdWaveScale:1,mdWaveFreq:0,mdObSize:.005,mdObAlpha:1,mdIbSize:.02,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-disco-mix-6-ufo-rmx-inside-the-ship-th-45",name:"disco mix 6 (UFO RMX)Inside the ship (th",category:"fractals",description:"MilkDrop: Fractal — disco mix 6 (UFO RMX)Inside the ship (th",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:13.301,mdRot:0,mdDecay:.5,mdWarp:.008,mdGamma:1.98,mdWaveMode:4,mdWaveAlpha:.001,mdWaveScale:.527,mdWaveFreq:0,mdObSize:.08,mdObAlpha:1,mdIbSize:.05,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-wormhole-46",name:"Wormhole",category:"fractals",description:"MilkDrop: Fractal — Wormhole",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:15.898,mdRot:0,mdDecay:.98,mdWarp:1,mdGamma:3.44,mdWaveMode:2,mdWaveAlpha:.001,mdWaveScale:.012,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-my-health-fades-and-the-universe-laughs-47",name:"my health fades and the universe laughs",category:"fractals",description:"MilkDrop: Fractal — my health fades and the universe laughs",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.077,mdRot:0,mdDecay:.9,mdWarp:.01,mdGamma:2,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.157,mdWaveFreq:0,mdObSize:0,mdObAlpha:0,mdIbSize:.03,mdIbAlpha:.3},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-emergent-factors-48",name:"Emergent factors",category:"fractals",description:"MilkDrop: Fractal — Emergent factors",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:13.291,mdRot:0,mdDecay:.94,mdWarp:.01,mdGamma:1,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:.01,mdWaveFreq:-1,mdObSize:0,mdObAlpha:1,mdIbSize:.015,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-plasma-pong-1-4-49",name:"plasma pong 1-4",category:"fractals",description:"MilkDrop: Fractal — plasma pong 1-4",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.922,mdRot:0,mdDecay:.98,mdWarp:.01,mdGamma:1.9,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:.243,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:.045,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-witchcraft-shifting-parchment-fun-ba-50",name:"Witchcraft (shifting parchment) - fun ba",category:"fractals",description:"MilkDrop: Fractal — Witchcraft (shifting parchment) - fun ba",tags:["milkdrop","fractals","fractal"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:13.291,mdRot:0,mdDecay:1,mdWarp:.01,mdGamma:3.87,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:.03,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-cope-laser-dome-51",name:"cope - laser dome",category:"geometric",description:"MilkDrop: Geometric — cope - laser dome",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.5,mdWarp:.01,mdGamma:1.98,mdWaveMode:6,mdWaveAlpha:.312,mdWaveScale:1.229,mdWaveFreq:.2,mdObSize:.005,mdObAlpha:.2,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-pulsecube-e-demon-52",name:"pulsecube e demon",category:"geometric",description:"MilkDrop: Geometric — pulsecube e demon",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.96,mdWarp:.01,mdGamma:1.93,mdWaveMode:2,mdWaveAlpha:.001,mdWaveScale:.012,mdWaveFreq:0,mdObSize:0,mdObAlpha:0,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-excerptise-sweepia-bindfoul-outresloth-53",name:"excerptise sweepia bindfoul outresloth",category:"geometric",description:"MilkDrop: Geometric — excerptise sweepia bindfoul outresloth",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.104,mdRot:0,mdDecay:.95,mdWarp:.01,mdGamma:1,mdWaveMode:7,mdWaveAlpha:2,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.5,mdObAlpha:0,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-blank-boot-2-54",name:"blank boot 2",category:"geometric",description:"MilkDrop: Geometric — blank boot 2",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:14.366,mdRot:0,mdDecay:.98,mdWarp:.123,mdGamma:1.9,mdWaveMode:0,mdWaveAlpha:1.22,mdWaveScale:3,mdWaveFreq:1,mdObSize:.005,mdObAlpha:1,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-yin-360-organic-circuits-each-elon-55",name:"yin - 360 - Organic circuits - each elon",category:"geometric",description:"MilkDrop: Geometric — yin - 360 - Organic circuits - each elon",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.899,mdWarp:.01,mdGamma:1.7,mdWaveMode:1,mdWaveAlpha:.001,mdWaveScale:.412,mdWaveFreq:-.18,mdObSize:.005,mdObAlpha:.92,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-magnetosphere-13-pulsar-b-56",name:"magnetosphere 13 - pulsar B",category:"geometric",description:"MilkDrop: Geometric — magnetosphere 13 - pulsar B",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.96,mdWarp:.07,mdGamma:1,mdWaveMode:2,mdWaveAlpha:.001,mdWaveScale:.012,mdWaveFreq:0,mdObSize:0,mdObAlpha:0,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-spun-sugar-smooth-cheese-57",name:"spun sugar - smooth cheese",category:"geometric",description:"MilkDrop: Geometric — spun sugar - smooth cheese",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.99,mdWarp:.241,mdGamma:1.7,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.005,mdObAlpha:1,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-184-nz-submission-by-the-gothiq-hate-te-58",name:"184 nz+ submission by the gothiq hate te",category:"geometric",description:"MilkDrop: Geometric — 184 nz+ submission by the gothiq hate te",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.38,mdRot:.02,mdDecay:.96,mdWarp:.198,mdGamma:1.7,mdWaveMode:3,mdWaveAlpha:.001,mdWaveScale:.01,mdWaveFreq:-.2,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-27-super-goats-orbus-maximus-poown-59",name:"27_super_goats-orbus_maximus poown",category:"geometric",description:"MilkDrop: Geometric — 27_super_goats-orbus_maximus poown",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:.004,mdDecay:.715,mdWarp:.803,mdGamma:2.7,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:1,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-hard-flat-snot-plane-propre-derridian-re-60",name:"hard flat snot plane propre derridian re",category:"geometric",description:"MilkDrop: Geometric — hard flat snot plane propre derridian re",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.006,mdRot:0,mdDecay:1,mdWarp:1,mdGamma:8,mdWaveMode:0,mdWaveAlpha:.009,mdWaveScale:.009,mdWaveFreq:-.8,mdObSize:0,mdObAlpha:0,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-wheel-of-time-super-dead-christ-fuck-fir-61",name:"Wheel of time super dead christ fuck fir",category:"geometric",description:"MilkDrop: Geometric — Wheel of time super dead christ fuck fir",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.16,mdRot:0,mdDecay:1,mdWarp:.001,mdGamma:2,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:1,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-water-cooled-red-uranium-jw-hawke-inc-62",name:"water cooled red uranium - jw hawke inc",category:"geometric",description:"MilkDrop: Geometric — water cooled red uranium - jw hawke inc",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.96,mdWarp:1,mdGamma:2,mdWaveMode:0,mdWaveAlpha:.009,mdWaveScale:.01,mdWaveFreq:-.8,mdObSize:.01,mdObAlpha:0,mdIbSize:0,mdIbAlpha:.47},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-epicenter-the-end-of-the-world-we-never-63",name:"epicenter the end of the world we never",category:"geometric",description:"MilkDrop: Geometric — epicenter the end of the world we never",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.55,mdWarp:.109,mdGamma:1,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:.033,mdWaveFreq:-.44,mdObSize:.005,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-mashup-505-64",name:"Mashup (505)",category:"geometric",description:"MilkDrop: Geometric — Mashup (505)",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.8,mdRot:0,mdDecay:1,mdWarp:.017,mdGamma:2,mdWaveMode:2,mdWaveAlpha:.001,mdWaveScale:.012,mdWaveFreq:0,mdObSize:0,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-328-65",name:"328",category:"geometric",description:"MilkDrop: Geometric — 328",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:13.291,mdRot:0,mdDecay:.5,mdWarp:.01,mdGamma:1.98,mdWaveMode:2,mdWaveAlpha:.001,mdWaveScale:.012,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:.015,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-many-colors-1-66",name:"Many Colors 1",category:"geometric",description:"MilkDrop: Geometric — Many Colors 1",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.014,mdRot:0,mdDecay:.98,mdWarp:.467,mdGamma:2.7,mdWaveMode:0,mdWaveAlpha:1,mdWaveScale:1,mdWaveFreq:0,mdObSize:0,mdObAlpha:0,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-elch-zoke-paeg-volr-67",name:"elch zoke paeg volr",category:"geometric",description:"MilkDrop: Geometric — elch zoke paeg volr",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.94,mdWarp:1,mdGamma:1.98,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:2.988,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-fine-line-between-tolerance-and-death-pe-68",name:"fine line between tolerance and death pe",category:"geometric",description:"MilkDrop: Geometric — fine line between tolerance and death pe",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.9,mdWarp:.089,mdGamma:2,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1,mdWaveFreq:0,mdObSize:.5,mdObAlpha:0,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-bobby-grackel-keep-brains-alive-in-jar-69",name:"bobby grackel - keep brains alive in jar",category:"geometric",description:"MilkDrop: Geometric — bobby grackel - keep brains alive in jar",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:5.985,mdRot:1,mdDecay:.8,mdWarp:.01,mdGamma:1.56,mdWaveMode:2,mdWaveAlpha:2,mdWaveScale:2.792,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:.005,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-rapture-garden-make-out-pumps-70",name:"rapture garden make out pumps",category:"geometric",description:"MilkDrop: Geometric — rapture garden make out pumps",tags:["milkdrop","geometric","geometric"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.069,mdRot:0,mdDecay:.935,mdWarp:1,mdGamma:2.63,mdWaveMode:5,mdWaveAlpha:.008,mdWaveScale:.01,mdWaveFreq:-.3,mdObSize:0,mdObAlpha:0,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-mashup-287-71",name:"Mashup (287)",category:"particle",description:"MilkDrop: Particles — Mashup (287)",tags:["milkdrop","particle","particles"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.03,mdRot:.01,mdDecay:1,mdWarp:.01,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.005,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-pole-shf-fab-candiria-pull-ap5-suppos-72",name:"pole - shf fab candiria pull ap5+ suppos",category:"particle",description:"MilkDrop: Particles — pole - shf fab candiria pull ap5+ suppos",tags:["milkdrop","particle","particles"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.004,mdRot:0,mdDecay:.5,mdWarp:.198,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.01,mdObAlpha:.7,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-qbikal-surface-turbulence-iie3-by-hak-73",name:"QBikal - Surface Turbulence IIe3 (by hak",category:"particle",description:"MilkDrop: Particles — QBikal - Surface Turbulence IIe3 (by hak",tags:["milkdrop","particle","particles"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.5,mdWarp:.01,mdGamma:1.98,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:.133,mdWaveFreq:-1,mdObSize:.015,mdObAlpha:1,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-auto-thef-74",name:"auto thef",category:"particle",description:"MilkDrop: Particles — auto thef",tags:["milkdrop","particle","particles"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.91,mdWarp:.009,mdGamma:2.63,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.5,mdObAlpha:0,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-solarized-space-isosceles-edit-75",name:"Solarized Space --- Isosceles edit",category:"particle",description:"MilkDrop: Particles — Solarized Space --- Isosceles edit",tags:["milkdrop","particle","particles"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.96,mdWarp:1,mdGamma:1.99,mdWaveMode:0,mdWaveAlpha:1.882,mdWaveScale:1,mdWaveFreq:-.5,mdObSize:0,mdObAlpha:1,mdIbSize:.002,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-artifact-6-isosceles-edit-76",name:"Artifact 6 --- Isosceles edit",category:"particle",description:"MilkDrop: Particles — Artifact 6 --- Isosceles edit",tags:["milkdrop","particle","particles"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.023,mdRot:0,mdDecay:.98,mdWarp:.076,mdGamma:2,mdWaveMode:4,mdWaveAlpha:.121,mdWaveScale:1.694,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-ritually-invoking-the-irrational-slaves-77",name:"ritually invoking the irrational slaves",category:"particle",description:"MilkDrop: Particles — ritually invoking the irrational slaves",tags:["milkdrop","particle","particles"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.008,mdRot:0,mdDecay:.5,mdWarp:1,mdGamma:1.14,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.005,mdObAlpha:0,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-kaleidoscope-1-nickel-advice-78",name:"Kaleidoscope 1 nickel advice",category:"particle",description:"MilkDrop: Particles — Kaleidoscope 1 nickel advice",tags:["milkdrop","particle","particles"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.04,mdRot:0,mdDecay:.98,mdWarp:.474,mdGamma:1.9,mdWaveMode:5,mdWaveAlpha:.3,mdWaveScale:3,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-emitter-79",name:"Emitter",category:"particle",description:"MilkDrop: Particles — Emitter",tags:["milkdrop","particle","particles"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.031,mdRot:.003,mdDecay:.98,mdWarp:.208,mdGamma:1.5,mdWaveMode:3,mdWaveAlpha:2,mdWaveScale:3,mdWaveFreq:-.2,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-hot-breeze-80",name:"Hot Breeze",category:"particle",description:"MilkDrop: Particles — Hot Breeze",tags:["milkdrop","particle","particles"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.023,mdRot:0,mdDecay:.5,mdWarp:.123,mdGamma:1.98,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:.325,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-patternton-district-of-media-capitol-o-81",name:"patternton, district of media, capitol o",category:"cosmic",description:"MilkDrop: Reaction — patternton, district of media, capitol o",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.879,mdRot:0,mdDecay:1,mdWarp:.049,mdGamma:1,mdWaveMode:0,mdWaveAlpha:.004,mdWaveScale:.242,mdWaveFreq:-.44,mdObSize:.05,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-if-it-s-good-enough-for-me-to-save-it-s-82",name:"if it's good enough for me to save, it's",category:"cosmic",description:"MilkDrop: Reaction — if it's good enough for me to save, it's",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:.04,mdDecay:1,mdWarp:.01,mdGamma:1,mdWaveMode:6,mdWaveAlpha:.001,mdWaveScale:2.103,mdWaveFreq:.38,mdObSize:.005,mdObAlpha:.2,mdIbSize:.005,mdIbAlpha:.31},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-hexcollie-julian-carnival-shimmy-dum-83",name:"Hexcollie - Julian Carnival - shimmy dum",category:"cosmic",description:"MilkDrop: Reaction — Hexcollie - Julian Carnival - shimmy dum",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:9.861,mdRot:0,mdDecay:.5,mdWarp:.01,mdGamma:1,mdWaveMode:5,mdWaveAlpha:1.136,mdWaveScale:1.229,mdWaveFreq:.2,mdObSize:.015,mdObAlpha:.18,mdIbSize:.5,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-ignore-visual-queues-84",name:"ignore visual queues",category:"cosmic",description:"MilkDrop: Reaction — ignore visual queues",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.135,mdRot:0,mdDecay:.98,mdWarp:.016,mdGamma:1.9,mdWaveMode:0,mdWaveAlpha:2,mdWaveScale:.443,mdWaveFreq:-.4,mdObSize:.02,mdObAlpha:1,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-inferno-x-85",name:"inferno-x",category:"cosmic",description:"MilkDrop: Reaction — inferno-x",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.925,mdWarp:.01,mdGamma:1,mdWaveMode:6,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-ultramix-46-test-all-your-base-86",name:"ultramix #46 test [all your base]",category:"cosmic",description:"MilkDrop: Reaction — ultramix #46 test [all your base]",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:13.301,mdRot:0,mdDecay:.94,mdWarp:.01,mdGamma:1,mdWaveMode:0,mdWaveAlpha:.5,mdWaveScale:.01,mdWaveFreq:-1,mdObSize:.02,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-disruptor-vision-of-eggs-87",name:"disruptor [vision of eggs]",category:"cosmic",description:"MilkDrop: Reaction — disruptor [vision of eggs]",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.004,mdRot:0,mdDecay:1,mdWarp:.198,mdGamma:1.56,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-random-mash-up-round-48-88",name:"random mash-up round 48",category:"cosmic",description:"MilkDrop: Reaction — random mash-up round 48",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.98,mdWarp:.312,mdGamma:1,mdWaveMode:0,mdWaveAlpha:.004,mdWaveScale:.037,mdWaveFreq:-.44,mdObSize:.005,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-robotopia-v2-molding-chaos-all-four-wave-89",name:"robotopia v2 molding chaos all four wave",category:"cosmic",description:"MilkDrop: Reaction — robotopia v2 molding chaos all four wave",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.5,mdWarp:.01,mdGamma:1,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:1.074,mdWaveFreq:0,mdObSize:.005,mdObAlpha:1,mdIbSize:.5,mdIbAlpha:.02},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-particle-fountain-futile-distraction-n-90",name:"particle fountain - futile distraction n",category:"cosmic",description:"MilkDrop: Reaction — particle fountain - futile distraction n",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.99,mdRot:0,mdDecay:1,mdWarp:1,mdGamma:1,mdWaveMode:0,mdWaveAlpha:.401,mdWaveScale:3,mdWaveFreq:-.4,mdObSize:.005,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-criminally-negligent-craft-and-bake-sale-91",name:"criminally negligent craft and bake sale",category:"cosmic",description:"MilkDrop: Reaction — criminally negligent craft and bake sale",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.995,mdWarp:1,mdGamma:3.94,mdWaveMode:1,mdWaveAlpha:1.008,mdWaveScale:1.002,mdWaveFreq:.5,mdObSize:.01,mdObAlpha:1,mdIbSize:.05,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-no-god-here-cosmic-tear-92",name:"no god here, cosmic tear",category:"cosmic",description:"MilkDrop: Reaction — no god here, cosmic tear",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.988,mdRot:0,mdDecay:.5,mdWarp:1,mdGamma:1,mdWaveMode:0,mdWaveAlpha:.106,mdWaveScale:.51,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:.005,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-mashup-38-93",name:"Mashup (38)",category:"cosmic",description:"MilkDrop: Reaction — Mashup (38)",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.8,mdRot:0,mdDecay:.995,mdWarp:.017,mdGamma:1,mdWaveMode:4,mdWaveAlpha:1.577,mdWaveScale:.01,mdWaveFreq:-.24,mdObSize:0,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-a-bit-storm-effected-by-adamfx-2-shadowh-94",name:"A Bit Storm Effected by AdamFX 2 shadowh",category:"cosmic",description:"MilkDrop: Reaction — A Bit Storm Effected by AdamFX 2 shadowh",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.064,mdRot:0,mdDecay:.5,mdWarp:.2,mdGamma:1,mdWaveMode:5,mdWaveAlpha:.001,mdWaveScale:3,mdWaveFreq:-1,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-fumez-95",name:"fumez",category:"cosmic",description:"MilkDrop: Reaction — fumez",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.018,mdRot:0,mdDecay:.98,mdWarp:.063,mdGamma:1.9,mdWaveMode:0,mdWaveAlpha:1.22,mdWaveScale:3,mdWaveFreq:1,mdObSize:.005,mdObAlpha:1,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-strippy-desat-96",name:"strippy desat",category:"cosmic",description:"MilkDrop: Reaction — strippy desat",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.206,mdRot:0,mdDecay:.98,mdWarp:.063,mdGamma:1.9,mdWaveMode:0,mdWaveAlpha:1.22,mdWaveScale:3,mdWaveFreq:1,mdObSize:.005,mdObAlpha:1,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-strippy-slow-97",name:"strippy slow",category:"cosmic",description:"MilkDrop: Reaction — strippy slow",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.06,mdRot:0,mdDecay:.98,mdWarp:.063,mdGamma:1.9,mdWaveMode:0,mdWaveAlpha:1.22,mdWaveScale:3,mdWaveFreq:1,mdObSize:.005,mdObAlpha:1,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-sick-star-bloat-isosceles-edit09-98",name:"sick star bloat --- Isosceles edit09",category:"cosmic",description:"MilkDrop: Reaction — sick star bloat --- Isosceles edit09",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.99,mdWarp:1,mdGamma:2.7,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:1,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:.5,mdIbAlpha:.1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-sick-star-bloat-isosceles-edit14-99",name:"sick star bloat --- Isosceles edit14",category:"cosmic",description:"MilkDrop: Reaction — sick star bloat --- Isosceles edit14",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:13.291,mdRot:0,mdDecay:.99,mdWarp:.01,mdGamma:2.7,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:1,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-sick-star-bloat-isosceles-edit15-100",name:"sick star bloat --- Isosceles edit15",category:"cosmic",description:"MilkDrop: Reaction — sick star bloat --- Isosceles edit15",tags:["milkdrop","cosmic","reaction"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.971,mdRot:0,mdDecay:.99,mdWarp:.513,mdGamma:2.7,mdWaveMode:0,mdWaveAlpha:.001,mdWaveScale:1,mdWaveFreq:0,mdObSize:0,mdObAlpha:.5,mdIbSize:.01,mdIbAlpha:.02},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-open-the-light-101",name:"open the light",category:"liquid",description:"MilkDrop: Waveform — open the light",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.97,mdWarp:.01,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.01,mdObAlpha:1,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-bmelgren-penultimate-neural-slipstream-102",name:"Bmelgren - Penultimate Neural Slipstream",category:"liquid",description:"MilkDrop: Waveform — Bmelgren - Penultimate Neural Slipstream",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.94,mdWarp:1,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:2.581,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-daryl-feels-my-hellish-lonliness-black-103",name:"daryl feels my hellish lonliness - black",category:"liquid",description:"MilkDrop: Waveform — daryl feels my hellish lonliness - black",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.98,mdWarp:1,mdGamma:2,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:2.581,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-finitive-psykroe-shf-104",name:"finitive psykroe shf",category:"liquid",description:"MilkDrop: Waveform — finitive psykroe shf",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.375,mdRot:.02,mdDecay:.5,mdWarp:1,mdGamma:1.98,mdWaveMode:1,mdWaveAlpha:.5,mdWaveScale:.66,mdWaveFreq:.2,mdObSize:.005,mdObAlpha:.58,mdIbSize:.01,mdIbAlpha:.53},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-i-contribute-nothing-to-anything-105",name:"i contribute nothing to anything",category:"liquid",description:"MilkDrop: Waveform — i contribute nothing to anything",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.985,mdRot:0,mdDecay:1,mdWarp:.721,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:2.581,mdWaveFreq:0,mdObSize:.5,mdObAlpha:.02,mdIbSize:.5,mdIbAlpha:.02},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-indecizhun-infolding-1-ret-mess-106",name:"indecizhun infolding - 1-ret mess",category:"liquid",description:"MilkDrop: Waveform — indecizhun infolding - 1-ret mess",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.38,mdRot:.02,mdDecay:1,mdWarp:.198,mdGamma:1.14,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:.295,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-log-spec-with-phase-diff-for-marrow-fr-107",name:"log spec with phase diff - for marrow fr",category:"liquid",description:"MilkDrop: Waveform — log spec with phase diff - for marrow fr",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.5,mdWarp:.263,mdGamma:1.7,mdWaveMode:1,mdWaveAlpha:.5,mdWaveScale:.2,mdWaveFreq:.2,mdObSize:.01,mdObAlpha:1,mdIbSize:.301,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-martin-neon-space-ps3-knife-wounds-t-108",name:"martin - neon space ps3 - knife wounds t",category:"liquid",description:"MilkDrop: Waveform — martin - neon space ps3 - knife wounds t",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.5,mdWarp:.01,mdGamma:1.98,mdWaveMode:7,mdWaveAlpha:.5,mdWaveScale:1,mdWaveFreq:0,mdObSize:0,mdObAlpha:1,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-n19-3-layer-overlap-jock-strap-hive-nz-109",name:"n19 3 layer overlap - jock strap hive nz",category:"liquid",description:"MilkDrop: Waveform — n19 3 layer overlap - jock strap hive nz",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.95,mdWarp:.07,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.5,mdWaveScale:1,mdWaveFreq:0,mdObSize:0,mdObAlpha:0,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-n6-n777-shf-no-it-is-you-vut-vill-k-110",name:"n6 - n777 - shf no, it is you vut vill k",category:"liquid",description:"MilkDrop: Waveform — n6 - n777 - shf no, it is you vut vill k",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.01,mdRot:.1,mdDecay:.95,mdWarp:.909,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:2.581,mdWaveFreq:0,mdObSize:0,mdObAlpha:.8,mdIbSize:.005,mdIbAlpha:.3},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-negative-infinity-for-not-flinching-dy-111",name:"negative infinity for not flinching - dy",category:"liquid",description:"MilkDrop: Waveform — negative infinity for not flinching - dy",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1,mdRot:0,mdDecay:.94,mdWarp:.01,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.002,mdObAlpha:1,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-negative-infinity-for-not-flinching-fl-112",name:"negative infinity for not flinching - fl",category:"liquid",description:"MilkDrop: Waveform — negative infinity for not flinching - fl",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.099,mdRot:0,mdDecay:1,mdWarp:1,mdGamma:1.7,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-negative-infinity-for-not-flinching-li-113",name:"negative infinity for not flinching - li",category:"liquid",description:"MilkDrop: Waveform — negative infinity for not flinching - li",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.104,mdRot:0,mdDecay:.94,mdWarp:.01,mdGamma:1,mdWaveMode:7,mdWaveAlpha:.001,mdWaveScale:1.286,mdWaveFreq:0,mdObSize:.5,mdObAlpha:0,mdIbSize:.26,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-slowfast-2-0-acid-tweak-114",name:"slowfast 2-0 [acid tweak]",category:"liquid",description:"MilkDrop: Waveform — slowfast 2-0 [acid tweak]",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.788,mdRot:0,mdDecay:.98,mdWarp:1,mdGamma:2,mdWaveMode:0,mdWaveAlpha:.8,mdWaveScale:1,mdWaveFreq:0,mdObSize:.005,mdObAlpha:1,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-10-115",name:"10",category:"liquid",description:"MilkDrop: Waveform — 10",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.992,mdRot:0,mdDecay:.98,mdWarp:.263,mdGamma:1.9,mdWaveMode:4,mdWaveAlpha:2,mdWaveScale:.692,mdWaveFreq:-1,mdObSize:0,mdObAlpha:0,mdIbSize:0,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-game-of-life-2-116",name:"Game of Life 2",category:"liquid",description:"MilkDrop: Waveform — Game of Life 2",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.143,mdRot:0,mdDecay:.98,mdWarp:.063,mdGamma:1.9,mdWaveMode:6,mdWaveAlpha:.3,mdWaveScale:3,mdWaveFreq:0,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-burning-down-117",name:"Burning Down",category:"liquid",description:"MilkDrop: Waveform — Burning Down",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.002,mdRot:0,mdDecay:1,mdWarp:.591,mdGamma:6.6,mdWaveMode:4,mdWaveAlpha:.748,mdWaveScale:.763,mdWaveFreq:-1,mdObSize:0,mdObAlpha:0,mdIbSize:0,mdIbAlpha:1},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-plasma-convections-118",name:"Plasma Convections",category:"liquid",description:"MilkDrop: Waveform — Plasma Convections",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:1.991,mdRot:.02,mdDecay:.96,mdWarp:.198,mdGamma:1,mdWaveMode:6,mdWaveAlpha:.22,mdWaveScale:1.141,mdWaveFreq:.4,mdObSize:.01,mdObAlpha:0,mdIbSize:.01,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-lightspeed-dune2-119",name:"Lightspeed-dune2",category:"liquid",description:"MilkDrop: Waveform — Lightspeed-dune2",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.879,mdRot:0,mdDecay:.98,mdWarp:.01,mdGamma:1.63,mdWaveMode:6,mdWaveAlpha:.299,mdWaveScale:.01,mdWaveFreq:0,mdObSize:.5,mdObAlpha:0,mdIbSize:.5,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"},{id:"md-lightspeed-dune3-120",name:"Lightspeed-dune3",category:"liquid",description:"MilkDrop: Waveform — Lightspeed-dune3",tags:["milkdrop","liquid","waveform"],fragment:r,uniforms:[],params:[],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:.836,mdRot:0,mdDecay:.98,mdWarp:.01,mdGamma:1.63,mdWaveMode:6,mdWaveAlpha:.299,mdWaveScale:.01,mdWaveFreq:0,mdObSize:.5,mdObAlpha:0,mdIbSize:.5,mdIbAlpha:0},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"linear"},{signal:"treble",param:"mdWaveAlpha",amount:.5,curve:"linear"},{signal:"volume",param:"mdWarp",amount:.2,curve:"linear"}],performanceTier:"medium"}],ba=[{id:"speed",label:"Speed",min:0,max:3,default:1,step:.1,group:"animation"},{id:"intensity",label:"Intensity",min:0,max:2,default:1,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"color"},{id:"hueShift",label:"Hue Shift",min:0,max:6.28,default:0,step:.05},{id:"saturation",label:"Saturation",min:0,max:2,default:1,step:.05},{id:"mdZoom",label:"Zoom",min:.01,max:16,default:1,step:.05,group:"transform"},{id:"mdRot",label:"Rotation",min:-6.5,max:1.5,default:0,step:.05,group:"transform"},{id:"mdDecay",label:"Decay",min:.5,max:1,default:.98,step:.005,group:"animation"},{id:"mdWarp",label:"Warp",min:0,max:1.5,default:0,step:.005,group:"audio"},{id:"mdGamma",label:"Gamma",min:1,max:8,default:2,step:.05,group:"color"},{id:"mdWaveMode",label:"Wave Mode",min:0,max:7,default:0,step:1,group:"shape"},{id:"mdWaveAlpha",label:"Wave Alpha",min:0,max:2,default:.5,step:.01,group:"audio"},{id:"mdWaveFreq",label:"Wave Freq",min:-2,max:2,default:0,step:.05,group:"shape"},{id:"mdObSize",label:"Ob Size",min:0,max:.5,default:.1,step:.005,group:"shape"},{id:"mdObAlpha",label:"Ob Alpha",min:0,max:1,default:0,step:.01,group:"audio"}],ha=fa.map((t,o)=>({...t,fragment:ga(o),params:ba.map(a=>({...a,default:t.defaults[a.id]??a.default}))})),ya=new Set(["length","texture","mix","clamp","mod","smoothstep","step","noise","hash","fbm","palette","pal","cos","sin","tan","asin","acos","atan","pow","exp","log","floor","ceil","fract","abs","dot","sqrt","normalize","cross","min","max","sign","inversesqrt"]),xa=new Set(["speed","intensity","distortion","scale","brightness","hueShift","saturation"]),Wa=/offset|pan|translat|shift|origin|pos/,Sa=/speed|flow|animat|rotat|spin|turn|swirl|drift|phase|evol|expansion|veloc/,Ra=/size|radius|zoom|count|density|complex|freq|arm|ring|petal|side|cell|star|bodies|segment|layer|line|node|connect|particle|source|dot|grid|cryst|branch|filament|curtain|contour|wave|detail|thick|width|beam|slice|tile|smooth|depth|spread|scale|interlace|vein|tightness|bead|opening/,$=t=>t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),Z=t=>{const o=String(Math.round(t*1e6)/1e6);return/\.|e/i.test(o)?o:o+".0"},wa=t=>`{ float hc = cos(hueShift); float hs = sin(hueShift); ${t} = mat3(vec3(0.213+0.787*hc-0.213*hs,0.213-0.213*hc+0.143*hs,0.213-0.213*hc-0.787*hs),vec3(0.715-0.715*hc-0.715*hs,0.715+0.285*hc+0.140*hs,0.715-0.715*hc+0.715*hs),vec3(0.072-0.072*hc+0.928*hs,0.072-0.072*hc-0.283*hs,0.072+0.928*hc+0.072*hs)) * ${t}; }`;function _(t,o){let a=t;const l=s=>new RegExp("\\b"+$(s)+"\\b").test(a),n=s=>{const u=a.lastIndexOf("fragColor");u<0||(a=a.slice(0,u)+s+`
`+a.slice(u))},e=[];if(l("scale")||e.push("uv *= clamp(scale, 0.01, 10.0);"),l("distortion")||e.push(`uv += (distortion - ${Z(o.distortion??0)}) * 0.05 * vec2(sin(uv.y * 40.0), cos(uv.x * 40.0));`),e.length){const s=a.match(/vec2\s+uv\s*=[^;\n]*;/);if(s){const u=s.index+s[0].length;a=a.slice(0,u)+`
`+e.join(`
`)+a.slice(u)}}const m=/\bvec3\s+col\b/.test(a)?"col":a.match(/\bvec3\s+(\w+)\s*=/)?.[1]??"";if(m){const s=[];l("saturation")||s.push(`${m} = mix(vec3(dot(${m}, vec3(0.299, 0.587, 0.114))), ${m}, saturation);`),l("hueShift")||s.push(wa(m)),s.length&&n(s.join(`
`))}return a}function Aa(t,o,a){let l=t,n=o;const e=[],m=o+`
`+t,s=/vec2 uv = [^;]+;/.test(t),u=[],d=[],p=a.filter(c=>!ya.has(c.id));for(const c of p){const M=new RegExp("\\b"+$(c.id)+"\\b").test(t),z=xa.has(c.id)||new RegExp("uniform\\s+(float|vec2|vec3|vec4)\\s+"+$(c.id)+"\\b").test(m);if(M&&z)continue;z||(n+=`uniform float ${c.id};
`);const k=Z(c.default),S=c.id;let w=null,P=!1;if(Sa.test(S)?(u.push(`(${S} / ${k})`),P=!0):Wa.test(S)&&s?w=`uv += (${S} - ${k});`:Ra.test(S)&&s&&c.default>0&&(w=`uv *= clamp((${S} / ${k}), 0.1, 10.0);`),w)l=l.replace(/vec2 uv = [^;]+;/,F=>F+`
  `+w);else if(!P){const F=Math.max(c.max-c.default,c.default-c.min,1e-4);d.push(`col = max((1.0 + ((${S} - ${k}) / ${Z(F)}) * 0.5), 0.1) * col;`)}e.push(S)}const W=new RegExp("\\bspeed\\b").test(l);if(!p.some(c=>c.id==="speed")&&!W&&new RegExp("\\buTime\\b").test(l)&&u.push("(speed / 1.0)"),u.length>0&&new RegExp("\\buTime\\b").test(l)){const c=u.join(" * ");l=l.replace(new RegExp("\\buTime\\b","g"),`uTime * ${c}`)}if(d.length>0){const c=l.lastIndexOf("fragColor = vec4(col, 1.0);");c>=0&&(l=l.slice(0,c)+d.join(`
`)+`
`+l.slice(c))}return{body:l,extraUniforms:n,wired:e}}const ka=["#version 300 es","precision highp float;","uniform float uTime;","uniform vec2 uResolution;","uniform vec2 uMouse;","uniform float uBass;","uniform float uMid;","uniform float uTreble;","uniform float uVolume;","uniform float uBeat;","uniform float uBeatPhase;","uniform float uBPM;","uniform float uSub;","uniform float uLowMid;","uniform float uHighMid;","uniform float uSpectralCentroid;","uniform float speed;","uniform float intensity;","uniform float distortion;","uniform float scale;","uniform float brightness;","uniform float hueShift;","uniform float saturation;","out vec4 fragColor;","","float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}","float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}","float fbm(vec2 p){float f=0.0;float a=0.5;for(int i=0;i<5;i++){f+=a*noise(p);p*=2.01;a*=0.5;}return f;}","vec3 pal(float u,float h){u+=h+uSpectralCentroid*0.35;return 0.5+0.5*cos(6.28318*(vec3(1.0,0.7,0.4)*u+vec3(0.0,0.12,0.2)));}","vec3 pal2(float u,float h){u+=h+uBass*0.2;float r=sin(u*6.28318)*0.5+0.5;float g=sin(u*6.28318+2.1)*0.5+0.5;float b=sin(u*6.28318+4.2)*0.5+0.5;return vec3(r,g,b);}","float beatGate(float k){return pow(max(0.0,sin(fract(uTime*uBPM/60.0*k)*3.14159)),2.0);}",""].join(`
`);function Ma(t){return["void main(){","  vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);","  float t=uTime*speed;","  vec2 p=uv*scale;","  float bass=clamp(uBass,0.0,1.0);","  float mid=clamp(uMid,0.0,1.0);","  float treb=clamp(uTreble,0.0,1.0);","  float vol=clamp(uVolume,0.0,1.0);","  float sub=clamp(uSub,0.0,1.0);","  float cnt=clamp(uSpectralCentroid,0.0,1.0);","  float beat=clamp(uBeat,0.0,1.0);","  float gate=beatGate(0.5);",...t.map(a=>"  "+a)].join(`
`)+`
`}const za=["  col=mix(col,vec3(1.0,0.7,0.5)*col+pal(t*0.1,0.0)*col*0.3,1.0);","  col*=intensity*(0.6+0.6*beat*0.7);","  col*=brightness;","  col=max(col,vec3(0.008));","  fragColor=vec4(col,1.0);","}",""].join(`
`),Ca=["  col*=intensity*(0.55+0.6*beat);","  col*=brightness;","  col=max(col,vec3(0.004));","  fragColor=vec4(col,1.0);","}",""].join(`
`),Ta=[{id:"speed",label:"Tempo",min:.3,max:3,def:1,step:.05,group:"animation"},{id:"intensity",label:"Intensity",min:.3,max:3,def:1,step:.05,group:"audio"},{id:"scale",label:"Zoom",min:.5,max:3,def:1,step:.05,group:"transform"},{id:"distortion",label:"Warp",min:0,max:3,def:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:.2,max:2.5,def:1,step:.05,group:"color"}],qa=[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.45,curve:"linear"},{signal:"mid",param:"hueShift",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],x=t=>Number.isInteger(t)?t+".0":String(t),g=[0,.1,.2,.3,.15,.05,.25,.35,.4,.2,.45,.5,.08,.18,.28,.38,.12,.22,.32,.42,.48,.55,.6,.33].map(x),h=["bass","bass","mid","mid","treb","treb","vol","sub","cnt","bass","mid","treb","vol","sub","cnt","bass","mid","treb","vol","sub","cnt","mid","treb","bass"];function y(t){return t==="treb"?"treble":t==="vol"?"volume":t==="cnt"||t==="sub"?"mid":t}function f(t,o,a,l,n,e,m={}){const s=[...Ta.map(c=>({id:c.id,label:c.label,min:c.min,max:c.max,default:c.def,step:c.step,group:c.group})),...e.map(c=>({id:c.id,label:c.label,min:c.min,max:c.max,default:c.def,step:c.step,group:c.group}))],u=m.audio??[],d=e.length?`
`+e.map(c=>`uniform float ${c.id};`).join(`
`)+`
`:"",p={distortion:1},W=m.epilogue==="pure"?Ca:za,v=n+`
`+W;return{id:t,name:o,category:a,description:l,tags:m.tags??[a,"reactive"],fragment:ka+d+_(v,p),uniforms:[],params:s,defaults:{speed:1,intensity:1,distortion:1,scale:1,brightness:1,hueShift:0,saturation:1,...Object.fromEntries(e.map(c=>[c.id,c.def]))},audioMappings:[...qa,...u],performanceTier:m.tier??"medium"}}function b(t,o){return Ma(t)+`
  vec3 col=`+o+`;
`}function G(t,o=3){const a=new Map;return t.filter(l=>{const n=l.id.replace(/-\d+$/,""),e=a.get(n)??0;return e>=o?!1:(a.set(n,e+1),!0)})}const Ba=["#version 300 es","precision highp float;","uniform float uTime;","uniform vec2 uResolution;","uniform vec2 uMouse;","uniform float uBass;","uniform float uMid;","uniform float uTreble;","uniform float uVolume;","uniform float uBeat;","uniform float uBeatPhase;","uniform float uBPM;","uniform float uSub;","uniform float uLowMid;","uniform float uHighMid;","uniform float uSpectralCentroid;","uniform float speed;","uniform float intensity;","uniform float distortion;","uniform float scale;","uniform float brightness;","uniform float hueShift;","uniform float saturation;","out vec4 fragColor;","","float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}","float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}","float fbm(vec2 p){float f=0.0;float a=0.5;for(int i=0;i<5;i++){f+=a*noise(p);p*=2.01;a*=0.5;}return f;}","vec3 pal(float u,float h){u+=h+uSpectralCentroid*0.35;return 0.5+0.5*cos(6.28318*(vec3(1.0,0.7,0.4)*u+vec3(0.0,0.12,0.2)));}","vec3 pal2(float u,float h){u+=h+uBass*0.2;float r=sin(u*6.28)*0.5+0.5;float g=sin(u*6.28+2.1)*0.5+0.5;float b=sin(u*6.28+4.2)*0.5+0.5;return vec3(r,g,b);}","float beatGate(float k){return pow(max(0.0,sin(fract(uTime*uBPM/60.0*k)*3.14159)),2.0);}",""].join(`
`);function V(t){return["void main(){","  vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);","  float t=uTime*speed;","  vec2 p=uv*scale;","  float bass=clamp(uBass,0.0,1.0);","  float mid=clamp(uMid,0.0,1.0);","  float treb=clamp(uTreble,0.0,1.0);","  float beat=clamp(uBeat,0.0,1.0);","  float vol=clamp(uVolume,0.0,1.0);","  float gate=beatGate(0.5);",...t.map(a=>"  "+a)].join(`
`)+`
`}const U=["  col=mix(col,vec3(1.0,0.7,0.5)*col+pal(t*0.1,0.0)*col*0.3,1.0);","  col*=intensity*(0.6+0.6*beat*0.7);","  col*=brightness;","  col=max(col,vec3(0.008));","  fragColor=vec4(col,1.0);","}",""].join(`
`),Fa=[{id:"speed",label:"Tempo",min:.3,max:3,def:1,step:.05,group:"animation"},{id:"intensity",label:"Intensity",min:.3,max:3,def:1,step:.05,group:"audio"},{id:"scale",label:"Zoom",min:.5,max:3,def:1,step:.05,group:"transform"},{id:"distortion",label:"Warp",min:0,max:3,def:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:.2,max:2.5,def:1,step:.05,group:"color"}],Da=[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.45,curve:"linear"},{signal:"mid",param:"hueShift",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}];function R(t,o,a,l,n,e,m=[],s="medium"){const u=[...Fa.map(v=>({id:v.id,label:v.label,min:v.min,max:v.max,default:v.def,step:v.step,group:v.group})),...e.map(v=>({id:v.id,label:v.label,min:v.min,max:v.max,default:v.def,step:v.step,group:v.group}))],d=m,p=e.length?`
`+e.map(v=>`uniform float ${v.id};`).join(`
`)+`
`:"",W={distortion:1};return{id:t,name:o,category:a,description:l,tags:[a,"reactive","trance","techno"],fragment:Ba+p+_(n,W),uniforms:[],params:u,defaults:{speed:1,intensity:1,distortion:1,scale:1,brightness:1,hueShift:0,saturation:1,...Object.fromEntries(e.map(v=>[v.id,v.def]))},audioMappings:[...Da,...d],performanceTier:s}}function A(t,o){return V(t)+"  vec3 col="+o+`;
`+U}function Ia(){const t=[],o=e=>Number.isInteger(e)?e+".0":String(e),a=[0,.1,.2,.3,.15,.05,.25,.35,.4,.2].map(o),l=["bass","bass","mid","mid","treb","treb","bass","mid","treb","bass"],n=e=>e==="treb"?"treble":e==="vol"?"volume":e;for(let e=0;e<10;e++){const m=a[e],s=l[e],u=3+e%6,d=["float g=beatGate(1.0)+beat*2.0;",`float colr=fract(p.x*cols+t*0.5+${s}*1.5);`],p=`vec3(pal(colr,${m}).r,0.15,0.35)*g*(0.4+${s})`;t.push(R(`tr-gate-${e+1}`,"Techno Gate "+(e+1),"vj",`Hard strobing beat-gated color walls (${s})`,A(d,p),[{id:"cols",label:"Columns",min:2,max:16,def:u,step:1,group:"shape"}],[{signal:n(s),param:"intensity",amount:.6,curve:"log"}]))}for(let e=0;e<10;e++){const m=a[e],s=l[e],u=4+e%5,d=[`float rr=length(p)*(1.0-${s}*0.3);`,`float r0=rr-(uBeatPhase*0.4+${s}*0.5);`,"float ring=exp(-abs(fract(r0*rings)-0.5)*7.0)*beatGate(1.0);"],p=`pal(rr*2.0+${s}*2.0,${m})*ring*(0.3+0.9*beat)`;t.push(R(`tr-kickring-${e+1}`,"Kick Rings "+(e+1),"cosmic",`Beat-triggered expanding rings driven by ${s}`,A(d,p),[{id:"rings",label:"Rings",min:2,max:16,def:u,step:1,group:"shape"}],[{signal:n(s),param:"scale",amount:.5,curve:"log"}]))}for(let e=0;e<10;e++){const m=a[e],s=l[e],u=5+e%6,d=["float aa=atan(p.y,p.x);","float rr=length(p);","p=mat2(cos(t*0.5+uBeatPhase*0.8),-sin(t*0.5+uBeatPhase*0.8),sin(t*0.5+uBeatPhase*0.8),cos(t*0.5+uBeatPhase*0.8))*p;","p+=vec2(noise(p*3.0+t),noise(p*3.0-t))*distortion*0.3;"],p=`pal(aa/6.28*arms+rr*2.0+${s}*2.0+t*0.4,${m})*(exp(-rr*1.2)+0.2*bass)`;t.push(R(`tr-rot-${e+1}`,"Hypno Tunnel "+(e+1),"abstract",`Hypnotic rotating tunnel (trance staple) on ${s}`,A(d,p),[{id:"arms",label:"Arms",min:2,max:16,def:u,step:1,group:"shape"}],[{signal:n(s),param:"distortion",amount:.6,curve:"log"}]))}for(let e=0;e<10;e++){const m=a[e],s=l[e],u=4+e%5,d=["p+=vec2(noise(p*2.0+t*0.4),noise(p*2.0-t*0.4))*distortion;",`float sw=sin(length(p)*freq-t*2.0+atan(p.y,p.x)*3.0)+${s}*1.5;`],p=`pal(sw*0.5+0.5,${m})*smoothstep(1.6,0.0,length(p))`;t.push(R(`tr-swirl-${e+1}`,"Spectral Swirl "+(e+1),"liquid",`Swirling spectral liquid reacting to ${s}`,A(d,p),[{id:"freq",label:"Frequency",min:2,max:12,def:u,step:.5,group:"shape"}],[{signal:n(s),param:"distortion",amount:.5,curve:"log"}]))}for(let e=0;e<10;e++){const m=a[e],s=l[e],u=5+e%8,d=["float a=atan(p.y,p.x);float rr=length(p);","p=mat2(cos(t*0.3+uBeatPhase*0.6),-sin(t*0.3+uBeatPhase*0.6),sin(t*0.3+uBeatPhase*0.6),cos(t*0.3+uBeatPhase*0.6))*p;","float rays=sin(a*petals+t*2.0)*0.5+0.5;",`float ring=pow(max(0.0,sin(rr*8.0-t*3.0+${s}*4.0)),3.0);`],p=`pal(rays*0.5+ring*0.5+${s}*0.5,${m})*(ring*0.7+rays*0.5)*(0.4+0.7*beat)`;t.push(R(`tr-mandala-${e+1}`,"Rave Mandala "+(e+1),"geometric",`Rotating rave mandala pulsing with ${s}`,A(d,p),[{id:"petals",label:"Petals",min:3,max:20,def:u,step:1,group:"shape"}],[{signal:n(s),param:"distortion",amount:.4,curve:"log"}]))}for(let e=0;e<10;e++){const m=a[e],s=l[e],u=6+e%6,d=[`float amp=0.15+${s}*0.5;`,`float w=sin(p.x*freq+t*2.0)+${s}*1.4*sin(p.x*freq*0.7-t*3.0);`,"float d=exp(-abs(p.y-w*amp)*10.0);"],p=`pal(p.x*3.0+${s}*2.0,${m})*d*(0.5+0.8*bass)+vec3(pal(${s}*2.0,${m})*d*bass*0.5)`;t.push(R(`tr-basswave-${e+1}`,"Bass Visor "+(e+1),"synthwave",`Saw-wave visor oscilloscope driven by ${s}`,A(d,p),[{id:"freq",label:"Frequency",min:2,max:16,def:u,step:1,group:"shape"}],[{signal:n(s),param:"intensity",amount:.6,curve:"log"}]))}for(let e=0;e<10;e++){const m=a[e],s=l[e],u=["p+=vec2(noise(p*2.0+t),noise(p*2.0-t))*distortion;","float detp=(detail-3.0);",`float f=sin(p.x*(1.0+detp*0.3)+t)+sin(p.y*(1.0+detp*0.3)*1.3-t*0.8)+fbm(p*(1.0+detp*0.4)+${s}*3.0)+${s}*2.0;`],d=`pal(f/4.0+0.5,${m})*(0.6+0.6*bass)+pal2(f/4.0,${m})*${s}*0.5`;t.push(R(`tr-core-${e+1}`,"Plasma Core "+(e+1),"liquid",`Throbbing plasma core reacting to ${s}`,A(u,d),[{id:"detail",label:"Detail",min:1,max:6,def:3,step:.5,group:"shape"}],[{signal:n(s),param:"distortion",amount:.5,curve:"log"}]))}for(let e=0;e<10;e++){const m=a[e],s=l[e],u=8+e%7,d=["vec2 id=floor(p*stars);vec2 fr=fract(p*stars)-0.5;","float rnd=hash(id+floor(t*2.0));","float sp=exp(-length(fr)*5.0)*step(0.6,rnd)*(0.3+0.9*beat);"],p=`pal(rnd+${s}*0.6,${m})*sp`;t.push(R(`tr-starburst-${e+1}`,"Starburst "+(e+1),"particle",`Strobing particle starfield gated by ${s}`,A(d,p),[{id:"stars",label:"Stars",min:4,max:20,def:u,step:1,group:"shape"}],[{signal:n(s),param:"intensity",amount:.5,curve:"log"}]))}for(let e=0;e<10;e++){const m=a[e],s=l[e],u=3+e%5,d=["float a=atan(p.y,p.x);float rr=length(p);",`float sp=mod(a/6.28*arms-log(rr+0.05)*1.6+t*0.6+${s}*0.5,1.0);`,"float arm=smoothstep(0.3,0.0,abs(fract(sp*arms)-0.5));"],p=`pal(sp+${s}*0.5,${m})*arm*exp(-rr*1.3)*(0.5+0.8*bass)+pal(sp,${m})*exp(-rr*4.0)*mid`;t.push(R(`tr-galaxy-${e+1}`,"Spiral Galaxy "+(e+1),"cosmic",`Hypnotic spiral galaxy wound louder by ${s}`,A(d,p),[{id:"arms",label:"Arms",min:2,max:10,def:u,step:1,group:"shape"}],[{signal:n(s),param:"distortion",amount:.5,curve:"log"}]))}for(let e=0;e<10;e++){const m=a[e],s=l[e],u=4+e%6,d=["float a=atan(p.y,p.x);float rr=length(p);","float seg=acos(cos(a*sides));",`float rad=rr+${s}*0.3+uBeatPhase*0.15;`,"float ed=exp(-abs(rad-0.35-fbm(vec2(seg,rr)*3.0+t)*0.25)*40.0);"],p=`pal(seg*rr+${s}*2.0+t*0.3,${m})*(ed+0.15*smoothstep(0.5,0.2,rad))`;t.push(R(`tr-prism-${e+1}`,"Chroma Prism "+(e+1),"geometric",`Chromatic prism edge with ${s}-driven motion`,A(d,p),[{id:"sides",label:"Sides",min:3,max:12,def:u,step:1,group:"shape"}],[{signal:n(s),param:"distortion",amount:.5,curve:"log"}]))}for(let e=0;e<10;e++){const m=a[e],s=l[e],u=4+e%5,d=["vec2 c=floor(p*cells);",`float check=mod(c.x+c.y+floor(t*4.0)+${s}*4.0,2.0);`,"float gl=exp(-abs(length(fract(p*cells)-0.5))*6.0);"],p=`pal(check*0.5+${s}*0.5,${m})*(0.3+0.7*gl)*(0.5+0.8*beat)`;t.push(R(`tr-checker-${e+1}`,"Boggle Checker "+(e+1),"vj",`Flashing checkerboard grid gated to ${s}`,A(d,p),[{id:"cells",label:"Cells",min:2,max:12,def:u,step:1,group:"shape"}],[{signal:n(s),param:"intensity",amount:.6,curve:"log"}]))}for(let e=0;e<10;e++){const m=a[e],s=l[e],u=5+e%5,p=["vec3 acc=vec3(0.0);","float cnt=bodies;",`for(int i=0;i<${Math.min(u,9)};i++){`," float fi=float(i);"," vec2 ctr=vec2(sin(fi*2.399+t*(0.3+0.4*bass))*0.6,cos(fi*1.361-t*0.3)*0.6);",` float rad=0.1+${s}*0.15+0.04*sin(t*4.0+fi);`," float dd=length(p-ctr);",` acc+=pal(fi/cnt+${s}*0.4,${m})*exp(-dd*dd*24.0);`,"}"],W=V(p)+`  vec3 col=acc*(0.5+0.8*bass);
`+U;t.push(R(`tr-orbital-${e+1}`,"Orbital Bass "+(e+1),"particle",`Orbiting bass-pumped glow bodies reacting to ${s}`,W,[{id:"bodies",label:"Bodies",min:3,max:12,def:u,step:1,group:"shape"}],[{signal:n(s),param:"scale",amount:.45,curve:"log"}]))}return t}const Oa=G(Ia(),3);function $a(){const t=[];for(let o=0;o<20;o++){const a=g[o],l=h[o],n=4+o%11,e=.2+.2*(o%3),m=["float a=atan(p.y,p.x);","float rr=length(p);",`float dst=1.0/(rr+0.05)+t*(0.25+${x(e)});`,`dst+=${l}*0.4;`,"vec2 wq2=p+fbm(p*3.0+t*0.2)*distortion;","float ang=mod(a*folds+dst*2.0+fbm(wq2)*2.0,6.28318);","float wall=exp(-abs(fract(dst*0.4+noise(vec2(ang,dst)*1.5+t*0.1))-0.5)*8.0);"],s=`pal(ang/6.28318+rr*2.0+${l}*0.8,${a})*wall*(0.3+0.6*sub+bass*0.4)*0.7`;t.push(f(`dp-tunnel-${o+1}`,"Warp Tunnel "+(o+1),"fractals",`Domain-warped fractal tunnel swelling with ${l}`,b(m,s),[{id:"folds",label:"Folds",min:2,max:14,def:n,step:1,group:"shape"}],{audio:[{signal:y(l),param:"distortion",amount:.6,curve:"log"}],tier:"high"}))}for(let o=0;o<20;o++){const a=g[o],l=h[o],n=.2+.2*(o%3),e=[`vec2 q3=p+vec2(sin(t*0.3+${l}*2.0),cos(t*0.4+${l}))*(0.4+0.4*bass)*distortion;`,"float f1=fbm(q3*3.0+t*0.15);","float f2=fbm(q3*3.0+4.0*f1);","float f3=fbm(q3*5.0+4.0*f2);",`float vein=exp(-abs(f2-0.5)*${x(8+n*6)});`],m=`pal(f3*2.0+f1*0.5+f2+${l}*0.8,${a})*(0.35+0.65*f3)*(0.6+0.5*bass)+pal2(f3,${a})*vein*mid`;t.push(f(`dp-marble-${o+1}`,"Living Marble "+(o+1),"abstract",`Triple-domain-warped flowing marble lit by ${l}`,b(e,m),[],{audio:[{signal:y(l),param:"distortion",amount:.5,curve:"log"}],tier:"high"}))}for(let o=0;o<20;o++){const a=g[o],l=h[o],n=.3+.3*(o%3),e=["vec2 kp = p*1.15;","float acc=0.0;","for(int i=0;i<8;i++){",`  kp=abs(kp)/max(dot(kp,kp),0.001)-${x(n)};`,`  kp+=vec2(${l}*0.22,0.0)+uBass*0.04;`,"  acc+=exp(-length(kp)*0.9);","}","float kd=exp(-abs(length(p)-0.9)*2.0);"],m=`pal(acc*0.8+${l}*0.5+kd,${a})*(0.35+acc*0.5)*(0.5+0.6*bass)*(0.7+kd*0.5)`;t.push(f(`dp-kalis-${o+1}`,"Kalis Orbit "+(o+1),"fractals",`Kalis escape-time orbit coloured by ${l}`,b(e,m),[],{audio:[{signal:y(l),param:"distortion",amount:.5,curve:"log"}],tier:"high"}))}for(let o=0;o<20;o++){const a=g[o],l=h[o],n=5+o%8,e=0+.2*(o%3),m=["vec2 g=floor(p*cells);","vec2 f=fract(p*cells)-0.5;",`float v=hash(g+floor(t*0.5*(1.0+${l})));`,"vec2 fw=step(0.5,v)==1.0?vec2(f.y,f.x):f;","float d=min(abs(fw.x-fw.y),0.7-abs(fw.x+fw.y));",`float line=exp(-abs(d)*14.0)*(0.7+${x(e)}*step(0.75,v));`],s=`pal(fw.x+fw.y+${l}*0.5+t*0.05,${a})*line*(0.55+0.5*bass)`;t.push(f(`dp-truchet-${o+1}`,"Truchet Flow "+(o+1),"geometric",`Randomized truchet tile arcs flowing on ${l}`,b(m,s),[{id:"cells",label:"Cells",min:2,max:16,def:n,step:1,group:"shape"}],{audio:[{signal:y(l),param:"scale",amount:.45,curve:"log"}]}))}for(let o=0;o<20;o++){const a=g[o],l=h[o],n=4+o%7,e=["vec2 idv=floor(p*cells);","vec2 frv=fract(p*cells)-0.5;","float m=1.0;","vec2 mc=vec2(0.0);","for(int i=-1;i<=1;i++){","  for(int j=-1;j<=1;j++){","    vec2 off=vec2(float(i),float(j));","    vec2 gw=idv+off;","    vec2 rw=off+vec2(hash(gw),hash(gw+vec2(1.7,9.2)))-frv;","    float d2=dot(rw,rw);","    if(d2<m){m=d2;mc=gw;}","  }","}","float cellb=smoothstep(0.4,0.0,sqrt(m));",`vec2 flow=mc+${l}*0.5+t*0.05;`],m=`pal(length(flow)*2.0+cellb*0.3+${l}*0.5,${a})*(cellb*0.75+0.25)*(0.55+0.6*bass)`;t.push(f(`dp-voronoi-${o+1}`,"Voronoi Flux "+(o+1),"geometric",`Flowing worley cell field driven by ${l}`,b(e,m),[{id:"cells",label:"Cells",min:3,max:12,def:n,step:1,group:"shape"}],{audio:[{signal:y(l),param:"distortion",amount:.4,curve:"log"}]}))}for(let o=0;o<20;o++){const a=g[o],l=h[o],n=3+o%6,e=.2+.1*(o%3),m=["vec2 gp=p*lattice;",`float gy=sin(gp.x+${l}*2.0)*cos(gp.y-t*(0.3+${x(e)}))+sin(gp.y-t*0.4)*cos((gp.x+gp.y)*0.7+${l}*1.5)+sin((gp.x+gp.y)*0.7)*cos(gp.x+t*0.5);`,"float want=exp(-abs(gy)*4.5)*(0.25+0.8*sub);"],s=`pal(gy*0.5+length(gp)*0.2+${l}*0.5+t*0.04,${a})*want*(0.5+0.8*bass)`;t.push(f(`dp-gyroid-${o+1}`,"Gyroid Lattice "+(o+1),"abstract",`Tri-periodic gyroid sheets pulsing with ${l}`,b(m,s),[{id:"lattice",label:"Lattice",min:1,max:10,def:n,step:.5,group:"shape"}],{audio:[{signal:y(l),param:"intensity",amount:.5,curve:"log"}]}))}for(let o=0;o<20;o++){const a=g[o],l=h[o],n=8+o%9,e=["vec2 cg=floor(p*cols);","vec2 cf=fract(p*cols);",`float x=0.5+0.35*sin(t*0.3+${l}*2.0);`,`float rA=2.8+1.4*${l};`,"float rB=3.4+1.2*bass;","float logSum=0.0;","for(int i=0;i<14;i++){","  float rr2=mod(float(i),2.0)<1.0?rA:rB;","  x=rr2*x*(1.0-x);","  logSum+=log(max(abs(rr2*(1.0-2.0*x)),1e-4));","}","float lyap=logSum/14.0;"],m=`pal(lyap*6.0+cf.x+cf.y+${l}*0.4+t*0.05,${a})*(0.3+0.7*smoothstep(0.15,0.85,lyap))*(0.6+0.5*bass)`;t.push(f(`dp-lyapunov-${o+1}`,"Chaos Field "+(o+1),"fractals",`Lyapunov chaos field marching to ${l}`,b(e,m),[{id:"cols",label:"Columns",min:4,max:20,def:n,step:1,group:"shape"}],{audio:[{signal:y(l),param:"distortion",amount:.6,curve:"log"}]}))}for(let o=0;o<20;o++){const a=g[o],l=h[o],n=4+o%7,e=["float a=atan(p.y,p.x);","float rr=length(p);","float fold=(6.28318)/segs;","float sa=mod(a,fold)-0.5*fold;",`vec2 fp=rr*vec2(cos(sa)+${l}*0.3,sin(sa));`,`float wv=sin(fp.x*freq*2.0-t*2.0)*0.5+sin(fp.x*freq*1.4+t*3.0+${l}*1.5)*0.3+treb*0.7*sin(fp.x*freq+t*4.0);`,"float wl=exp(-abs(fp.y-wv)*14.0);"],m=`pal(fp.x*2.0+wv+rr+${l}*0.6,${a})*wl*(0.45+0.75*treb)+(pal(rr*3.0,${a})*exp(-rr*3.0)*0.25*bass)`;t.push(f(`dp-kscope-${o+1}`,"Spectral Kaleido "+(o+1),"synthwave",`Polar-folded oscilloscope kaleidoscope fed by ${l}`,b(e,m),[{id:"segs",label:"Segments",min:3,max:12,def:n,step:1,group:"shape"},{id:"freq",label:"Frequency",min:2,max:10,def:5,step:1,group:"shape"}],{audio:[{signal:y(l),param:"intensity",amount:.6,curve:"log"}],tier:"high"}))}for(let o=0;o<20;o++){const a=g[o],l=h[o],n=4+o%9,e=["float a=atan(p.y,p.x);","float rr=length(p);",`float roser=0.5+0.45*cos(a*petals*0.5)+${l}*0.12+uBeatPhase*0.08;`,"vec2 fp2=rr*vec2(cos(a)+sin(a)*0.0,sin(a));","float pet=exp(-abs(length(fp2)-roser)*26.0);",`float disc=exp(-abs(rr-0.5-${l}*0.2)*16.0)*sub;`],m=`pal(a/6.28318*petals+rr*2.0+${l}*0.5+t*0.1,${a})*(pet*(0.5+0.8*beat)+0.2*disc)`;t.push(f(`dp-rosefold-${o+1}`,"Rose Fold "+(o+1),"geometric",`Kaleidoscopic rosette unfolding on ${l}`,b(e,m),[{id:"petals",label:"Petals",min:3,max:18,def:n,step:1,group:"shape"}],{audio:[{signal:y(l),param:"distortion",amount:.5,curve:"log"}]}))}for(let o=0;o<20;o++){const a=g[o],l=h[o],n=1.2+.4*(o%3),e=["vec2 w=vec2(fbm(p*2.0+t*0.3),fbm(p*2.0-t*0.3));",`vec2 w2=vec2(fbm(p*3.0+w*${x(n)}+t*0.2),fbm(p*3.0-w*${x(n)}-t*0.2));`,`float pl=sin(length(w2)*${x(14+n*4)}-t*1.5+${l}*4.0)+fbm(p*1.5+w2*2.0)+${l}*2.0;`],m=`pal(pl/4.0+0.5,${a})*(0.5+0.8*bass)+pal2(pl/5.0,${a})*${l}*0.4`;t.push(f(`dp-plasma-${o+1}`,"Fractal Plasma "+(o+1),"liquid",`Chain-warped fractal plasma roaring with ${l}`,b(e,m),[],{audio:[{signal:y(l),param:"distortion",amount:.6,curve:"log"}],tier:"high"}))}return t}const Za=G($a(),3);function _a(){const t=[],o=a=>.2+.2*(a%3);for(let a=0;a<8;a++){const l=g[a],n=h[a],e=6+a%5,m=["float a=atan(p.y,p.x);","float rr=length(p);",`float arch=0.5+0.5*sin(a*slots-t*1.5+${n}*2.0);`,"float bandR=0.22+0.32*arch*(0.5+0.5*bass)+uBeatPhase*0.05;","float ring=exp(-abs(rr-bandR)*width);"],s=`pal(a/6.28318+rr*2.0+${n}*0.6,${l})*ring*(0.35+0.8*treb)+pal(rr*4.0,${l})*exp(-abs(rr-0.18)*30.0)*sub`;t.push(f(`obj-rings-${a+1}`,"Audio Rings "+(a+1),"geometric",`Rotating spectral arc bands pumped by ${n}`,b(m,s),[{id:"slots",label:"Slots",min:3,max:16,def:e,step:1,group:"shape"},{id:"width",label:"Width",min:8,max:48,def:26+a%4*6,step:1,group:"shape"}],{audio:[{signal:y(n),param:"distortion",amount:.5,curve:"log"}],tier:"high",epilogue:"pure"}))}for(let a=0;a<8;a++){const l=g[a],n=h[a],e=16+a%9*4,m=["float a=atan(p.y,p.x);","float rr=length(p);","float bi=mod(a/6.28318+0.5,1.0);",`float eh=0.5+0.5*sin(bi*24.0-t*(0.5+${x(o(a))})+${n}*3.0);`,"float barR=0.10+0.48*eh*(0.4+0.6*bass);","float seg=step(0.5,abs(fract(bi*bars)-0.5));","float bd=exp(-abs(rr-barR)*16.0)*seg;"],s=`pal(bi+rr*1.5+${n}*0.5,${l})*bd`;t.push(f(`obj-bars-${a+1}`,"Spectrum Bars "+(a+1),"particle",`Radial equalizer bars vibrating with ${n}`,b(m,s),[{id:"bars",label:"Bars",min:8,max:96,def:e,step:2,group:"shape"}],{audio:[{signal:y(n),param:"intensity",amount:.6,curve:"log"}],epilogue:"pure"}))}for(let a=0;a<8;a++){const l=g[a],n=h[a],e=1+a%4,m=2+a%4,s=1.1+.2*(a%3),u=[`float lt=fract(t*(0.28+${n}*0.4));`,`float lx=cos(${x(e)}*6.28318*lt+${n}*2.0+uBeatPhase*0.6);`,`float ly=sin(${x(m)}*6.28318*lt+${x(s)});`,"vec2 lp=vec2(lx,ly)*(0.72+0.35*bass);","float d=length(p-lp);","float trace=exp(-d*26.0);","float halo=exp(-d*7.0)*0.28;"],d=`pal(lt*3.0+${n}*0.5,${l})*(trace+halo)+pal(lx*0.5+0.5,${l})*exp(-abs(length(p)-1.05-(0.15*bass))*10.0)*0.18*mid`;t.push(f(`obj-lissajous-${a+1}`,"Lissajous "+(a+1),"abstract",`Stereo-pair lissajous trace chasing ${n}`,b(u,d),[],{audio:[{signal:y(n),param:"intensity",amount:.5,curve:"log"}],tier:"high",epilogue:"pure"}))}for(let a=0;a<8;a++){const l=g[a],n=h[a],e=5+a%4,m=["vec3 accn=vec3(0.0);","float nb=bodies;","for(int i=0;i<8;i++){","  float fi=float(i);","  float rat=mod(fi,nb)/nb;",`  float angt=rat*6.28318*(1.0+fi*0.13)+t*(0.25+0.3*bass)+${n}*1.5;`,"  vec2 ctr=vec2(sin(angt),cos(angt*1.3))*vec2(0.7,0.62)*(0.8+0.28*sub);",`  float rad=0.075+${n}*0.1+0.03*sin(t*4.0+fi);`,"  float dd=length(p-ctr);",`  accn+=pal(rat+${l},${l})*exp(-dd*dd*34.0);`,"}"],s=`accn*(0.6+0.8*bass)+pal(${n}*2.0,${l})*exp(-abs(length(p)-0.9)*9.0)*0.14*mid`;t.push(f(`obj-orbits-${a+1}`,"Orbit Nodes "+(a+1),"particle",`Orbiting glow nodes on ${n}`,b(m,s),[{id:"bodies",label:"Bodies",min:3,max:9,def:e,step:1,group:"shape"}],{audio:[{signal:y(n),param:"scale",amount:.5,curve:"log"}],epilogue:"pure"}))}for(let a=0;a<8;a++){const l=g[a],n=h[a],e=5+a%6,m=["float a=atan(p.y,p.x);","float rr=length(p);",`float petalE=0.5+0.5*sin(a*petals*0.5-t*1.2+${n}*2.0);`,"float pr=0.3+0.42*petalE*(0.4+0.6*bass)+uBeatPhase*0.05;","float pd=exp(-abs(rr-pr)*22.0)*(0.6+0.6*step(0.35,petalE));"],s=`pal(a/6.28318*petals+rr*1.5+${n}*0.5,${l})*pd`;t.push(f(`obj-petals-${a+1}`,"Petal Field "+(a+1),"geometric",`Radial petal field blooming with ${n}`,b(m,s),[{id:"petals",label:"Petals",min:3,max:18,def:e,step:1,group:"shape"}],{audio:[{signal:y(n),param:"distortion",amount:.5,curve:"log"}],epilogue:"pure"}))}for(let a=0;a<8;a++){const l=g[a],n=h[a],e=4+a%6,m=[`float wvy=sin(p.x*freq+t*2.0)+${n}*1.2*sin(p.x*freq*0.7-t*3.0)+treb*0.5*sin(p.x*freq*0.4+t*4.0);`,`float wamp=0.13+${n}*0.3+sub*0.08;`,"float wvpos=wvy*wamp;","float fv=exp(-abs(p.y-wvpos)*12.0);","float fv2=exp(-abs(abs(p.y-wvpos)-0.028)*70.0);"],s=`pal(p.x*2.0+${n}*2.0+t*0.2,${l})*(fv*0.5+fv2*1.2)*(0.5+0.6*treb)`;t.push(f(`obj-waves-${a+1}`,"Wave Ribbon "+(a+1),"synthwave",`Oscilloscope ribbon waving on ${n}`,b(m,s),[{id:"freq",label:"Frequency",min:2,max:12,def:e,step:1,group:"shape"}],{audio:[{signal:y(n),param:"scale",amount:.45,curve:"log"}],epilogue:"pure"}))}for(let a=0;a<8;a++){const l=g[a],n=h[a],e=3+a%5,m=["vec2 gc=floor(p*gridN);","vec2 gf=fract(p*gridN)-0.5;",`float gy=0.5+0.5*sin(gc.x*1.1+gc.y*1.7-t*(0.5+beat*2.0)+${n}*2.0);`,"float gcell=step(gf.x*gf.x+gf.y*gf.y,0.12)*(0.15+0.85*gy)*(0.3+0.7*beat);","float gline=exp(-abs(length(gf)-0.5)*32.0)*0.22;"],s=`pal(gc.x*0.11+gc.y*0.07+${n}*0.4,${l})*(gcell+gline)`;t.push(f(`obj-grid-${a+1}`,"Strobe Grid "+(a+1),"vj",`Beat-gated equalizer grid cells on ${n}`,b(m,s),[{id:"gridN",label:"Density",min:2,max:10,def:e,step:1,group:"shape"}],{audio:[{signal:y(n),param:"intensity",amount:.7,curve:"log"}],epilogue:"pure"}))}for(let a=0;a<8;a++){const l=g[a],n=h[a],e=5+a%6,m=["vec2 sid=floor(p*sparks);","vec2 sf=fract(p*sparks)-0.5;","float rnd=hash(sid);",`float life=fract(t*(0.35+${x(o(a))})+rnd*3.0);`,"float burst=1.0-smoothstep(0.0,0.6,abs(life-0.5));","vec2 dir=vec2(cos(rnd*6.28318),sin(rnd*6.28318));","float dist=life*0.9*(0.5+0.7*bass);",`float dd2=length(sf*0.5-(dir*dist)*(0.25+0.12*${n}));`,"float sp=exp(-dd2*dd2*44.0)*burst*(0.35+0.8*beat);"],s=`pal(rnd+${n}*0.5+t*0.05,${l})*sp`;t.push(f(`obj-sparks-${a+1}`,"Spark Burst "+(a+1),"particle",`Radial spark bursts firing on ${n}`,b(m,s),[{id:"sparks",label:"Sparks",min:4,max:14,def:e,step:1,group:"shape"}],{audio:[{signal:y(n),param:"intensity",amount:.6,curve:"log"}],epilogue:"pure"}))}for(let a=0;a<8;a++){const l=g[a],n=h[a],e=4+a%6,m=["float a=atan(p.y,p.x);","float rr=length(p);",`float radiusStar=(0.34+0.26*smoothstep(0.2,0.9,${n})+uBeatPhase*0.05)/abs(cos(0.5*sides*a));`,"float pol=exp(-abs(rr-radiusStar)*22.0);"],s=`pal(a/6.28318*sides+rr*2.0+${n}*0.5,${l})*pol*(0.5+0.7*beat)`;t.push(f(`obj-polygons-${a+1}`,"Polygon Morph "+(a+1),"geometric",`Star polygon morphing with ${n}`,b(m,s),[{id:"sides",label:"Sides",min:3,max:10,def:e,step:1,group:"shape"}],{audio:[{signal:y(n),param:"distortion",amount:.5,curve:"log"}],epilogue:"pure"}))}for(let a=0;a<8;a++){const l=g[a],n=h[a],e=5+a%8,m=[`float cphase=fract((p.x+1.0)*0.5*links+${n})*6.28318-t*1.5*(0.7+0.4*bass);`,"float cwob=sin(cphase)*0.22;","float ch=exp(-abs(p.y-cwob)*16.0)*smoothstep(0.0,0.45,1.0-abs(p.x));","float ch2=exp(-abs(p.y+cwob)*16.0)*smoothstep(0.0,0.45,1.0-abs(p.x))*0.4;"],s=`pal(p.x*1.5+${n}*0.5+cwob,${l})*ch+pal2(cwob,${l})*ch2`;t.push(f(`obj-chains-${a+1}`,"Audio Chain "+(a+1),"abstract",`Mirrored wobbled chain strands on ${n}`,b(m,s),[{id:"links",label:"Links",min:3,max:24,def:e,step:1,group:"shape"}],{audio:[{signal:y(n),param:"distortion",amount:.6,curve:"log"}],epilogue:"pure"}))}for(let a=0;a<8;a++){const l=g[a],n=h[a],e=["float a=atan(p.y,p.x);","float rr=length(p);","float theta=mod(a/6.28318-t*(0.2+0.3*bass),1.0);",`float trail=smoothstep(0.92,0.0,abs(theta-fract(${n}*0.4+t*0.12)));`,"float hone=exp(-abs(rr-0.42-0.14*sub)*26.0)*trail;"],m=`pal(theta+rr*2.0+${n}*0.5,${l})*hone*(0.5+0.8*treb)`;t.push(f(`obj-comets-${a+1}`,"Comet Trail "+(a+1),"cosmic",`Rotating comet trails orbiting ${n}`,b(e,m),[],{audio:[{signal:y(n),param:"intensity",amount:.5,curve:"log"}],epilogue:"pure"}))}for(let a=0;a<8;a++){const l=g[a],n=h[a],e=6+a%5,m=["float a=atan(p.y,p.x);","float rr=length(p);",`float spin=fract(t*0.25*(1.0+0.6*bass)+${n}*0.3);`,`float ring=exp(-abs(rr-0.4-0.09*sin(a*6.0+t*0.8+${n}*2.0)-0.07*bass)*38.0);`,"float spoke=smoothstep(0.78,0.38,rr)*exp(-abs(fract(a/6.28318*spokes+spin*spokes)-0.5)*20.0);"],s=`pal(a/6.28318+rr*1.5+${n}*0.5,${l})*(ring+spoke*0.5)*(0.5+0.6*bass)`;t.push(f(`obj-torus-${a+1}`,"Torus Scan "+(a+1),"vj",`Rotating scanner ring with spokes on ${n}`,b(m,s),[{id:"spokes",label:"Spokes",min:3,max:16,def:e,step:1,group:"shape"}],{audio:[{signal:y(n),param:"scale",amount:.5,curve:"log"}],epilogue:"pure"}))}return t}const Ga=G(_a(),3),X={noise:{glsl:`
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
`,description:"2D value noise (hash21 + vnoise)",requires:[]},fbm:{glsl:`
float fbm5(vec2 p) {
  float f = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { f += a * vnoise(p); p = p * 2.03 + vec2(11.3, 7.1); a *= 0.5; }
  return f;
}
`,description:"5-octave fractal brownian motion (needs noise chunk first)",requires:["noise"]},domainWarp:{glsl:`
vec2 warp(vec2 p, float t) {
  vec2 q = vec2(fbm5(p + t * 0.25), fbm5(p + vec2(5.2, 1.3) - t * 0.19));
  return p + 1.1 * (q - 0.5);
}
`,description:"domain-warped sampling point (needs fbm chunk first)",requires:["fbm"]},palette:{glsl:`
vec3 iqp(float t, vec3 a, vec3 b, vec3 c, vec3 d) { return a + b * cos(6.28318 * (c * t + d)); }
`,description:"IQ cosine palette helper",requires:[]},rotor:{glsl:`
mat2 rot2(float a) { float c = cos(a); float s = sin(a); return mat2(c, -s, s, c); }
`,description:"2D rotation matrix",requires:[]},voronoi:{glsl:`
vec2 voronoi(vec2 p) {
  vec2 ip = floor(p); vec2 fp = fract(p);
  float md = 8.0; vec2 mpos = vec2(0.0);
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec2 o = vec2(float(x), float(y));
    vec2 r = o + hash21(ip + o) - fp;
    float d = dot(r, r);
    if (d < md) { md = d; mpos = r; }
  }
  return vec2(sqrt(md), mpos.x + mpos.y);
}
`,description:"F1 voronoi distance + hash (needs noise chunk for hash21)",requires:["noise"]},tile:{glsl:`
vec2 tile(vec2 p, float n) { return (fract(p * n) - 0.5) / n; }
vec2 mirrorTile(vec2 p, float n) {
  p = p * n - 0.5;
  p = abs(fract(p * 0.5) * 2.0 - 1.0) - 0.5;
  return p / n;
}
`,description:"tiled / mirrored tile reduction",requires:[]},vignette:{glsl:`
float vig(vec2 uv) { return smoothstep(1.2, 0.35, length(uv)); }
`,description:"radial vignette factor",requires:[]},beatFlash:{glsl:`
float beatFlash(float k) { return pow(max(0.0, 1.0 - uBeatPhase) * uBeat * 2.0, k); }
`,description:"beat-synced flash envelope",requires:[]},bassBar:{glsl:`
float bassBar(vec2 uv, float level, float w) {
  return step(0.0, uv.y) * step(uv.y, level) * smoothstep(w, 0.0, abs(uv.x));
}
`,description:"audio bounce column (uv.y up to level)",requires:[]},flowField:{glsl:`
vec2 flow(vec2 p, float t) {
  float a = fbm5(p + t * 0.18) * 6.28318 * 3.0;
  return vec2(cos(a), sin(a));
}
`,description:"fbm-borne wandering flow (needs fbm chunk first)",requires:["fbm"]},gridLines:{glsl:`
float gridLine(vec2 uv, float spacing, float w) {
  vec2 g = abs(fract(uv * spacing) - 0.5);
  return smoothstep(w, 0.0, min(g.x, g.y));
}
`,description:"antialiased grid line factor",requires:[]},mandala:{glsl:`
vec2 polarMirror(vec2 uv, int petals) {
  float ang = atan(uv.y, uv.x) * float(petals) / 2.0;
  ang = abs(mod(ang, 2.0) - 1.0);
  return vec2(length(uv), ang);
}
`,description:"rotational mirror to wedge (for mandala/star motifs)",requires:[]}},Pa=Object.keys(X),T=/\{\{chunk:([a-zA-Z0-9_]+)\}\}/g;function ja(t){return T.lastIndex=0,T.test(t)}function Ea(t){const o=new Set(Pa),a=[];T.lastIndex=0;let l;for(;(l=T.exec(t))!==null;)!o.has(l[1])&&!a.includes(l[1])&&a.push(l[1]);return a}function La(t){if(!ja(t))return t;const o=Ea(t);if(o.length)throw new Error(`[compose] unknown chunk(s): ${o.join(", ")}`);return t.replace(T,(a,l)=>X[l].glsl)}const Na=`#version 300 es
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
uniform float uMacroEnergy;
uniform float uMacroComplexity;
uniform float uMacroMotion;
uniform float uMacroMusicality;
uniform float uMacroAtmosphere;
uniform float uTransitionProgress;
uniform float speed;
uniform float intensity;
uniform float distortion;
uniform float scale;
uniform float brightness;
uniform float hueShift;
uniform float saturation;
out vec4 fragColor;
`,Ha=`
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p) {
  float f = 0.0; float a = 0.5;
  for(int i = 0; i < 5; i++) { f += a*noise(p); p *= 2.01; a *= 0.5; }
  return f;
}
// IQ cosine palette: 3 base colors + palette parameter t ∈ [0,1]
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}
// Short-hue reader used by the complex set (Phase-25): hue rides the
// spectral centroid so every cx-shader stays reactive even on silence.
vec3 pal(float u, float h) {
  u += h + uSpectralCentroid * 0.35;
  return 0.5 + 0.5 * cos(6.28318 * (vec3(1.0, 0.72, 0.4) * u + vec3(0.0, 0.16, 0.24)));
}
`;function i(t,o,a,l,n,e,m=[],s={},u=[],d="medium",p=""){const W=[{id:"speed",label:"Speed",min:0,max:3,default:1,step:.1},{id:"intensity",label:"Intensity",min:0,max:2,default:1,step:.05},{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"scale",label:"Scale",min:.1,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"},{id:"hueShift",label:"Hue Shift",min:0,max:6.28,default:0,step:.05},{id:"saturation",label:"Saturation",min:0,max:2,default:1,step:.05}],v=new Set(m.map(w=>w.id)),c=W.filter(w=>!v.has(w.id)),M={speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1};for(const w of m)M[w.id]=w.default;Object.assign(M,s);const z=La(e),k=Aa(z,p,m),S=_(k.body,M);return{id:t,name:o,category:a,description:l,tags:n,fragment:Na+k.extraUniforms+Ha+S,uniforms:[],params:[...c,...m],defaults:M,audioMappings:[...u],performanceTier:d}}const Va=[i("cx-raymarch-core","Core Breach","fractals","Ray-marched SDF sphere field with fresnel glow, orbited by the beat",["raymarch","sdf","sphere","3d","glow"],`
    float sdS(vec3 q, float r) { return length(q) - r; }
    vec2 mapC(vec3 q) {
      float d0 = sdS(q - vec3(0.0, 0.0, uBeat*0.18), 0.85);
      float d1 = sdS(q - vec3(1.35, 0.4, uBass*0.3), 0.22);
      float d2 = sdS(q - vec3(-1.2, -0.5, 0.2), 0.16);
      return vec2(min(d0, min(d1, d2)), d0);
    }
    vec3 calcN(vec3 q) {
      vec2 e = vec2(0.002, 0.0);
      return normalize(vec3(
        mapC(q + e.xyy).x - mapC(q - e.xyy).x,
        mapC(q + e.yxy).x - mapC(q - e.yxy).x,
        mapC(q + e.yyx).x - mapC(q - e.yyx).x));
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv.x *= uResolution.x / uResolution.y;
      float zoom = 1.1 - 0.25 * uBass + 0.2 * sin(uTime * 0.3 * speed);
      vec3 ro = vec3(0.0, 0.0, -2.6 * zoom);
      vec3 rd = normalize(vec3(uv * 1.8, 1.4));
      float t0 = 0.0;
      float hit = 0.0;
      for (int i = 0; i < 48; i++) {
        vec3 pp = ro + rd * t0;
        float hh = mapC(pp).x;
        if (hh < 0.001) { hit = 1.0; break; }
        t0 += hh * 0.9;
      }
      vec3 col;
      if (hit > 0.5) {
        vec3 pp = ro + rd * t0;
        vec3 n = calcN(pp);
        float dif = max(dot(n, normalize(vec3(0.6, 0.8, 0.4))), 0.0);
        float fres = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);
        col = vec3(0.05, 0.7, 0.9) * (dif * 1.2 + 0.15) + fres * pal(t0 * 0.4, 0.3) * (0.5 + 0.5*uBeat);
      } else {
        col = vec3(0.0, 0.02, 0.05) * t0;
        col += pal(rd.y * 1.5, 0.2) * exp(-t0 * 0.35) * 0.35 * uMid;
      }
      col *= intensity * (0.75 + 0.5*uBeat);
      col = max(col, vec3(0.01));
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"}],"ultra"),i("cx-menger","Menger Fold","fractals","Ray-marched Menger sponge with breathing fold scale on the beat",["menger","raymarch","fold","fractal"],`
    float opRep(vec3 p, vec3 c) {
      vec3 q = p - c * clamp(round(p / c), vec3(-1.0), vec3(1.0));
      return length(q);
    }
    float mapM(vec3 q) {
      vec3 qq = q * (1.6 + 0.25*uBass);
      float s = 1.0;
      for (int i = 0; i < 5; i++) {
        qq = abs(qq);
        qq = vec3(qq.z, qq.x, qq.y);
        qq = abs(qq);
        if (qq.x > 1.0) qq.x = 2.0 - qq.x;
        if (qq.y > 1.0) qq.y = 2.0 - qq.y;
        s *= 2.7;
        qq = qq * 2.7 - 1.7;
      }
      return length(max(abs(qq) - vec3(0.42), vec3(0.0))) / s - 0.03;
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float halfW = uResolution.x / uResolution.y;
      vec3 ro = vec3(0.0, 0.0, -2.6 + uTreble * 0.35);
      vec3 rd = normalize(vec3(uv * vec2(halfW, 1.0) * 1.15, 1.0));
      float t0 = 0.0;
      float hit = 0.0;
      for (int i = 0; i < 40; i++) {
        float hh = mapM(ro + rd * t0);
        if (hh < 0.001) { hit = 1.0; break; }
        t0 += hh;
      }
      vec3 col = pal(t0 * 0.25 + uTime * 0.05 * speed, 0.1) * exp(-t0 * 0.09) * (0.4 + 0.8*uBeat);
      col += vec3(0.02, 0.0, 0.06) * smoothstep(6.0, 10.0, t0);
      col *= intensity * (0.8 + 0.5*uTreble);
      fragColor = vec4(max(col, vec3(0.005)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.6,curve:"log"},{signal:"treble",param:"distortion",amount:.25,curve:"linear"}],"ultra"),i("cx-marble-orb","Marble Orb","abstract","Ray-marched fbm-marbled sphere, camera dolly and marble flow on audio",["raymarch","marble","fbm","sphere"],`
    vec2 mapOrb(vec3 q) {
      return vec2(length(q) - (1.0 + 0.12*uBass), 0.0);
    }
    vec3 calcNORB(vec3 q) {
      vec2 e = vec2(0.004, 0.0);
      return normalize(vec3(
        mapOrb(q + e.xyy).x - mapOrb(q - e.xyy).x,
        mapOrb(q + e.yxy).x - mapOrb(q - e.yxy).x,
        mapOrb(q + e.yyx).x - mapOrb(q - e.yyx).x));
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv.x *= uResolution.x / uResolution.y;
      vec3 ro = vec3(0.0, 0.0, -3.2 + uTreble * 0.4);
      vec3 rd = normalize(vec3(uv * 2.0, 1.5));
      float t0 = 0.0;
      for (int i = 0; i < 40; i++) {
        float hh = mapOrb(ro + rd * t0).x;
        if (hh < 0.001) break;
        t0 += hh * 0.85;
      }
      vec3 pp = ro + rd * t0;
      vec3 n = calcNORB(pp);
      vec3 lightDir = normalize(vec3(0.5, 0.8, -0.4));
      float dif = max(dot(n, lightDir), 0.0);
      float flow = uBass * 1.2 + uTime * 0.12 * speed;
      vec3 qv = n * 3.1 + vec3(flow);
      float qv2 = fbm(qv.xy);
      float marble = qv2 + 0.5 * fbm(qv.xy * 2.0 + flow);
      float vein = smoothstep(0.55, 0.6, marble) + smoothstep(0.7, 0.75, marble);
      vec3 col = pal(marble * 2.0 + uTime * 0.04, 0.15) * (dif * 1.1 + 0.2);
      col += vec3(0.5, 0.4, 0.7) * vein * (0.4 + 0.8*uBeat);
      float fres = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);
      col += pal(n.x * 2.0, 0.4) * fres * (0.4 + 0.5*uMid);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"}],{},[{signal:"mid",param:"distortion",amount:.5,curve:"log"},{signal:"treble",param:"scale",amount:.35,curve:"linear"}],"ultra"),i("cx-kalis-bloom","Kalis Bloom","fractals","Kalis escape-time bloom zooming with the bass",["kalis","escape","bloom"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 kp = uv / (1.3 - 0.5*uBass);
      float acc = 0.0;
      float zoomk = 1.0 + 0.25 * uBass;
      for (int i = 0; i < 9; i++) {
        kp = abs(kp) / max(dot(kp, kp), 0.0004) - zoomk;
        kp += vec2(0.26, 0.0) + uMid * 0.15;
        acc += exp(-length(kp) * 0.75);
      }
      float sc = 1.0 / (0.4 + 0.6 * exp(-length(uv)));
      vec3 col = pal(acc * 0.6 + uTime * 0.03 * speed + uBass, 0.25) * sc * (0.35 + 0.8*uBeat);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.4,curve:"linear"}],"high"),i("cx-truchet-maze","Truchet Maze","geometric","Truchet-tiled maze lines flowing to the audio spectrum",["truchet","tiles","maze"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 g = floor(uv * 8.0);
      vec2 f = fract(uv * 8.0) - 0.5;
      float v = hash(g + floor(uTime * (0.4 + 0.6*uBeat)));
      vec2 fw = step(0.5, v) == 1.0 ? vec2(f.y, f.x) : f;
      float d = min(abs(fw.x - fw.y), 0.7 - abs(fw.x + fw.y));
      float line = exp(-abs(d) * 16.0);
      line += exp(-abs(fw.x - 0.0) * 30.0) * 0.3;
      vec3 col = pal(length(g) * 0.13 + uBass * 0.6 + uTime * 0.04, 0.4) * line * (0.7 + 0.6*uBeat);
      col *= intensity * brightness;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("cx-voronoi-vortex","Voronoi Vortex","geometric","Worley cell field wrapped into a rotating vortex",["voronoi","worley","vortex"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float a = atan(uv.y, uv.x);
      float r = length(uv);
      float swirl = a + uTime * 0.3 * speed * (0.7 + 0.6*uBeat);
      vec2 pv = vec2(cos(swirl), sin(swirl)) * r * 4.0;
      vec2 id = floor(pv); vec2 fr = fract(pv) - 0.5;
      float m = 1.0; vec2 mc = vec2(0.0);
      for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
          vec2 off = vec2(float(i), float(j));
          vec2 gw = id + off;
          vec2 rz = off + vec2(hash(gw), hash(gw + vec2(7.3, 1.9))) - fr;
          float d2 = dot(rz, rz);
          if (d2 < m) { m = d2; mc = gw; }
        }
      }
      float cell = smoothstep(0.35, 0.0, sqrt(m));
      vec3 col = pal(length(mc) * 0.4 + uBass * 0.5 + uTime * 0.05, 0.2) * (cell * 0.8 + 0.2);
      col *= (0.6 + 0.5 * exp(-r * 3.0));
      col *= intensity * (0.7 + 0.5*uBeat);
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.6,curve:"log"},{signal:"mid",param:"hueShift",amount:.3,curve:"linear"}],"medium"),i("cx-gyroid-sea","Gyroid Sea","abstract","Animated gyroid lattice sheets surging with the sub bass",["gyroid","lattice","isosurface"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 gp = uv * 5.0 * (1.0 + 0.3*uSub);
      float gt = uTime * 0.35 * speed;
      float gy = sin(gp.x + uBass * 2.0) * cos(gp.y - gt) +
                 sin(gp.y - gt * 0.7) * cos((gp.x + gp.y) * 0.7 + uMid * 2.0) +
                 sin((gp.x + gp.y) * 0.7) * cos(gp.x + gt * 0.5);
      float w = exp(-abs(gy) * 5.0) * (0.3 + 0.8*uSub);
      float w2 = exp(-abs(gy - 0.35) * 8.0) * 0.25 * uTreble;
      vec3 col = pal(gy * 0.5 + length(gp) * 0.2 + uTime * 0.05, 0.5) * (w + w2);
      col *= intensity * (0.6 + 0.7*uBeat);
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"}],{},[{signal:"sub",param:"distortion",amount:.7,curve:"log"},{signal:"mid",param:"intensity",amount:.4,curve:"linear"}],"medium"),i("cx-lyapunov-bands","Chaos Bands","fractals","Lyapunov exponent field mapped to colored chaos bands",["lyapunov","chaos","logistic"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 cg = floor(uv * 12.0);
      vec2 cf = fract(uv * 12.0);
      float x = 0.5 + 0.35 * sin(uTime * 0.4 * speed + uBass * 2.0);
      float rA = 2.8 + 1.3 * uBass;
      float rB = 3.4 + 1.1 * uMid;
      float ls = 0.0;
      for (int i = 0; i < 14; i++) {
        float rr2 = mod(float(i), 2.0) < 1.0 ? rA : rB;
        x = rr2 * x * (1.0 - x);
        ls += log(max(abs(rr2 * (1.0 - 2.0 * x)), 0.0001));
      }
      float lyap = ls / 14.0;
      vec3 col = pal(lyap * 6.0 + cf.x + cf.y + uTime * 0.05, 0.1) *
                 (0.3 + 0.7 * smoothstep(0.1, 0.9, lyap));
      col *= intensity * (0.6 + 0.6*uBeat);
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"mid",param:"distortion",amount:.5,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"high"),i("cx-scope-kaleido","Scope Kaleido","synthwave","Polar-folded oscilloscope kaleidoscope with spectral sweep",["oscilloscope","kaleidoscope","spectrum"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float a = atan(uv.y, uv.x);
      float r = length(uv);
      float segs = 8.0;
      float fold = 6.28318 / segs;
      float sa = mod(a, fold) - 0.5 * fold;
      vec2 fp = r * vec2(cos(sa) + uTreble * 0.3, sin(sa));
      float wv = sin(fp.x * 7.0 - uTime * 2.0 * speed) * 0.5 +
                 sin(fp.x * 5.0 + uTime * 3.0 + uMid * 2.0) * 0.3 +
                 uTreble * 0.7 * sin(fp.x * 9.0 + uTime * 4.0);
      float wl = exp(-abs(fp.y - wv) * 15.0);
      float wedge = exp(-abs(r - 0.6 - uBass * 0.25) * 24.0);
      vec3 col = pal(fp.x * 2.0 + wv + r + uTime * 0.1, 0.6) * wl * (0.4 + 0.8*uTreble);
      col += pal(a / 6.28318 + r * 1.5, 0.2) * wedge * (0.3 + 0.7*uBeat);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"}],{},[{signal:"treble",param:"distortion",amount:.6,curve:"log"},{signal:"mid",param:"hueShift",amount:.35,curve:"linear"}],"high"),i("cx-crystal-cage","Crystal Cage","geometric","Rotating 3D lattice cage crystal, facets flash on the beat",["lattice","crystal","cage"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv.x *= uResolution.x / uResolution.y;
      float ca = uTime * 0.4 * speed + uBeatPhase * 0.7;
      vec2 rp = vec2(cos(ca), sin(ca));
      vec2 qx = abs(vec2(dot(uv, vec2(0.5, 0.866)), dot(uv, vec2(0.5, -0.866))));
      qx = vec2(rp.x * qx.x - rp.y * qx.y, rp.x * qx.y + rp.y * qx.x) * 1.3;
      float m = 1.0;
      vec2 fq = fract(qx * 4.0) - 0.5;
      float edge = exp(-abs(abs(fq.x) - 0.42) * 22.0) + exp(-abs(abs(fq.y) - 0.42) * 22.0);
      vec2 id = floor(qx * 4.0);
      float rnd = hash(id + floor(uTime * 2.0));
      float facet = step(0.55, rnd) * (0.4 + 0.8*uBeat);
      m = exp(-(abs(uv.x) + abs(uv.y)) * 1.4);
      vec3 col = pal(distance(id, vec2(0.0)) * 0.2 + uBass * 0.5, 0.3) * (edge + facet) * m;
      col *= intensity * (0.7 + 0.5*uTreble);
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"beat",param:"intensity",amount:.5,curve:"linear"}],"high"),i("cx-aurora-veil","Aurora Veil","cosmic","Domain-warpped flowing aurora curtains billowing on the treble",["aurora","domain-warp","curtains"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 q = uv * vec2(1.6, 1.0);
      float tA = uTime * 0.6 * speed;
      float qw = 0.4 * (0.5 + 0.6 * sin(tA + q.x * 0.6)) * (1.0 + 0.6*uTreble);
      vec2 rp = vec2(fbm(q + vec2(tA, 0.0)) - 0.5, fbm(q + vec2(0.0, tA)) - 0.5);
      rp *= 0.6 + 0.8 * uMid;
      float band = fbm(q * (1.0 + 0.5 * distance(uv, vec2(0.0))) + rp * qw - vec2(0.0, tA * 0.8));
      float curtain = smoothstep(0.62, 0.58, band) * (1.0 - 0.4 * distance(uv, vec2(0.0, -0.3)));
      vec3 col = pal(band * 3.0 + uBass, 0.7) * curtain * (0.5 + 0.7*uTreble);
      col += vec3(0.02, 0.05, 0.1) * (1.0 - curtain) * (0.4 + 0.4*uBeat);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"treble",param:"distortion",amount:.6,curve:"log"},{signal:"mid",param:"scale",amount:.35,curve:"linear"}],"high"),i("cx-nebula-heart","Nebula Heart","cosmic","Layered fbm nebula with a pulsing stellar core",["nebula","fbm","core","glow"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float r = length(uv * vec2(1.6, 1.0));
      float tN = uTime * 0.3 * speed;
      vec2 q = uv * vec2(1.6, 1.0) * (1.0 + 0.5 * sin(tN * 0.7 + uBass * 3.0));
      float neb = fbm(q * 1.6 + vec2(0.0, tN * 0.5)) +
                  0.4 * fbm(q * 3.2 - vec2(tN * 0.8, 0.0));
      float core = exp(-r * r * 3.0) * (0.45 + 0.55 * uBeat);
      float dust = smoothstep(1.1, 0.15, r * (1.0 - neb * 0.45));
      vec3 col = pal(neb * 2.5 + uBass, 0.45) * dust * (0.35 + 0.6*uMid);
      col += vec3(0.9, 0.7, 1.0) * core * (0.5 + 0.5*uTreble);
      col += pal(neb, 0.8) * core * 0.6;
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"}],{},[{signal:"mid",param:"distortion",amount:.5,curve:"log"},{signal:"beat",param:"intensity",amount:.5,curve:"linear"}],"high"),i("cx-eclipse-breach","Eclipse Breach","cosmic","Concentric eclipse rings breached by bass-driven particles",["eclipse","rings","corona"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float a = atan(uv.y, uv.x);
      float r = length(uv);
      float rr = r - 0.28 - 0.05 * sin(uTime * 2.0 * speed + uBass * 3.0);
      float disc = exp(-abs(rr) * 60.0);
      float breach = exp(-abs(abs(rr) - 0.03) * 40.0);
      vec2 sid = floor(uv * 18.0);
      float rnd = hash(sid);
      float life = fract(uTime * (0.3 + 0.4*uBeat) + rnd * 3.0);
      float part = exp(-length(fract(uv * 3.6) - 0.5) * 4.0) * step(0.86, rnd) * (0.3 + 0.8*uBeat);
      vec3 col = pal(a + uBass * 0.8 + uTime * 0.05, 0.3) * (disc + breach * 0.8 + part);
      col *= smoothstep(1.4, 0.2, r);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.7,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"high"),i("cx-mandel-waves","Mandel Waves","fractals","Mandelbrot-lite waves with bass-driven zoom and coloring",["mandelbrot","zoom","classic"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float zoom = 1.0 + uTime * 0.12 * speed + uBass * 0.35;
      vec2 c = uv / zoom + vec2(-0.726, 0.19) + uMid * 0.06;
      vec2 z = vec2(0.0);
      float iter = 0.0;
      for (int i = 0; i < 96; i++) {
        if (dot(z, z) > 4.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iter += 1.0;
      }
      float t = iter / 96.0;
      vec3 col = 0.5 + 0.5 * cos(6.28318 * (t * 2.5 + uTime * 0.15 * speed + vec3(0.0, 0.33, 0.67) + uBass * 0.6));
      col *= intensity * (0.7 + 0.5*uBeat);
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"}],{},[{signal:"mid",param:"distortion",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"high"),i("cx-star-warp","Star Warp","cosmic","Warped starfield streaking by on the tempo, bass-breathed",["starfield","warp","speed"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv.x *= uResolution.x / uResolution.y;
      vec2 p = uv * vec2(1.0, 1.0) + vec2(0.0, uTime * 0.1 * speed);
      vec2 id = floor(p * 14.0);
      vec2 fr = fract(p * 14.0) - 0.5;
      float rnd = hash(id);
      float layer = step(0.7, rnd);
      float spd = (0.35 + rnd * 0.6) * (1.0 + 0.5*uBeat);
      float travel = fract(uTime * spd * (0.3 + 0.5*uBass) + rnd * 10.0);
      vec2 dir = normalize(fr + 0.0001);
      float dd = length(fr - dir * travel * 0.7);
      float star = exp(-dd * dd * 60.0) * layer * (0.4 + 0.8*uBeat);
      float streak = exp(-abs(fr.y - travel * 0.7) * 26.0) * step(0.6, rnd) * 0.3;
      vec3 col = pal(rnd + uTime * 0.1 + uTreble, 0.1) * (star + streak) * (0.5 + 0.6*uMid);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"}],{},[{signal:"mid",param:"distortion",amount:.5,curve:"log"},{signal:"beat",param:"intensity",amount:.5,curve:"linear"}],"medium"),i("cx-grid-city","Grid City","synthwave","Outrun grid city rolling on the beat, sun flashing to the kick",["synthwave","retro","grid"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float horizon = 0.14;
      float y = uv.y - horizon;
      float proj = 1.0 / max(y + 0.35, 0.01);
      vec2 g = vec2((uv.x * proj * 1.4) * 3.0, (proj) * 0.9);
      float gp = fract(g.x) - 0.5;
      float gz = fract(g.y) - 0.5;
      vec3 line = vec3(0.0);
      float r = smoothstep(0.05, 0.0, abs(gp)) + smoothstep(0.05, 0.0, abs(gz));
      line += vec3(1.0, 0.2, 0.8) * r * exp(-y * 6.0) * (0.4 + 0.7*uBeat);
      float sun = exp(-abs(length(uv - vec2(0.0, 0.42)) - 0.16) * 60.0) * (0.5 + 0.6*uBeat);
      float street = exp(-abs(uv.x) * 9.0) * exp(-abs(uv.y - horizon) * 3.0) * uSub;
      vec3 col = vec3(0.15, 0.0, 0.3);
      col += line * (0.6 + 0.5*uMid);
      col += vec3(1.0, 0.5, 0.2) * sun + vec3(0.8, 0.3, 1.0) * street;
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.01)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"}],{},[{signal:"sub",param:"distortion",amount:.6,curve:"log"},{signal:"beat",param:"intensity",amount:.6,curve:"linear"}],"medium"),i("cx-spectral-tunnel","Spectral Tunnel","abstract","Color-wheel tunnel with spectral banding and bass funnel",["tunnel","spectral","funnel"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float a = atan(uv.y, uv.x);
      float r = length(uv);
      float funnel = 1.0 / (r + 0.04) * (0.8 + 0.5*uBass);
      float dst = funnel + uTime * 1.2 * speed;
      float band = sin(a * 4.0 + dst * 1.2) * 0.5 + 0.5;
      float ring = exp(-abs(fract(dst * 0.6 + noise(vec2(a, dst) * 1.4 + uTime * 0.3)) - 0.5) * 12.0);
      vec3 col = pal(a / 6.28318 + dst * 0.3 + uBass, 0.4) * (ring * (0.35 + 0.7*uBeat) + band * 0.12);
      col *= 1.0 - r * 1.6;
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.7,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"high"),i("cx-reactive-blob","Reactive Blob","liquid","Metaball-ready energy blob deformed by spectral flux",["blob","metaball","liquid"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv.x *= uResolution.x / uResolution.y;
      float tB = uTime * 0.7 * speed;
      vec2 center = vec2(0.0);
      float flux = uMid * 0.6 + uBeat * 0.25;
      vec2 warp = vec2(noise(vec2(center.x + tB, flux)), noise(vec2(flux, center.y + tB * 0.7))) - 0.5;
      float rad = 0.55 + 0.2 * uBass + 0.18 * flux;
      float orbit = uBeatPhase * 6.28318;
      vec2 b1 = vec2(0.3 * cos(orbit), 0.3 * sin(orbit * 1.3)) * warp * 0.4;
      float d1 = length(uv - b1);
      vec2 b2 = vec2(-0.3 * cos(orbit * 0.7), -0.25 * sin(orbit)) * warp * 0.4;
      float d2 = length(uv - b2);
      vec2 b3 = vec2(0.15 * sin(orbit), -0.18 * cos(orbit * 1.7)) * 0.4;
      float d3 = length(uv - b3);
      float blob = exp(-d1 * d1 * 4.0) + exp(-d2 * d2 * 4.0) + exp(-d3 * d3 * 4.0);
      float sh = smoothstep(0.62, 0.55, blob) * (0.5 + 0.5 * flux);
      float inner = smoothstep(0.95, 1.15, blob);
      vec3 col = pal(atan(uv.y, uv.x) / 6.28318 + rad * 0.5 + uTreble, 0.6) * sh;
      col += vec3(0.8, 0.9, 1.0) * inner * (0.4 + 0.8*uBeat);
      col *= intensity;
      fragColor = vec4(max(col, vec3(0.004)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"}],{},[{signal:"mid",param:"distortion",amount:.5,curve:"log"},{signal:"bass",param:"scale",amount:.4,curve:"log"}],"high")],E=["Astral","Liquid","Solar","Chromatic","Acid","Primal","Morphic","Nebular","Electric","Quantum","Hypnotic","Luminous","Spectral","Crystal","Iridescent","Pulsar","Mirage","Tidal","Kaleidoscopic","Mercurial"],I=["Lotus","Bloom","Veil","Maze","Ocean","Garden","Storm","Cascade","Waltz","Current","Nova","Whirl","Mantra","Serpent","Haze","Oracle","Mirror","Pulse","Vortex","Ember","Thrum","Lattice","Lava","Fracture","Cosmos","Reed"],Ua=["Warp","Kaleido","Spiral","Tunnel","Starfold","Mirror","Orbit","Breathe"],Xa=["Plasma","Mandala","Rosette","Arms","Rings","Interference","Caustic","Maze","Spiro","Bloom","Lattice","Cells","Vortex","Aura"],L=["bass","mid","treb","vol","sub","beat"],Ka=t=>t==="treb"?"treble":t==="vol"?"volume":t==="sub"?"mid":t,B=[["p+=vec2(fbm(p*2.0+t*0.3),fbm(p*2.0-t*0.3+9.0))*distortion*0.4;"],["float ka=atan(p.y,p.x);float kr=length(p);float kf=(6.28318)/PARAM;ka=mod(ka,kf);ka=min(ka,kf-ka);p=vec2(cos(ka),sin(ka))*kr;"],["float sa2=atan(p.y,p.x)+0.5*log(length(p)+0.02)+t*(0.2+${s}*0.2);p=length(p)*vec2(cos(sa2),sin(sa2));"],["float tr=1.0/(length(p)+0.04);p*=tr*(0.8+0.6*bass);"],["float sang=atan(p.y,p.x);p/=max(0.2,abs(cos(0.5*PARAM*sang)));"],["p=abs(fract(p*PARAM)-0.5)+fbm(p*1.5+t*0.1)*distortion*0.2;"],["p+=vec2(noise(p*4.0+t*0.3),noise(p*4.0-t*0.3));p*=1.0+0.25*sin(t*0.5+${s}*3.0);"],["p*=1.0+0.3*sin(t*0.7+bass*2.0+${s});"]],O=[["float v=sin(p.x*PARAM+t)+sin(p.y*1.1*PARAM-t*1.2)+fbm(p*2.5+t*0.25)+${s}*2.0+bass*0.9;"],["float a=atan(p.y,p.x);float rr=length(p);","float raysP=0.5+0.5*sin(a*PARAM+t*2.0);","float ringsP=pow(max(0.0,sin(rr*7.0-t*3.0+${s}*4.0)),3.0);","float v=raysP*ringsP*1.2+${s}*0.8;"],["float a=atan(p.y,p.x);float rr=length(p);","float ro=0.5+0.4*cos(a*PARAM*0.5+t*1.5)+${s}*0.1;","float v=exp(-abs(rr-ro)*24.0)+0.4*pow(max(0.0,sin(rr*11.0-t*2.0)),2.0);"],["float a=atan(p.y,p.x);float rr=length(p);","float spA=mod(a/6.28318*PARAM-log(rr+0.05)*1.6+t*0.6+${s}*0.5,1.0);","float v=smoothstep(0.3,0.0,abs(fract(spA*PARAM)-0.5));"],["float rr=length(p)*(0.6+0.5*bass+${s}*0.2);","float ringT=exp(-abs(fract(rr*PARAM)-0.5)*7.0);","float v=ringT*(0.4+0.7*beat);"],["float v=sin(length(p)*PARAM*2.0-t*2.0)+sin(atan(p.y,p.x)*PARAM+t*1.5)+sin(length(p)*PARAM+${s}*1.5);"],["float v=fbm(p*PARAM+t*0.2+${s}*0.4+seed*0.01);"],["vec2 gm=floor(p*PARAM);","vec2 fm=fract(p*PARAM)-0.5;","float vm=hash(gm+floor(t*(0.3+${s})));","vec2 fw=step(0.5,vm)==1.0?vec2(fm.y,fm.x):fm;","float v=exp(-abs(abs(fw.x)-abs(fw.y))*14.0);"],["float v=0.5+0.5*sin(6.0*atan(p.y,p.x)+${s}*sin(length(p)*PARAM+t)*0.5-t*2.0);"],["float a=atan(p.y,p.x);float rr=length(p);","float v=exp(-rr*(0.9+0.6*treb))+0.3*sin(a*PARAM-t*3.0)*exp(-rr*2.5);"],["float gg=fbm(p*PARAM+t*0.2+seed*0.01);","float v=0.5+0.5*sin(p.x*PARAM*3.1415+gg*${s}*4.0+t*2.0);"],["vec2 iv=floor(p*PARAM);","vec2 fr=fract(p*PARAM)-0.5;","float m=1.0;","for(int i=-1;i<=1;i++){","  for(int j=-1;j<=1;j++){","    vec2 of=vec2(float(i),float(j));","    vec2 gw=iv+of;","    vec2 rw=of+vec2(hash(gw),hash(gw+vec2(7.1,3.7)))-fr;","    float dd=dot(rw,rw);","    m=min(m,dd);","  }","}","float v=smoothstep(0.5,0.0,sqrt(m))*(0.5+0.5*sin(t*2.0+${s}*2.0));"],["float v=0.5+0.5*sin(length(p)*PARAM-atan(p.y,p.x)*2.0+t*${s}*4.0+seed*0.01);"],["float rr=length(p);","float wav=0.5+0.5*sin(rr*8.0-t*(1.0+0.5*bass)+${s}*2.0);","float v=wav*exp(-rr*1.6)*(0.5+0.6*bass)+exp(-abs(rr-0.45-0.15*bass)*20.0)*(0.3+0.8*beat);"]],N=["pal(v*0.8+${h}+${s}*0.4, ${h})*(0.5+0.8*bass)+pal2(v, ${h})*${s}*0.3","pal(v+${h}+cnt*0.5, ${h})*(0.5+0.5*vol)+pal(v*1.5+${h}+0.3, ${h})*0.25*beat","pal(v*1.2+${h}+t*0.03, ${h})*(0.4+0.6*vol)+pal2(v*0.8+${s}, ${h})*0.35*treb","pal(v+${h}+t*0.04, ${h})*(0.55+0.55*beat)+pal(${s}*0.5+v*0.3+${h}, ${h})*${s}*0.35","pal(v*0.6+${h}, ${h})*(0.6+0.7*bass)*clamp(v,0.05,1.4)+pal2(v*1.5+${s}, ${h})*0.5*sub"],Ya=["freq","petals","petals","arms","rings","freq","freq","cells","freq","petals","freq","cells","petals","rings"],Ja=new Set([1,4,5]),Qa={sides:{min:3,max:12,label:"Sides"},petals:{min:3,max:18,label:"Petals"},arms:{min:2,max:12,label:"Arms"},rings:{min:2,max:14,label:"Rings"},freq:{min:2,max:12,label:"Frequency"},cells:{min:2,max:12,label:"Cells"}},H=205,ae=3;function ee(){const t=[];for(let o=0;o<H;o++){const a=o%B.length,l=Math.floor(o/B.length)%O.length,n=Math.floor(o/(B.length*O.length))%N.length,e=E[Math.floor(o/I.length)%E.length]+" "+I[o%I.length],m=e.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""),s=o<H-1?ae:1;for(let u=0;u<s;u++){const d=g[(o*5+u*7)%g.length],p=L[(o*3+u*9)%L.length],W=Ja.has(a)?"sides":Ya[l],v=3+(o*3+u*2)%12,c=Qa[W],z=[`float seed=${x(t.length+1)};`,...B[a].map(S=>S.replace(/PARAM/g,W).replace(/\$\{s\}/g,p)),...O[l].map(S=>S.replace(/PARAM/g,W).replace(/\$\{s\}/g,p))],k=N[n].replace(/\$\{s\}/g,p).replace(/\$\{h\}/g,d);t.push(f(`psy-${m}-${u+1}`,e,"psychedelic",`Psychedelic '${e}' — ${Xa[l]} in a ${Ua[a]} domain, driven by ${p}`,b(z,k),[{id:W,label:c.label,min:c.min,max:c.max,def:v,step:1,group:"shape"}],{audio:[{signal:Ka(p),param:"distortion",amount:.5,curve:"log"}],tier:t.length%2===0?"medium":"high"}))}}return t}const ie=ee(),te=[i("hero-plasma-flow","Plasma Flow","abstract","Warped fbm plasma with treble-driven sparkle veins and a cosine-palette wash",["hero","plasma","warp","flow","fbm"],`
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:domainWarp}}
    {{chunk:palette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y) * 1.4;
      vec2 p = warp(uv, uTime * 0.12 * speed) + uBass * 0.6 * vec2(sin(uv.y * 3.0), cos(uv.x * 3.0));
      float f = fbm5(p * 2.0 + uBeat * 0.1) + uBass * 0.35;
      vec3 col = iqp(f + uTime * 0.05 * speed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
      col *= brightness * intensity * (1.0 + 0.25 * beatFlash(3.0));
      col = mix(col, vec3(1.0), f * f * sparkle);
      fragColor = vec4(col, 1.0);
    }
    `,[{id:"sparkle",label:"Sparkle Veins",min:0,max:1,default:0,step:.05}],{sparkle:0},[{signal:"treble",param:"sparkle",amount:.8,curve:"linear"}],"medium",`uniform float sparkle;
`),i("hero-vorton","Vorton","abstract","Organic voronoi lattice riding a flow field, with bass-driven cell growth",["hero","voronoi","lattice","flow-field"],`
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:flowField}}
    {{chunk:voronoi}}
    {{chunk:palette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 p = uv * cells + 0.15 * flow(uv, uTime * 0.1 * speed);
      vec2 v = voronoi(p);
      float cell = 1.0 - smoothstep(0.35, 0.6, v.x);
      float edge = smoothstep(0.18, 0.0, abs(v.x - 0.55) - 0.02);
      vec3 col = iqp(v.y + uTime * 0.06 * speed + uBass * 0.8, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.25, 0.45, 0.6));
      col = mix(col, vec3(1.0), edge * (0.6 + uTreble * 0.6));
      col *= cell * intensity * brightness;
      float ring = abs(length(uv) - 0.55 - 0.35 * uBeat * intensity);
      col += vec3(0.3, 0.5, 1.0) * smoothstep(0.03, 0.0, ring) * beatFlash(2.0);
      fragColor = vec4(col, 1.0);
    }
    `,[{id:"cells",label:"Cells",min:2,max:12,default:6,step:.5}],{cells:6},[{signal:"bass",param:"cells",amount:2,curve:"log"}],"medium",`uniform float cells;
`),i("hero-ripple-grid","Ripple Grid","geometric","Mirror-tiled ripples radiating over a faint grid, beat-pulsed ring",["hero","ripple","grid","radial","minimal"],`
    {{chunk:tile}}
    {{chunk:rotor}}
    {{chunk:gridLines}}
    {{chunk:palette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 p = mirrorTile(uv * rot2(uTime * 0.05 * speed), 4.0 + rippleCount);
      float d = length(p);
      float wave = sin(d * 14.0 - uTime * 3.0 * speed + uBass * 6.0) * 0.5 + 0.5;
      vec2 g = uv * 9.0;
      float grid = gridLine(g, 1.0, 0.03);
      vec3 col = iqp(d + uTime * 0.1 * speed + wave * 0.6, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.2, 0.4));
      col = mix(col, vec3(1.0), grid * 0.85);
      col *= (0.25 + wave * 0.75) * intensity * brightness;
      col += vec3(0.6, 0.85, 1.0) * smoothstep(0.05, 0.0, abs(length(uv) - 0.42 - 0.28 * uBeat)) * beatFlash(2.0);
      fragColor = vec4(col, 1.0);
    }
    `,[{id:"rippleCount",label:"Ripples",min:0,max:6,default:3,step:1}],{rippleCount:3},[],"medium",`uniform float rippleCount;
`),i("hero-spectrum-tower","Spectrum Tower","vj","Rotating 5-band spectrum columns ringing a central gridstone",["hero","spectrum","vj","bass-bars"],`
    {{chunk:rotor}}
    {{chunk:bassBar}}
    {{chunk:gridLines}}
    {{chunk:vignette}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y) * 2.0;
      vec3 col = vec3(0.0);
      mat2 r = rot2(uTime * 0.2 * speed);
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float lvl = fi < 1.5 ? uBass * (1.3 + 0.5*sin(uTime*3.0))
                  : fi < 3.5 ? uMid * (1.1 + 0.4*sin(uTime*5.0))
                  : uTreble * 0.9;
        vec2 q = uv * r;
        col += vec3(0.35 + 0.65*fi/5.0, 0.2, 0.9 - 0.6*fi/5.0) * bassBar(q + vec2((fi-2.0)*0.42, 0.0), lvl, 0.12);
      }
      col += vec3(0.4, 0.4, 0.45) * gridLine(uv, 6.0, 0.04) * 0.5;
      col *= intensity * brightness;
      col *= vig(uv * 0.9);
      fragColor = vec4(col, 1.0);
    }
    `,[],{},[],"medium",""),i("hero-nebula","Nebula","cosmic","Deep warped-fbm nebula in magenta false-colour, bright patch pulse on beats",["hero","nebula","cosmic","fbm"],`
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:domainWarp}}
    {{chunk:palette}}
    {{chunk:beatFlash}}
    {{chunk:vignette}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 p = warp(uv * 1.7 + vec2(3.1, 8.7), uTime * 0.1 * speed);
      float n = fbm5(p + vec2(0.0, uTime * 0.03 * speed));
      float m = fbm5(p * 2.3 - 4.2 + vec2(0.1 * uBass, 0.0));
      vec3 col = iqp(n * 1.4 - m * 0.8 + uBass * 1.2, vec3(0.45, 0.25, 0.6), vec3(0.5), vec3(1.0, 1.2, 1.6), vec3(0.0, 0.33, 0.67));
      col = mix(col, vec3(1.0), smoothstep(0.78, 1.0, n) * 0.9);
      col *= 0.7 + 0.5 * beatFlash(3.0);
      col *= vig(uv) * intensity * brightness * 1.2;
      fragColor = vec4(col, 1.0);
    }
    `,[],{},[],"high",""),i("hero-lattice","Lattice","geometric","Living mirrored lattice of glowing cores with a breathe ring on the beat",["hero","lattice","geometric","core"],`
    {{chunk:tile}}
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:flowField}}
    {{chunk:palette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y) * 2.0;
      vec2 p = mirrorTile(uv, lattice) + 0.12 * flow(uv, uTime * 0.08 * speed);
      float d = length(p);
      float core = 1.0 - smoothstep(0.05, 0.32, d);
      float link = smoothstep(0.36, 0.22, d);
      vec3 col = iqp(d * 3.0 + uTime * 0.12 * speed + uBass * 1.5, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.1, 0.3, 0.55));
      col = mix(col, vec3(1.0), link * 0.6);
      col *= (0.35 + core) * intensity * brightness;
      col += vec3(0.5, 0.8, 1.0) * smoothstep(0.06, 0.0, abs(d - 0.24 - 0.1 * uBeat * intensity * 2.0)) * beatFlash(1.5);
      fragColor = vec4(col, 1.0);
    }
    `,[{id:"lattice",label:"Lattice",min:2,max:10,default:5,step:1}],{lattice:5},[{signal:"volume",param:"lattice",amount:2,curve:"log"}],"medium",`uniform float lattice;
`),i("hero-aurora-drift","Aurora Drift","cosmic","Two drifting aurora sheets, cyan-green and violet, on a warped fbm field",["hero","aurora","cosmic","curtain"],`
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:domainWarp}}
    {{chunk:vignette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv.x *= (uResolution.x / uResolution.y);
      vec2 p = warp(uv * vec2(2.6, 1.0), uTime * 0.1 * speed);
      p.x += uTime * 0.05 * speed;
      float a = smoothstep(0.9, 0.15, abs(p.y - 0.55 * sin(p.x * 2.0 + uTime * 0.3 * speed + uBass * 2.0)));
      float b = smoothstep(0.95, 0.3, abs(p.y - 0.25 * sin(p.x * 1.6 - uTime * 0.2 * speed)));
      float n = fbm5(warp(p * 2.4, uTime * 0.06 * speed));
      vec3 col = mix(vec3(0.1, 0.5, 0.9), vec3(0.2, 1.0, 0.7), n) * a;
      col += vec3(0.8, 0.25, 1.0) * b * 0.7;
      col *= intensity * brightness * (0.6 + uVolume * 0.5) * vig(uv * 1.3);
      col += vec3(1.0) * beatFlash(4.0) * 0.25;
      fragColor = vec4(col, 1.0);
    }
    `,[],{},[],"high",""),i("hero-mandala-bloom","Mandala Bloom","fractals","Rotating polar-mirror mandala carved by fbm, petals breathing on the bass",["hero","mandala","fractal","rotational"],`
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:rotor}}
    {{chunk:mandala}}
    {{chunk:palette}}
    {{chunk:gridLines}}
    {{chunk:vignette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      uv *= rot2(uTime * 0.05 * speed + uBass * 0.4);
      vec2 rp = polarMirror(uv, int(petals));
      float r = rp.x;
      float t = rp.y;
      float scale = 1.0 / (r * petals * (0.55 + 0.2 * sin(t * 6.28318 * 2.0)) + 0.35 + uBass * 0.6);
      float g = fbm5(vec2(scale * 0.5, t * petals * 2.0 - uTime * 0.15 * speed));
      float ring = gridLine(vec2(r * 18.0, 0.0), 3.0, 0.03);
      vec3 col = iqp(g + uTime * 0.04 * speed + uBass * 0.7, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.15, 0.4, 0.62));
      col *= (0.4 + ring * 0.6) * intensity * brightness * smoothstep(0.0, 0.6, r);
      col *= vig(uv);
      col += vec3(1.0) * beatFlash(3.0) * 0.3;
      fragColor = vec4(col, 1.0);
    }
    `,[{id:"petals",label:"Petals",min:3,max:20,default:8,step:1}],{petals:8},[{signal:"bass",param:"petals",amount:2,curve:"log"}],"high",`uniform float petals;
`),i("hero-warp-speed","Warp Speed","vj","Hyperspace tunnel with beat-boosted velocity scaling and warm centre bloom",["hero","tunnel","warp","vj","hyperspace"],`
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:rotor}}
    {{chunk:palette}}
    {{chunk:vignette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 uvx = uv * rot2(uTime * 0.04 * speed + uBass * 0.5);
      float r = length(uvx);
      float ang = atan(uvx.y, uvx.x);
      float tunnel = 0.16 / (r + 0.05);
      float boost = 1.0 + uBeat * 0.8 * intensity;
      vec2 p = vec2(ang * 3.0, tunnel * (0.5 + 0.5 * uBass)) + uTime * 0.5 * speed * boost;
      float n = fbm5(p * 1.4);
      vec3 col = iqp(n * 2.0 - tunnel * 0.5 + uTreble * 0.6, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.33, 0.67));
      col *= intensity * brightness * (0.5 + 1.2 * exp(-r * 4.0));
      col *= vig(uv);
      col += vec3(1.0, 0.9, 0.8) * smoothstep(0.0, 0.32, r) * beatFlash(2.0);
      fragColor = vec4(col, 1.0);
    }
    `,[],{},[],"medium",""),i("hero-cosmic-web","Cosmic Web","abstract","Voronoi filament web glowing in deep blue, treble brightening the edges",["hero","voronoi","web","filaments","dark"],`
    {{chunk:noise}}
    {{chunk:fbm}}
    {{chunk:flowField}}
    {{chunk:voronoi}}
    {{chunk:palette}}
    {{chunk:vignette}}
    {{chunk:beatFlash}}
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 p = uv * webSize + 0.12 * flow(uv, uTime * 0.08 * speed) + vec2(uBass * 1.4, 0.0);
      vec2 v = voronoi(p);
      float edge = smoothstep(0.12, 0.0, abs(v.x - 0.5) - 0.045);
      float glow = exp(-v.x * 2.6) * 0.9;
      float n = fbm5(p * 1.6 + vec2(7.2, 3.4));
      vec3 col = iqp(v.y * 2.0 + n * 0.8 + uTime * 0.04 * speed + uBass * 0.5, vec3(0.08), vec3(0.5), vec3(1.0), vec3(0.35, 0.55, 0.7));
      col = mix(col, vec3(0.9, 0.95, 1.0), edge * (0.5 + uTreble * 0.8));
      col *= (0.15 + glow) * intensity * brightness;
      col *= vig(uv * 1.15);
      col += vec3(0.7, 0.9, 1.0) * beatFlash(3.0) * edge * 0.8;
      fragColor = vec4(col, 1.0);
    }
    `,[{id:"webSize",label:"Web Size",min:1,max:6,default:2,step:.5}],{webSize:2},[{signal:"volume",param:"webSize",amount:2,curve:"log"}],"medium",`uniform float webSize;
`)],oe=[...te,...Va,...Ga,...Za,...ie,i("fractal-mandelbrot","Mandelbrot Voyage","fractals","Infinite zoom through the Mandelbrot set with audio-reactive color cycling",["fractal","mandelbrot","zoom","classic"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float zoom = 1.0 + uTime * 0.1 * speed + uBass * 0.3;
      vec2 c = uv / zoom + vec2(-0.745, 0.186);
      vec2 z = vec2(0.0);
      float iter = 0.0;
      for(int i = 0; i < 128; i++) {
        if(dot(z,z) > 4.0) break;
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        iter += 1.0;
      }
      float t = iter/128.0;
      vec3 col = 0.5 + 0.5*cos(6.2831*(t*3.0 + uTime*0.2*speed + vec3(0.0,0.33,0.67) + uBass*0.5));
      col *= intensity * (0.8 + 0.4*uBeat);
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"scale",label:"Scale",min:.5,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{speed:.5},[{signal:"volume",param:"distortion",amount:.3,curve:"log"}],"medium"),i("fractal-julia","Julia Dreamscape","fractals","Audio-reactive Julia set with morphing parameters and luminous coloring",["fractal","julia","morphing","reactive"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float zoom = 1.5 - uBass*0.3;
      vec2 c = vec2(-0.7, 0.27015) + vec2(sin(uTime*0.1*speed)*0.1, cos(uTime*0.13*speed)*0.1);
      c += uMid * vec2(0.1, -0.05);
      vec2 z = uv / zoom;
      float iter = 0.0;
      for(int i = 0; i < 100; i++) {
        if(dot(z,z) > 4.0) break;
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        iter += 1.0;
      }
      float t = iter/100.0;
      vec3 col = 0.5 + 0.5*cos(6.2831*(t*2.0 + vec3(0.0,0.1,0.2) + uTime*0.15));
      col *= intensity * (0.7 + 0.5*uBeat);
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.6,curve:"log"}],"medium"),i("fractal-kaleidoscope","Kaleidoscope Mind","fractals","Psychedelic kaleidoscopic fractals driven by the beat",["fractal","kaleidoscope","psychedelic","beat-synced"],`
    vec2 kaleidoscope(vec2 p, float folds) {
      float angle = 3.14159 / folds;
      float sector = atan(p.y, p.x);
      sector = mod(sector, 2.0*angle) - angle;
      float r = length(p);
      return r * vec2(cos(sector), sin(sector));
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float folds = 6.0 + floor(uBeat * 3.0);
      vec2 p = kaleidoscope(uv, folds);
      p += uTime * 0.2 * speed;
      float n = fbm(p * 3.0);
      float warp = fbm(p * 2.0 + n * 2.0 * (1.0 + uBass));
      vec3 col = 0.5 + 0.5*cos(6.2831*(warp*2.0 + vec3(0,0.33,0.67) + uTime*0.1));
      col *= intensity;
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("vj-tunnel","Hypnotic Tunnel","vj","Classic VJ tunnel with depth-reactive warping and beat pulse",["tunnel","classic","depth","reactive"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float a = atan(uv.y, uv.x);
      float r = length(uv);
      float tunnel = 1.0 / (r + 0.01);
      float depth = tunnel + uTime * speed * 2.0;
      float warp = sin(a*3.0 + depth*0.5) * 0.1 * (1.0 + uBass);
      vec2 tc = vec2(a/3.14159, tunnel*0.3 + warp) + vec2(uTime*0.1, 0.0);
      float pattern = fbm(tc * 4.0);
      float ring = smoothstep(0.48, 0.5, fract(depth*0.3 + pattern*0.2));
      vec3 col = mix(
        vec3(0.02, 0.0, 0.05),
        vec3(0.4 + 0.3*uBeat, 0.1, 0.8),
        ring * intensity
      );
      col *= 1.0 - r*1.5;
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"low"),i("vj-radial-burst","Radial Burst","vj","Explosive radial bursts synchronized with kick drums",["radial","burst","kick","explosive"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float r = length(uv);
      float a = atan(uv.y, uv.x);
      float rays = 12.0 + uBeat * 6.0;
      float pattern = sin(a * rays + uTime * speed) * 0.5 + 0.5;
      pattern *= pow(max(1.0 - r, 0.0), 2.0);
      float burst = uBeat * exp(-r * 3.0) * 2.0;
      pattern += burst;
      vec3 col = vec3(1.0, 0.6, 0.2) * pattern * intensity;
      col += vec3(0.1, 0.0, 0.3) * (1.0 - pattern);
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"low"),i("vj-spectrum","Spectrum Field","vj","Frequency spectrum visualization with fluid dynamics",["spectrum","bars","fluid","reactive"],`
    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;
      float bars = 0.0;
      float nBars = 64.0;
      float barWidth = 1.0/nBars;
      float idx = floor(uv.x * nBars);
      float binVal = sin(idx * 0.3 + uTime * speed) * 0.5 + 0.5;
      binVal *= (0.3 + uBass*0.7 * smoothstep(0.0, 0.3, uv.x) +
                     uMid*0.5 * smoothstep(0.2, 0.6, uv.x) +
                     uTreble*0.6 * smoothstep(0.5, 1.0, uv.x));
      float bar = smoothstep(uv.y, uv.y + 0.02, binVal * 0.8);
      float glow = exp(-abs(uv.y - binVal*0.8) * 20.0) * 0.5;
      vec3 col = vec3(0.0);
      col += bar * mix(vec3(0.0, 0.8, 1.0), vec3(1.0, 0.2, 0.8), uv.x);
      col += glow * vec3(0.2, 0.5, 1.0);
      col *= intensity;
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"low"),i("geo-grid","Reactive Grid","geometric","Warping grid mesh that breathes with the bass and pulses on beats",["grid","mesh","warp","reactive"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float warp = uBass * 0.3;
      vec2 p = uv * (4.0 + sin(uTime*0.2*speed)*0.5);
      p += vec2(fbm(p + uTime*0.1), fbm(p + vec2(5.2))) * warp;
      vec2 grid = fract(p) - 0.5;
      float line = min(abs(grid.x), abs(grid.y));
      float pattern = smoothstep(0.02, 0.05, line);
      float glow = exp(-line * 30.0) * 0.5;
      vec3 col = vec3(0.0);
      col += (1.0 - pattern) * vec3(0.3, 0.1, 0.8) * intensity;
      col += glow * vec3(0.5, 0.2, 1.0) * (0.5 + 0.5*uBeat);
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"low"),i("geo-voronoi","Voronoi Pulse","geometric","Organic Voronoi cells that split and pulse with the rhythm",["voronoi","cells","organic","pulse"],`
    vec2 voronoi(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      float md = 8.0; float md2 = 8.0;
      for(int y = -1; y <= 1; y++)
        for(int x = -1; x <= 1; x++) {
          vec2 n = vec2(float(x), float(y));
          vec2 pt = vec2(0.5 + 0.5*sin(hash(i+n)*6.28 + uTime*speed));
          float d = length(n + pt - f);
          if(d < md) { md2 = md; md = d; }
          else if(d < md2) { md2 = d; }
        }
      return vec2(md, md2);
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float vScale = 4.0 + uBeat * 0.5;
      vec2 v = voronoi(uv * vScale);
      float edge = smoothstep(0.0, 0.05, v.y - v.x);
      float glow = exp(-v.x * 10.0) * (0.5 + 0.5*uBeat);
      vec3 col = mix(vec3(0.6, 0.1, 0.8), vec3(0.1, 0.4, 1.0), v.x);
      col *= (1.0 - edge) * intensity;
      col += glow * vec3(0.8, 0.3, 1.0) * 0.5;
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-fluid","Fluid Distortion","liquid","Flowing liquid metal surface with domain warping and bass reactivity",["fluid","metal","warp","bass-reactive"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float amp = 0.5 + uBass * 1.5;
      vec2 q = vec2(fbm(uv*2.0 + uTime*0.1*speed), fbm(uv*2.0 + vec2(5.2,1.3) + uTime*0.12));
      vec2 r = vec2(fbm(uv*2.0 + 4.0*q + vec2(1.7,9.2) + uTime*0.15),
                    fbm(uv*2.0 + 4.0*q + vec2(8.3,2.8) + uTime*0.126));
      float f = fbm(uv*2.0 + amp * r);
      vec3 col = mix(vec3(0.05, 0.0, 0.15), vec3(0.9, 0.3, 0.6), clamp(f*f*4.0, 0.0, 1.0));
      col = mix(col, vec3(0.1, 0.6, 0.9), clamp(length(q), 0.0, 1.0));
      col *= intensity * (0.8 + 0.4*uBeat);
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-metaballs","Metaballs","liquid","Smooth metaball blobs that respond to frequency bands",["metaballs","organic","smooth","reactive"],`
    float sdSphere(vec2 p, float r) { return length(p) - r; }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float d = 1e10;
      for(int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 center = vec2(
          sin(uTime*0.3*speed + fi*1.3) * 0.4 + sin(fi*2.1)*0.2,
          cos(uTime*0.25*speed + fi*1.7) * 0.4 + cos(fi*1.7)*0.2
        );
        float r = 0.1 + sin(fi*1.5 + uTime*0.5) * 0.05;
        if(i == 0) r += uBass * 0.1;
        if(i == 2) r += uMid * 0.08;
        if(i == 4) r += uTreble * 0.06;
        d = min(d, sdSphere(uv - center, r));
      }
      float glow = exp(-d * 15.0) * 0.8;
      float fill = smoothstep(0.01, -0.01, d);
      vec3 col = vec3(0.0);
      col += fill * vec3(0.4, 0.1, 0.8) * intensity;
      col += glow * vec3(0.8, 0.3, 1.0);
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("cos-nebula","Nebula Drift","cosmic","Deep space nebula with swirling gases and star field",["nebula","space","stars","drift"],`
    float stars(vec2 p) {
      p *= 200.0;
      float s = hash(floor(p));
      s = step(0.98, s);
      s *= 0.5 + 0.5*sin(uTime*2.0 + hash(floor(p+1.0))*6.28);
      return s;
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 q = vec2(fbm(uv + uTime*0.02*speed), fbm(uv + vec2(5.2) + uTime*0.015));
      float n = fbm(uv*3.0 + q*2.0);
      vec3 col = mix(vec3(0.0, 0.0, 0.02), vec3(0.2, 0.0, 0.5), n);
      col = mix(col, vec3(0.8, 0.2, 0.5), n*n*2.0);
      col += stars(uv) * vec3(1.0) * (0.7 + 0.3*uBeat);
      col *= intensity;
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"medium"),i("cos-blackhole","Black Hole","cosmic","Gravitational lensing around a black hole with accretion disk",["blackhole","gravity","lensing","accretion"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float r = length(uv);
      float a = atan(uv.y, uv.x);
      float gravity = 0.15 + uBass * 0.1;
      float warp = gravity / (r + 0.01);
      vec2 warped = uv + normalize(uv + 0.0001) * warp * 0.1;
      float disk = exp(-abs(length(warped) - 0.3 - sin(uTime*0.3*speed)*0.05) * 30.0);
      float accretion = disk * (0.5 + 0.5*sin(a*8.0 + uTime*2.0*speed));
      vec3 col = vec3(0.0);
      col += accretion * mix(vec3(1.0, 0.5, 0.1), vec3(0.5, 0.1, 1.0), disk);
      float eventHorizon = smoothstep(0.08, 0.05, r);
      col *= (1.0 - eventHorizon);
      col += vec3(0.3, 0.0, 0.8) * exp(-r*3.0) * 0.2 * (0.5 + 0.5*uBeat);
      col *= intensity;
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"high"),i("syn-horizon","Synthwave Horizon","synthwave","Retro grid horizon with neon sunset and reactive mountains",["synthwave","retro","grid","horizon"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec3 col = vec3(0.0);
      float horizon = 0.0;
      if(uv.y > horizon) {
        float sky = (uv.y - horizon) / (0.5 - horizon);
        col = mix(vec3(0.8, 0.1, 0.4), vec3(0.1, 0.0, 0.4), sky);
        float sun = smoothstep(0.15, 0.0, abs(uv.x) - 0.1);
        sun *= smoothstep(0.0, 0.3, uv.y) * smoothstep(0.5, 0.3, uv.y);
        col += sun * vec3(1.0, 0.6, 0.2);
      } else {
        float gridZ = -0.5 / (uv.y - horizon + 0.01);
        float gridX = uv.x * gridZ;
        vec2 grid = fract(vec2(gridX, gridZ * 2.0 + uTime * speed * 3.0));
        float line = min(abs(grid.x), abs(grid.y));
        float gridPattern = smoothstep(0.02, 0.04, line);
        float fade = exp(-abs(uv.y - horizon) * 5.0);
        col = mix(vec3(0.8, 0.2, 1.0), vec3(0.0), gridPattern) * fade;
        col += exp(-abs(uv.y - horizon) * 20.0) * vec3(1.0, 0.3, 0.8) * 0.5;
      }
      col *= intensity * (0.8 + 0.3*uBeat);
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("abs-domain-warp","Domain Warp","abstract","Classic double domain warping with audio-driven intensity",["domain-warp","fbm","flow","reactive"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float amp = 0.5 + uBass * 2.0;
      vec2 q = vec2(fbm(uv*3.0), fbm(uv*3.0 + vec2(5.2,1.3)));
      vec2 r = vec2(fbm(uv*3.0 + 4.0*q + vec2(1.7,9.2) + uTime*0.15*speed),
                    fbm(uv*3.0 + 4.0*q + vec2(8.3,2.8) + uTime*0.126));
      float f = fbm(uv*3.0 + amp * r);
      vec3 col = vec3(0.0);
      col = mix(col, vec3(0.8, 0.2, 0.5), clamp(f*f*4.0, 0.0, 1.0));
      col = mix(col, vec3(0.1, 0.3, 0.8), clamp(length(q), 0.0, 1.0));
      col = mix(col, vec3(0.2, 0.8, 0.5), clamp(length(r.x), 0.0, 1.0));
      col *= intensity;
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("abs-interference","Interference Pattern","abstract","Wave interference patterns with constructive and destructive zones",["interference","waves","patterns","constructive"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float d = 0.0;
      for(int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 center = vec2(sin(fi*1.5 + uTime*0.2*speed)*0.5, cos(fi*2.1 + uTime*0.15)*0.5);
        float r = length(uv - center);
        d += sin(r * (10.0 + fi*5.0) - uTime * (1.0 + fi*0.3) * speed);
      }
      d = d * 0.25 + 0.5;
      d = max(d, 0.0);
      vec3 col = vec3(0.0);
      col.r = pow(d, 2.0 + uBass);
      col.g = pow(d, 3.0);
      col.b = pow(d, 1.5 + uTreble);
      col *= intensity * (0.7 + 0.5*uBeat);
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"low"),i("min-circle","Pulse Circle","minimal","Elegant pulsing circle with beat-reactive glow",["minimal","circle","pulse","elegant"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float r = length(uv);
      float circle = smoothstep(0.005, 0.0, abs(r - 0.3 - uBeat*0.05));
      float inner = smoothstep(0.28, 0.3, r) * smoothstep(0.32, 0.3, r);
      float glow = exp(-abs(r - 0.3) * 20.0) * (0.3 + 0.7*uBeat);
      vec3 col = vec3(0.0);
      col += circle * vec3(0.4, 0.4, 1.0) * intensity;
      col += glow * vec3(0.3, 0.3, 0.8) * 0.5;
      col += inner * vec3(0.05, 0.02, 0.1);
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-lines","Minimal Lines","minimal","Clean horizontal lines with audio-reactive wave distortion",["minimal","lines","clean","wave"],`
    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution;
      float lines = 0.0;
      float nLines = 20.0;
      float y = uv.y * nLines;
      float wave = sin(y * 3.14159 + uTime * speed + uv.x * 2.0) * 0.3 * (1.0 + uBass);
      float line = smoothstep(0.48, 0.5, fract(y + wave));
      float glow = exp(-abs(fract(y + wave) - 0.5) * 20.0);
      vec3 col = vec3(0.0);
      col += line * vec3(0.6, 0.6, 0.7) * intensity;
      col += glow * vec3(0.4, 0.4, 0.6) * 0.3;
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("part-explosion","Particle Galaxy","particle","Fragment-based particle galaxy with trails and beat explosions",["particles","galaxy","trails","explosion"],`
    float particle(vec2 uv, vec2 center, float size) {
      float d = length(uv - center);
      return size / (d * d + 0.001);
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec3 col = vec3(0.0);
      float n = 30.0 + uBeat * 15.0;
      for(float i = 0.0; i < 30.0; i++) {
        float fi = i / 30.0;
        float angle = fi * 6.2831 + uTime * 0.3 * speed;
        float radius = 0.1 + fi * 0.3 + sin(uTime*0.5 + fi*10.0)*0.05;
        vec2 pos = vec2(cos(angle), sin(angle)) * radius;
        float p = particle(uv, pos, 0.0002);
        vec3 pCol = mix(vec3(0.5, 0.1, 1.0), vec3(1.0, 0.5, 0.2), fi);
        col += p * pCol * (0.3 + 0.7*step(fi, uBeat));
      }
      col *= intensity;
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"high"),i("fractal-menger","Menger Cathedral","fractals","Recursive Menger sponge with volumetric lighting and audio-reactive rotation",["fractal","menger","3d","recursive"],`
    float sdBox(vec3 p, vec3 b) { vec3 q=abs(p)-b; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0); }
    float mengerSponge(vec3 p) {
      float d = sdBox(p, vec3(1.0));
      float s = 1.0;
      for(int i=0;i<3;i++) {
        vec3 a=mod(p*s,2.0)-1.0; s*=3.0;
        vec3 r=abs(1.0-3.0*abs(a));
        float da=max(r.x,r.y), db=max(r.y,r.z), dc=max(r.z,r.x);
        float c=(min(da,min(db,dc))-1.0)/s;
        d=max(d,c);
      }
      return d;
    }
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      vec3 ro=vec3(0.0,0.0,3.0);
      vec3 rd=normalize(vec3(uv,-1.5));
      float t=0.0;
      for(int i=0;i<60;i++) {
        vec3 p=ro+rd*t;
        float r=uTime*0.3*speed;
        p.xz*=mat2(cos(r),-sin(r),sin(r),cos(r));
        float d=mengerSponge(p);
        if(d<0.001)break;
        t+=d;
        if(t>10.0)break;
      }
      vec3 p=ro+rd*t;
      float glow=exp(-t*0.5)*0.3;
      vec3 col=vec3(glow)*vec3(0.4,0.2,0.8);
      col*=intensity*(0.7+0.5*uBeat);
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"high"),i("fractal-sierpinski","Sierpinski Abyss","fractals","Infinite Sierpinski triangle descent with beat-reactive depth",["fractal","sierpinski","abyss","depth"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      vec3 col=vec3(0.0);
      for(int i=0;i<12;i++) {
        float fi=float(i);
        float sScale=pow(2.0,fi);
        vec2 p=uv*sScale+vec2(sin(uTime*0.2*speed+fi),cos(uTime*0.15*speed+fi*1.3))*0.3;
        float tri=abs(p.x)+abs(p.y*0.866)-0.5/sScale;
        float edge=smoothstep(0.01/sScale,0.0,abs(tri));
        float glow=exp(-abs(tri)*sScale*5.0)*0.3;
        vec3 c=mix(vec3(0.3,0.1,0.8),vec3(0.8,0.2,0.5),fi/12.0);
        col+=c*(edge+glow)*(1.0-uBeat*0.3*step(4.0,fi));
      }
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("vj-waveform","Waveform River","vj","Flowing audio waveform visualized as luminous river particles",["waveform","river","particles","audio"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      vec3 col=vec3(0.0);
      for(float i=0.0;i<20.0;i++) {
        float fi=i/20.0;
        float y=mix(-0.5,0.5,fi);
        float wave=sin(uv.x*10.0+uTime*2.0*speed+fi*6.28)*0.1*(1.0+uBass);
        float dist=abs(uv.y-y-wave);
        float line=exp(-dist*50.0);
        float pulse=exp(-dist*200.0)*uBeat*0.5;
        vec3 c=mix(vec3(0.0,0.5,1.0),vec3(1.0,0.2,0.8),fi);
        col+=c*(line*0.3+pulse);
      }
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"low"),i("vj-strobe","Strobe Gate","vj","Rhythmic strobe effect with frequency-split color channels",["strobe","rhythmic","flash","gate"],`
    void main() {
      vec2 uv=gl_FragCoord.xy/uResolution;
      float gate=step(0.5,fract(uTime*uBPM/60.0*0.5));
      float beat=smoothstep(0.0,0.05,uBeat);
      float strobe=mix(0.06,1.0,gate*beat);
      vec3 base=vec3(smoothstep(0.0,0.33,uv.x),smoothstep(0.33,0.66,uv.x),smoothstep(0.66,1.0,uv.x));
      vec3 col=strobe*(base*0.35+vec3(0.15,0.08,0.12));
      col.r+=strobe*smoothstep(0.0,0.33,uv.x)*uBass*0.8;
      col.g+=strobe*smoothstep(0.33,0.66,uv.x)*uMid*0.8;
      col.b+=strobe*smoothstep(0.66,1.0,uv.x)*uTreble*0.8;
      col*=intensity*2.0;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"low"),i("geo-mandala","Digital Mandala","geometric","Symmetrical mandala pattern with rotating audio-reactive layers",["mandala","symmetry","rotating","layers"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float a=atan(uv.y,uv.x);
      float r=length(uv);
      float symmetry=8.0;
      float sector=mod(a,6.2831/symmetry)-3.14159/symmetry;
      vec2 p=r*vec2(cos(sector),sin(sector));
      float d=0.0;
      for(float i=1.0;i<6.0;i++) {
        float ring=abs(r-i*0.08)*10.0;
        float pattern=abs(p.x)+abs(p.y*0.5);
        d+=smoothstep(0.02,0.0,abs(pattern-0.1-i*0.02))*(1.0+uBeat*0.5);
      }
      float rot=sin(uTime*0.5*speed+r*3.0)*0.3*(1.0+uBass*0.5);
      d+=smoothstep(0.01,0.0,abs(r-0.3+sin(a*symmetry+rot)*0.05));
      vec3 col=vec3(0.4,0.1,0.8)*d*intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("geo-cells","Cellular Automata","geometric","Living cellular automata grid with organic growth patterns",["cellular","automata","organic","growth"],`
    float cell(vec2 p) {
      vec2 i=floor(p); vec2 f=fract(p);
      float minD=10.0;
      for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++) {
        vec2 n=vec2(float(x),float(y));
        vec2 pt=vec2(hash(i+n),hash(i+n+vec2(31,17)));
        pt=0.5+0.5*sin(uTime*0.3*speed+pt*6.28);
        float d=length(n+pt-f);
        minD=min(minD,d);
      }
      return minD;
    }
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float cScale=8.0+uBass*2.0;
      float c=cell(uv*cScale);
      float edge=smoothstep(0.05,0.0,abs(c-0.1));
      float fill=smoothstep(0.15,0.05,c);
      vec3 col=vec3(0.0);
      col+=fill*vec3(0.1,0.3,0.6)*intensity;
      col+=edge*vec3(0.5,0.8,1.0)*intensity*(0.5+0.5*uBeat);
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-ink","Ink Diffusion","liquid","Spreading ink drops with viscous fluid dynamics",["ink","diffusion","viscous","drops"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float d=0.0;
      for(int i=0;i<6;i++) {
        float fi=float(i);
        vec2 center=vec2(sin(fi*2.1+uTime*0.1*speed)*0.4,cos(fi*1.7+uTime*0.13)*0.4);
        if(i==0) center+=uBass*vec2(0.1,0.05);
        float r=length(uv-center);
        float drop=smoothstep(0.15+sin(uTime+fi)*0.05,0.0,r);
        d+=drop;
      }
      float warp=fbm(uv*5.0+d*3.0);
      vec3 col=mix(vec3(0.0,0.0,0.05),vec3(0.1,0.2,0.5),clamp(d,0.0,1.0));
      col=mix(col,vec3(0.5,0.1,0.3),warp*0.5);
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-mercury","Liquid Mercury","liquid","Reflective liquid metal surface with dynamic environment mapping",["mercury","reflective","metal","dynamic"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float n=fbm(uv*3.0+uTime*0.2*speed);
      float warp=fbm(uv*2.0+vec2(n)*2.0);
      float metal=smoothstep(0.3,0.7,warp);
      vec3 refl=vec3(0.6,0.7,0.8)*metal+vec3(0.1,0.1,0.15)*(1.0-metal);
      refl+=vec3(0.3,0.5,0.8)*exp(-length(uv)*2.0)*0.3;
      float highlight=pow(max(0.0,1.0-abs(warp-0.5)*4.0),8.0);
      refl+=highlight*vec3(1.0)*(0.5+0.5*uBeat);
      refl*=intensity;
      fragColor=vec4(refl,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("cos-galaxy","Spiral Galaxy","cosmic","Rotating spiral galaxy with star nurseries and cosmic dust",["galaxy","spiral","stars","cosmic"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float a=atan(uv.y,uv.x);
      float r=length(uv);
      float spiral=sin(a*3.0-r*10.0+uTime*0.5*speed+uBass*2.0);
      float arms=pow(max(0.0,spiral),4.0)*exp(-r*3.0);
      float core=exp(-r*5.0)*0.8;
      float stars=step(0.98,hash(floor(uv*200.0)))*0.5;
      vec3 col=vec3(0.0);
      col+=arms*mix(vec3(0.3,0.1,0.8),vec3(0.8,0.3,0.1),r);
      col+=core*vec3(1.0,0.9,0.7);
      col+=stars*vec3(1.0);
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"medium"),i("cos-aurora","Aurora Borealis","cosmic","Northern lights with flowing curtains and particle-like shimmer",["aurora","borealis","lights","flowing"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float y=uv.y*0.5+0.3;
      float wave=sin(uv.x*3.0+uTime*0.5*speed)*0.1+sin(uv.x*7.0-uTime*0.3)*0.05;
      float curtain=exp(-pow((y+wave)*3.0,2.0));
      float shimmer=fbm(vec2(uv.x*10.0,uTime*0.8))*0.3;
      curtain*=0.7+shimmer+uBeat*0.3;
      vec3 col=vec3(0.0);
      col.r=curtain*0.2;
      col.g=curtain*0.8;
      col.b=curtain*0.5+shimmer*0.3;
      col+=vec3(0.0,0.02,0.04)*(1.0-curtain);
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"medium"),i("syn-city","Neon City","synthwave","Synthwave cityscape with neon signs and reflective streets",["city","neon","buildings","reflective"],`
    float building(vec2 p, float x) {
      float w=0.03+hash(vec2(x,0.0))*0.04;
      float h=0.1+hash(vec2(x,1.0))*0.3;
      float d=smoothstep(x-w,x-w+0.002,p.x)*smoothstep(x+w,x+w-0.002,p.x);
      d*=smoothstep(-0.1,-0.1+0.002,p.y)*smoothstep(h,h-0.002,p.y);
      return d;
    }
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      vec3 col=vec3(0.0);
      if(uv.y<0.0) {
        float ref=uv.y*-1.0;
        col=mix(vec3(0.1,0.0,0.2),vec3(0.0),ref*3.0);
        float streetLine=smoothstep(0.001,0.0,abs(fract(uv.x*5.0+uTime*speed)-0.5)-0.48);
        col+=streetLine*vec3(0.8,0.2,1.0)*0.3*(1.0-ref*5.0);
      } else {
        col=vec3(0.02,0.0,0.05);
        for(float i=0.0;i<8.0;i++) {
          float x=-0.7+i*0.2;
          col+=building(uv,i)*mix(vec3(0.05,0.02,0.1),vec3(0.5,0.1,0.8),hash(vec2(i,2.0)));
          float neon=building(vec2(uv.x,uv.y-0.05),i)*hash(vec2(i,3.0));
          col+=neon*vec3(1.0,0.2,0.5)*step(0.5,hash(vec2(i,4.0)))*(0.5+0.5*uBeat);
        }
        float stars=step(0.99,hash(floor(uv*100.0)));
        col+=stars*vec3(0.5)*smoothstep(0.3,0.8,uv.y);
      }
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("syn-wave","Retrowave","synthwave","Retro wave pattern with neon gradients and VHS distortion",["retro","wave","vhs","neon"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float wave=sin(uv.x*8.0+uTime*2.0*speed)*0.1*(1.0+uBass);
      float scan=smoothstep(0.48,0.5,fract(uv.y*30.0+wave));
      float vhs=hash(vec2(floor(uTime*10.0),floor(uv.y*100.0)))*0.02;
      vec3 col=vec3(0.0);
      float grad=uv.y*0.5+0.5;
      col=mix(vec3(1.0,0.2,0.5),vec3(0.2,0.0,0.8),grad);
      col*=scan*0.3+0.7;
      col+=vhs*vec3(1.0,0.5,0.8);
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("abs-noise-field","Noise Field","abstract","Layered noise field with audio-driven turbulence",["noise","field","turbulence","layered"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float n1=fbm(uv*3.0+uTime*0.1*speed);
      float n2=fbm(uv*5.0+vec2(n1)*2.0+uTime*0.15);
      float n3=fbm(uv*8.0+vec2(n2)*1.5+uBass*2.0);
      vec3 col=vec3(0.0);
      col.r=n3;
      col.g=n2*0.7;
      col.b=n1*0.5+0.2;
      col=pow(col,vec3(1.5));
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("abs-plasma","Plasma Storm","abstract","Classic plasma effect with modern audio-reactive enhancement",["plasma","classic","storm","reactive"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float t=uTime*speed;
      float v1=sin(uv.x*10.0+t);
      float v2=sin(uv.y*10.0+t*0.7);
      float v3=sin((uv.x+uv.y)*10.0+t*0.5);
      float v4=sin(length(uv)*12.0-t);
      float plasma=(v1+v2+v3+v4)*0.25;
      plasma+=uBass*0.3;
      vec3 col=0.5+0.5*cos(6.2831*(plasma+vec3(0.0,0.33,0.67)+uBeat*0.3));
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"low"),i("abs-mesh","Living Mesh","abstract","Deforming mesh grid with vertex displacement driven by audio",["mesh","deform","grid","vertex"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float gridSize=20.0;
      vec2 p=uv*gridSize;
      float dx=sin(p.y+uTime*speed)*0.3*(1.0+uBass);
      float dy=cos(p.x+uTime*0.8*speed)*0.3*(1.0+uMid);
      vec2 dp=vec2(dx,dy);
      vec2 gp=fract(p+dp)-0.5;
      float lineX=smoothstep(0.03,0.0,abs(gp.x)-0.47);
      float lineY=smoothstep(0.03,0.0,abs(gp.y)-0.47);
      float line=max(lineX,lineY);
      float glow=exp(-line*20.0)*0.5;
      vec3 col=vec3(0.0);
      col+=line*vec3(0.3,0.6,1.0)*intensity;
      col+=glow*vec3(0.5,0.3,0.8)*uBeat;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"low"),i("part-trails","Particle Trails","particle","Trailing particles that follow audio-driven attractors",["trails","attractors","flowing","persistent"],`
    float particle(vec2 uv, vec2 pos, float size, float trail) {
      vec2 d=uv-pos;
      float r=length(d);
      float angle=atan(d.y,d.x);
      vec2 trailPos=pos+vec2(cos(angle),sin(angle))*trail*0.1;
      float trailDist=length(uv-trailPos);
      return size/(r*r+0.001)+size*0.3/(trailDist*trailDist+0.01);
    }
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      vec3 col=vec3(0.0);
      for(float i=0.0;i<25.0;i++) {
        float fi=i/25.0;
        float speed2=0.3+fi*0.5;
        vec2 pos=vec2(
          sin(uTime*speed2+fi*6.28)*0.4,
          cos(uTime*speed2*0.7+fi*4.0)*0.4
        );
        float size=0.0003*(0.5+uBeat*0.5);
        float trail=uBass*0.5;
        float p=particle(uv,pos,size,trail);
        vec3 c=mix(vec3(0.2,0.5,1.0),vec3(1.0,0.3,0.8),fi);
        col+=c*p*0.5;
      }
      col*=intensity;
      fragColor=vec4(clamp(col,0.0,1.0),1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"high"),i("part-nebula-particles","Stardust","particle","Floating stardust particles with nebula background",["stardust","particles","nebula","floating"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float nebula=fbm(uv*2.0+uTime*0.05*speed);
      vec3 col=vec3(0.02,0.0,0.05)*nebula*2.0;
      for(float i=0.0;i<40.0;i++) {
        float fi=i/40.0;
        vec2 pos=vec2(
          hash(vec2(i,1.0))-0.5,
          hash(vec2(i,2.0))-0.5
        );
        pos+=vec2(sin(uTime*0.2+fi*10.0),cos(uTime*0.15+fi*8.0))*0.05;
        float d=length(uv-pos);
        float brightness=0.001/(d*d+0.001);
        float twinkle=0.5+0.5*sin(uTime*3.0+fi*20.0)+uBass*0.2;
        vec3 c=mix(vec3(1.0,0.9,0.7),vec3(0.7,0.8,1.0),fi);
        col+=c*brightness*twinkle*0.01;
      }
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"high"),i("min-breath","Breathing Light","minimal","Single breathing light point with subtle harmonic overtones",["breathing","light","minimal","harmonic"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float breath=sin(uTime*0.5*speed)*0.5+0.5;
      breath=mix(breath,breath*uBeat,0.3);
      float d=length(uv);
      float core=exp(-d*5.0)*breath;
      float glow=exp(-d*2.0)*breath*0.3;
      float ring=exp(-abs(d-0.3-breath*0.1)*30.0)*0.1;
      vec3 col=vec3(0.6,0.7,1.0)*core+vec3(0.3,0.4,0.8)*glow+vec3(0.4,0.5,0.9)*ring;
      col*=intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-zen","Zen Circle","minimal","Enso-inspired circle with imperfect brush stroke and audio reactivity",["zen","enso","circle","imperfect"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float r=length(uv);
      float a=atan(uv.y,uv.x);
      float stroke=0.3+sin(a*3.0)*0.01+sin(a*7.0)*0.005;
      stroke+=uBass*0.02;
      float dist=abs(r-stroke);
      float brush=smoothstep(0.008,0.002,dist);
      float alpha=smoothstep(3.14159*2.0,2.5,a+3.14159);
      brush*=alpha;
      vec3 col=vec3(0.0);
      col+=brush*vec3(0.8,0.8,0.7)*intensity;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-rings","Concentric","minimal","Perfect concentric rings with audio-driven color shift",["concentric","rings","clean","color-shift"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      float r=length(uv);
      float rings=sin(r*30.0-uTime*2.0*speed)*0.5+0.5;
      rings*=1.0+uBass*0.5;
      float edge=smoothstep(0.48,0.5,rings);
      float glow=exp(-abs(rings-0.5)*10.0)*0.3;
      float hue=fract(r*2.0+uTime*0.1+uMid);
      vec3 ringCol=0.5+0.5*cos(6.2831*(hue+vec3(0,0.33,0.67)));
      vec3 col=vec3(0.0);
      col+=edge*ringCol*intensity;
      col+=glow*ringCol*0.3;
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:2,default:0,step:.05,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("vj-psychedelic","Acid Trip","vj","Intense psychedelic visuals with fractal feedback and color cycling",["psychedelic","acid","feedback","intense"],`
    void main() {
      vec2 uv=(gl_FragCoord.xy-0.5*uResolution)/min(uResolution.x,uResolution.y);
      vec2 p=uv;
      for(int i=0;i<6;i++) {
        p=vec2(sin(p.y*3.0+uTime*0.3*speed+uBass),cos(p.x*3.0+uTime*0.25));
      }
      float d=length(p);
      vec3 col=0.5+0.5*cos(6.2831*(d*3.0+vec3(0,0.33,0.67)+uTime*0.2));
      col*=intensity*(0.8+0.4*uBeat);
      fragColor=vec4(col,1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1.5,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"low"),i("fractal-burning-ship","Burning Ship","fractals","Classic Burning Ship fractal with flame-like tendrils",["🔥"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 2.5 - scale * 0.5 + uBass * 0.15;
  uv += vec2(offsetX, offsetY);
  vec2 c = vec2(-0.745, 0.186);
  vec2 z = uv;
  float iter = 0.0;
  for (int i = 0; i < 80; i++) {
    z = vec2(z.x * z.x - z.y * z.y + c.x, abs(2.0 * z.x * z.y) + c.y);
    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }
  float t = iter / 80.0;
  vec3 col = vec3(0.0);
  col += 0.5 + 0.5 * cos(6.28 * (t * 3.0 + uTime * 0.1 + vec3(0.0, 0.33, 0.67) + uSpectralCentroid * 0.3));
  col *= (1.0 + uBass * 0.3) * (0.7 + 0.5 * uBeat);
  col *= 0.8 + uTreble * 0.4;
  fragColor = vec4(col, 1.0);
}`,[{id:"offsetX",label:"Offset X",min:-2,max:2,default:-.745,step:.01,group:"transform"},{id:"offsetY",label:"Offset Y",min:-2,max:2,default:.186,step:.01,group:"transform"}],{},[{signal:"bass",param:"distortion",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"medium",`uniform float offsetX;
uniform float offsetY;
`),i("fractal-phoenix","Phoenix","fractals","Phoenix fractal with swirling orbital patterns",["🦅"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 2.0;
  vec2 c = vec2(0.566, 0.566);
  vec2 z = uv;
  vec2 prev = vec2(0.0);
  float iter = 0.0;
  for (int i = 0; i < 100; i++) {
    vec2 temp = z;
    z = vec2(z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y) + 0.1 * prev;
    prev = temp;
    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }
  float t = iter / 100.0;
  vec3 col = vec3(0.0);
  col += 0.5 + 0.5 * cos(6.28 * (t * 5.0 + vec3(0.0, 0.1, 0.2)));
  col *= 1.0 + uMid * 0.4;
  fragColor = vec4(col, 1.0);
}`,[{id:"zoom",label:"Zoom",min:0,max:5,default:1,step:.1,group:"transform"},{id:"blend",label:"Blend",min:0,max:1,default:.1,step:.01,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("fractal-logistic","Logistic Map","fractals","Visualization of chaos theory through logistic equation",["📈"],`void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float r = 2.5 + uv.x * 1.5 + uBass * 0.5;
  float x = 0.5;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 100; i++) {
    x = r * x * (1.0 - x);
    float y = float(i) / 100.0;
    if (abs(y - uv.y) < 0.01) {
      col = vec3(x, x * 0.5, x * 0.3);
      break;
    }
  }
  col *= 0.8 + 0.2 * sin(uTime + uv.x * 10.0);
  fragColor = vec4(col, 1.0);
}`,[{id:"rate",label:"Growth Rate",min:2.5,max:4,default:3.5,step:.01,group:"chaos"}],{},[{signal:"bass",param:"distortion",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("fractal-newton","Newton Basin","fractals","Newton fractal with colorful convergence basins",["🍎"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 3.0;
  vec2 z = uv;
  vec2 roots[3];
  roots[0] = vec2(1.0, 0.0);
  roots[1] = vec2(-0.5, 0.866);
  roots[2] = vec2(-0.5, -0.866);
  vec3 col = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    vec2 z2 = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
    vec2 z3 = vec2(z2.x * z.x - z2.y * z.y, z2.x * z.y + z2.y * z.x);
    z = z - (z3 - vec2(1.0, 0.0)) * vec2(3.0 * z2.x + 0.001, -(3.0 * z2.y)) / max(dot(3.0 * z2, 3.0 * z2) + 0.001, 0.001);
    float d0 = distance(z, roots[0]);
    float d1 = distance(z, roots[1]);
    float d2 = distance(z, roots[2]);
    if (d0 < 0.01) { col = vec3(1.0, 0.3, 0.3); break; }
    if (d1 < 0.01) { col = vec3(0.3, 1.0, 0.3); break; }
    if (d2 < 0.01) { col = vec3(0.3, 0.3, 1.0); break; }
  }
  col *= 1.0 + uTreble * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"iterations",label:"Iterations",min:10,max:50,default:20,step:1,group:"quality"}],{},[{signal:"bass",param:"distortion",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("fractal-julia-spiral","Julia Spiral","fractals","Spiraling Julia set with animated parameters",["🌀"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 2.0;
  vec2 c = vec2(-0.7, 0.27015) + 0.1 * sin(uTime * 0.3 + uMid * 0.5);
  vec2 z = uv;
  float iter = 0.0;
  for (int i = 0; i < 60; i++) {
    z = vec2(z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y);
    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }
  float t = iter / 60.0;
  vec3 col = vec3(0.0);
  col.r = sin(t * 3.14 * 2.0 + uTime * 0.5 + uBass * 0.4);
  col.g = sin(t * 3.14 * 2.0 + uTime * 0.5 + 2.094 + uBeat * 0.3);
  col.b = sin(t * 3.14 * 2.0 + uTime * 0.5 + 4.188 + uTreble * 0.5);
  col = col * col;
  col *= 0.7 + 0.5 * uBeat;
  fragColor = vec4(col, 1.0);
}`,[{id:"speed",label:"Animation Speed",min:0,max:2,default:.3,step:.01,group:"animation"}],{},[{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"medium"),i("fractal-burning-zoom","Burning Zoom","fractals","Zooming into burning ship detail with motion",["🔥"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float zoom = pow(1.5, scale * 3.0 + uBass * 0.5);
  uv *= zoom;
  uv += vec2(-0.745, 0.186);
  vec2 c = vec2(-0.745, 0.186);
  vec2 z = uv;
  float iter = 0.0;
  for (int i = 0; i < 100; i++) {
    z = vec2(z.x * z.x - z.y * z.y + c.x, abs(2.0 * z.x * z.y) + c.y);
    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }
  float t = iter / 100.0;
  vec3 col = 0.5 + 0.5 * cos(6.28 * (t + vec3(0.0, 0.1, 0.2) + uTime * 0.05 + uMid * 0.3));
  col *= 0.7 + 0.6 * uBeat;
  col *= 0.8 + uTreble * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"zoom",label:"Zoom",min:0,max:10,default:1,step:.1,group:"transform"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.35,curve:"linear"}],"medium"),i("fractal-tricorn","Tricorn","fractals","Tricorn fractal with mirror symmetry",["🔻"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 2.5 * (1.0 + uBass * 0.15);
  vec2 c = vec2(-0.3, 0.6) + vec2(sin(uTime * 0.2) * 0.05 * uMid, cos(uTime * 0.15) * 0.05 * uMid);
  vec2 z = uv;
  float iter = 0.0;
  for (int i = 0; i < 80; i++) {
    z = vec2(z.x * z.x - z.y * z.y + c.x, -2.0 * z.x * z.y + c.y);
    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }
  float t = iter / 80.0;
  vec3 col = vec3(0.0);
  col += 0.5 + 0.5 * cos(6.28 * (t * 2.0 + vec3(0.0, 0.33, 0.67) + uSpectralCentroid * 0.4));
  col *= 0.7 + 0.6 * uBeat;
  col *= 0.8 + uTreble * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"zoom",label:"Zoom",min:0,max:5,default:1,step:.1,group:"transform"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("fractal-buddhabrot","Buddhabrot","fractals","Probabilistic rendering of Buddha set trajectories",["🧘"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 3.0 * (1.0 + uBass * 0.1);
  vec3 col = vec3(0.0);
  for (int s = 0; s < 20; s++) {
    vec2 c = vec2(
      fract(sin(float(s) * 127.1) * 43758.5453),
      fract(cos(float(s) * 311.7) * 43758.5453)
    ) * 4.0 - 2.0;
    vec2 z = vec2(0.0);
    bool escaped = false;
    for (int i = 0; i < 50; i++) {
      z = vec2(z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y);
      if (dot(z, z) > 4.0) { escaped = true; break; }
    }
    if (escaped) {
      z = vec2(0.0);
      for (int i = 0; i < 50; i++) {
        z = vec2(z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y);
        vec2 p = z;
        float d = length(p - uv);
        col += exp(-d * 5.0) * vec3(0.5 + uBeat * 0.3, 0.2, 0.8 + uTreble * 0.2);
      }
    }
  }
  col /= 20.0;
  col *= 0.7 + 0.6 * uVolume;
  fragColor = vec4(col, 1.0);
}`,[{id:"samples",label:"Samples",min:5,max:50,default:20,step:1,group:"quality"}],{},[{signal:"beat",param:"brightness",amount:.4,curve:"linear"},{signal:"volume",param:"distortion",amount:.3,curve:"log"}],"high"),i("fractal-lyapunov","Lyapunov","fractals","Lyapunov exponent visualization of chaotic systems",["📊"],`void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float r = 3.5 + sin(uTime * 0.2) * 0.5;
  float x = 0.5;
  float lyap = 0.0;
  for (int i = 0; i < 100; i++) {
    float dx = r * (1.0 - 2.0 * x);
    if (abs(dx) < 0.0001) dx = 0.0001;
    lyap += log(abs(dx));
    x = r * x * (1.0 - x);
  }
  lyap /= 100.0;
  vec3 col = vec3(0.0);
  if (lyap < 0.0) {
    col = vec3(0.0, -lyap * 2.0, 0.0);
  } else {
    col = vec3(lyap * 2.0, 0.0, 0.0);
  }
  col *= 1.0 + uBeat * 0.5;
  fragColor = vec4(col, 1.0);
}`,[{id:"rate",label:"Growth Rate",min:2.5,max:4,default:3.5,step:.01,group:"chaos"}],{},[{signal:"bass",param:"distortion",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("fractal-feather","Feather","fractals","Feather-like fractal patterns with organic curves",["🪶"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 2.0;
  vec2 z = uv;
  float t = uTime * 0.1 + uMid * 0.3;
  float iter = 0.0;
  for (int i = 0; i < 60; i++) {
    float r = length(z);
    float theta = atan(z.y, z.x);
    z = vec2(
      r * cos(theta * 2.0 + t) + 0.5 * cos(theta * 3.0 + uBass * 0.2),
      r * sin(theta * 2.0 + t) + 0.5 * sin(theta * 3.0 + uBeat * 0.3)
    );
    if (length(z) > 2.0) break;
    iter += 1.0;
  }
  float f = iter / 60.0;
  vec3 col = vec3(f * 0.8, f * 0.4, f * 0.6);
  col *= (1.0 + uMid * 0.3) * (0.7 + 0.6 * uBeat);
  col *= 0.8 + uTreble * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"complexity",label:"Complexity",min:1,max:5,default:2,step:.1,group:"shape"}],{},[{signal:"mid",param:"speed",amount:.3,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("fractal-multibrot","Multibrot","fractals","Higher-order Mandelbrot sets with N-fold symmetry",["🔮"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 2.5;
  vec2 c = uv;
  vec2 z = vec2(0.0);
  float power = 3.0 + sin(uTime * 0.2) * 0.5 + uBass * 0.3;
  float iter = 0.0;
  for (int i = 0; i < 60; i++) {
    float r = length(z);
    float theta = atan(z.y, z.x);
    z = vec2(
      pow(r, power) * cos(power * theta) + c.x,
      pow(r, power) * sin(power * theta) + c.y
    );
    if (dot(z, z) > 4.0) break;
    iter += 1.0;
  }
  float t = iter / 60.0;
  vec3 col = 0.5 + 0.5 * cos(6.28 * (t * 3.0 + vec3(0.0, 0.1, 0.2)));
  fragColor = vec4(col, 1.0);
}`,[{id:"power",label:"Power",min:2,max:8,default:3,step:.1,group:"shape"}],{},[{signal:"bass",param:"distortion",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("vj-glitch","Glitch","vj","Digital glitch effect with scanline displacement",["📺"],`void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float glitchStrength = uBeat * 0.5 + uBass * 0.3;
  float slice = floor(uv.y * 20.0);
  float offset = sin(slice * 43.5 + uTime * 10.0) * glitchStrength * 0.1;
  vec2 distortedUv = uv + vec2(offset, 0.0);
  float scanline = sin(uv.y * uResolution.y * 0.5) * 0.02;
  vec3 col = vec3(
    sin(distortedUv.x * 10.0 + uTime) * 0.5 + 0.5,
    sin(distortedUv.x * 10.0 + uTime + 2.094) * 0.5 + 0.5,
    sin(distortedUv.x * 10.0 + uTime + 4.188) * 0.5 + 0.5
  );
  col += scanline;
  col *= 1.0 - step(0.98, fract(sin(slice * 127.1) * 43758.5453)) * glitchStrength;
  fragColor = vec4(col, 1.0);
}`,[{id:"intensity",label:"Intensity",min:0,max:2,default:1,step:.1,group:"glitch"},{id:"scanlines",label:"Scanlines",min:0,max:1,default:.5,step:.1,group:"glitch"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"low"),i("vj-mirror-tunnel","Mirror Tunnel","vj","Kaleidoscopic tunnel mirror effect",["🪞"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float segments = 6.0 + uBass * 2.0;
  angle = mod(angle, 6.28 / segments);
  angle = abs(angle - 3.14 / segments);
  vec2 rotatedUv = vec2(cos(angle), sin(angle)) * radius;
  float pattern = sin(rotatedUv.x * 10.0 + uTime * 2.0) * cos(rotatedUv.y * 10.0 - uTime);
  vec3 col = vec3(
    pattern * 0.5 + 0.5,
    sin(pattern * 3.14 + uTime) * 0.5 + 0.5,
    cos(pattern * 3.14 - uTime) * 0.5 + 0.5
  );
  col *= 1.0 / (1.0 + radius * 2.0);
  fragColor = vec4(col, 1.0);
}`,[{id:"segments",label:"Segments",min:3,max:12,default:6,step:1,group:"shape"},{id:"depth",label:"Depth",min:.5,max:3,default:1,step:.1,group:"transform"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"medium"),i("vj-kaleido-tunnel","Kaleido Tunnel","vj","Spiraling kaleidoscope with depth distortion",["🎆"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float segments = 8.0 + floor(uBeat * 4.0);
  angle = mod(angle, 6.28 / segments);
  angle = abs(angle - 3.14 / segments);
  float spiral = radius + uTime * 0.5;
  float pattern = sin(angle * 20.0 + spiral * 10.0) * 0.5 + 0.5;
  vec3 col = vec3(
    pattern * sin(spiral * 2.0 + uTime),
    pattern * sin(spiral * 2.0 + uTime + 2.094),
    pattern * sin(spiral * 2.0 + uTime + 4.188)
  );
  col *= 1.0 / (1.0 + radius * 3.0);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"speed",label:"Speed",min:0,max:3,default:1,step:.1,group:"animation"},{id:"complexity",label:"Complexity",min:4,max:16,default:8,step:1,group:"shape"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"medium"),i("vj-feedback","Video Feedback","vj","Recursive video feedback with trail accumulation",["📹"],`void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 center = vec2(0.5);
  vec2 toCenter = center - uv;
  float dist = length(toCenter);
  float angle = atan(toCenter.y, toCenter.x);
  float spiral = sin(angle * 3.0 + uTime + dist * 10.0) * 0.1;
  vec2 sampleUv = uv + toCenter * spiral * uBass;
  float pattern = sin(sampleUv.x * 20.0 + uTime) * cos(sampleUv.y * 20.0 - uTime);
  vec3 col = vec3(
    pattern * 0.5 + 0.5,
    sin(pattern * 3.14 + uTime * 0.5) * 0.5 + 0.5,
    cos(pattern * 3.14 - uTime * 0.5) * 0.5 + 0.5
  );
  col *= exp(-dist * 2.0);
  fragColor = vec4(col, 1.0);
}`,[{id:"feedback",label:"Feedback",min:0,max:1,default:.5,step:.01,group:"feedback"},{id:"zoom",label:"Zoom",min:.8,max:1.2,default:1,step:.01,group:"transform"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"medium"),i("vj-line-burst","Line Burst","vj","Radial line explosion from center",["💥"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float lines = 32.0;
  float pattern = sin(angle * lines + uTime * 5.0) * 0.5 + 0.5;
  pattern *= exp(-radius * 3.0);
  float burst = uBeat * 0.5;
  vec3 col = vec3(
    pattern * (1.0 + burst),
    pattern * 0.3,
    pattern * 0.8
  );
  col *= 1.0 + burst * exp(-radius * 5.0);
  fragColor = vec4(col, 1.0);
}`,[{id:"lines",label:"Lines",min:8,max:64,default:32,step:1,group:"shape"},{id:"burst",label:"Burst",min:0,max:2,default:1,step:.1,group:"audio"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"low"),i("vj-circular-spectrum","Circular Spectrum","vj","Audio spectrum displayed in a circular pattern",["🎯"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float band = (angle + 3.14159) / 6.28318;
  float spectrum = sin(band * 3.14159 * 8.0 + uTime) * 0.5 + 0.5;
  spectrum = max(spectrum, 0.1);
  spectrum *= uBass * 0.5 + uMid * 0.3 + uTreble * 0.2 + 0.15;
  float ring = smoothstep(0.3, 0.31, radius) - smoothstep(0.31 + spectrum * 0.2, 0.32 + spectrum * 0.2, radius);
  vec3 col = vec3(
    spectrum * sin(angle * 2.0 + uTime),
    spectrum * sin(angle * 2.0 + uTime + 2.094),
    spectrum * sin(angle * 2.0 + uTime + 4.188)
  );
  col *= ring;
  fragColor = vec4(col, 1.0);
}`,[{id:"radius",label:"Radius",min:.1,max:.5,default:.3,step:.01,group:"transform"},{id:"thickness",label:"Thickness",min:.01,max:.1,default:.03,step:.005,group:"shape"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"medium"),i("vj-scanlines","Scanlines","vj","CRT monitor scanline effect with distortion",["📺"],`void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float scanline = sin(uv.y * uResolution.y * 0.8) * 0.03;
  float rgbShift = sin(uv.y * 50.0 + uTime * 2.0) * 0.002 * uBeat;
  vec3 col;
  col.r = sin((uv.x + rgbShift) * 20.0 + uTime) * 0.5 + 0.5;
  col.g = sin(uv.x * 20.0 + uTime) * 0.5 + 0.5;
  col.b = sin((uv.x - rgbShift) * 20.0 + uTime) * 0.5 + 0.5;
  col -= scanline;
  col *= 1.0 + sin(uv.y * 200.0) * 0.02;
  float vignette = 1.0 - length(uv - 0.5) * 0.5;
  col *= vignette;
  fragColor = vec4(col, 1.0);
}`,[{id:"distortion",label:"Distortion",min:0,max:.1,default:.02,step:.005,group:"crt"},{id:"vignette",label:"Vignette",min:0,max:1,default:.5,step:.1,group:"crt"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"low"),i("vj-pulse-grid","Pulse Grid","vj","Grid that pulses with audio beats",["🔲"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec2 grid = fract(uv * 5.0 + uTime * 0.2) - 0.5;
  float line = smoothstep(0.02, 0.0, abs(grid.x)) + smoothstep(0.02, 0.0, abs(grid.y));
  float pulse = uBeat * 0.5 + 0.5;
  vec3 col = vec3(line * pulse * 0.3);
  col += vec3(
    exp(-length(uv) * 2.0) * pulse * 0.5,
    exp(-length(uv) * 2.0) * pulse * 0.2,
    exp(-length(uv) * 2.0) * pulse * 0.8
  );
  fragColor = vec4(col, 1.0);
}`,[{id:"density",label:"Density",min:2,max:20,default:5,step:1,group:"shape"},{id:"pulse",label:"Pulse",min:0,max:2,default:1,step:.1,group:"audio"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"low"),i("vj-hex-beat","Hex Beat","vj","Hexagonal grid with beat-reactive cells",["⬡"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec2 hex = uv * 4.0;
  float hexX = hex.x * 1.732;
  float hexY = hex.y + mod(floor(hexX), 2.0) * 0.5;
  vec2 cell = vec2(floor(hexX), floor(hexY));
  float dist = length(fract(hex) - 0.5);
  float beat = sin(dot(cell, vec2(12.9898, 78.233)) + uTime * 3.0) * 0.5 + 0.5;
  beat *= 0.5 + 0.5 * uBass;
  float hexShape = smoothstep(0.5, 0.45, dist);
  vec3 col = vec3(
    hexShape * beat * 0.8,
    hexShape * beat * 0.3,
    hexShape * beat * 0.6
  );
  fragColor = vec4(col, 1.0);
}`,[{id:"scale",label:"Scale",min:2,max:10,default:4,step:.5,group:"shape"},{id:"reactivity",label:"Reactivity",min:0,max:2,default:1,step:.1,group:"audio"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"medium"),i("vj-rgb-split","RGB Split","vj","Chromatic aberration with beat-reactive splitting",["🌈"],`void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float split = uBeat * 0.02 + 0.005;
  vec2 center = vec2(0.5);
  vec2 dir = uv - center;
  float r = sin((uv.x + split) * 20.0 + uTime) * 0.5 + 0.5;
  float g = sin(uv.x * 20.0 + uTime) * 0.5 + 0.5;
  float b = sin((uv.x - split) * 20.0 + uTime) * 0.5 + 0.5;
  vec3 col = vec3(r, g, b);
  col *= 1.0 - length(dir) * 0.5;
  fragColor = vec4(col, 1.0);
}`,[{id:"split",label:"Split",min:0,max:.05,default:.01,step:.001,group:"chromatic"},{id:"pattern",label:"Pattern",min:5,max:50,default:20,step:1,group:"shape"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"low"),i("vj-barn-doors","Barn Doors","vj","Theatrical barn door light effect",["🚪"],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float door = uBass * 0.3;
  float left = smoothstep(-0.5 - door, -0.4 - door, uv.x);
  float right = smoothstep(0.5 + door, 0.4 + door, uv.x);
  float top = smoothstep(0.5 + door, 0.4 + door, uv.y);
  float bottom = smoothstep(-0.5 - door, -0.4 - door, uv.y);
  float mask = left * right * top * bottom;
  vec3 col = vec3(
    mask * (0.8 + 0.2 * sin(uTime)),
    mask * (0.6 + 0.2 * sin(uTime + 2.094)),
    mask * (0.4 + 0.2 * sin(uTime + 4.188))
  );
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"opening",label:"Opening",min:0,max:.5,default:.1,step:.01,group:"shape"},{id:"feather",label:"Feather",min:0,max:.1,default:.01,step:.005,group:"shape"}],{},[{signal:"beat",param:"scale",amount:.4,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.25,curve:"linear"}],"low"),i("geo-hexagonal","Hexagonal Grid","geometric","Hexagonal tessellation with distance-based coloring",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec2 hex = uv * 5.0;
  float hexX = hex.x * 1.732;
  float hexY = hex.y + mod(floor(hexX), 2.0) * 0.5;
  vec2 cell = vec2(floor(hexX), floor(hexY));
  vec2 center = cell + 0.5;
  float dist = length(fract(hex) - 0.5);
  float edge = smoothstep(0.5, 0.45, dist);
  float noise = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
  vec3 col = vec3(edge * noise * 0.8, edge * noise * 0.4, edge * noise * 0.6);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"scale",label:"Scale",min:2,max:15,default:5,step:.5,group:"shape"},{id:"edge",label:"Edge",min:.4,max:.5,default:.45,step:.01,group:"shape"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("geo-penrose","Penrose Tiles","geometric","Aperiodic Penrose tiling pattern",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 3.0;
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float theta = mod(angle, 3.14159 / 5.0);
  float kite = smoothstep(0.1, 0.0, abs(theta - 3.14159 / 10.0) - 0.05);
  float dart = smoothstep(0.1, 0.0, abs(theta - 3.14159 / 5.0) - 0.03);
  float pattern = kite + dart * 0.5;
  pattern *= sin(radius * 5.0 + uTime * 0.5) * 0.3 + 0.7;
  pattern *= 0.7 + 0.3 * uBass;
  vec3 col = vec3(pattern * 0.6, pattern * 0.8, pattern);
  fragColor = vec4(col, 1.0);
}`,[{id:"scale",label:"Scale",min:1,max:10,default:3,step:.5,group:"shape"},{id:"rotation",label:"Rotation",min:0,max:6.28,default:0,step:.1,group:"transform"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"high"),i("geo-sacred","Sacred Geometry","geometric","Flower of Life and sacred geometric patterns",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 3.0;
  float pattern = 0.0;
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * 3.14159 / 3.0;
    vec2 center = vec2(cos(angle), sin(angle));
    float dist = length(uv - center);
    pattern += smoothstep(0.5, 0.48, dist);
  }
  float c = smoothstep(0.5, 0.48, length(uv));
  pattern += c;
  pattern = mod(pattern, 2.0);
  vec3 col = vec3(pattern * 0.5, pattern * 0.7, pattern);
  col *= 1.0 + uMid * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"circles",label:"Circles",min:3,max:12,default:6,step:1,group:"shape"},{id:"scale",label:"Scale",min:1,max:5,default:3,step:.1,group:"transform"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("geo-wireframe","Wireframe","geometric","3D wireframe mesh with perspective",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(uv, -1.0));
  float grid = 0.0;
  for (float i = 0.0; i < 5.0; i++) {
    float z = 2.0 - i * 0.5;
    vec2 p = ro.xy + rd.xy * (z - ro.z) / rd.z;
    grid += smoothstep(0.02, 0.0, abs(fract(p.x * 2.0) - 0.5));
    grid += smoothstep(0.02, 0.0, abs(fract(p.y * 2.0) - 0.5));
  }
  vec3 col = vec3(grid * 0.3, grid * 0.6, grid);
  col *= 1.0 + uBeat * 0.4;
  fragColor = vec4(col, 1.0);
}`,[{id:"density",label:"Density",min:1,max:10,default:2,step:.5,group:"shape"},{id:"depth",label:"Depth",min:3,max:10,default:5,step:1,group:"transform"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("geo-tessellation","Tessellation","geometric","Animated triangular tessellation",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 5.0;
  float triX = uv.x * 1.732;
  float triY = uv.y + mod(floor(triX), 2.0) * 0.5;
  vec2 cell = vec2(floor(triX), floor(triY));
  vec2 local = fract(uv) - 0.5;
  float tri = abs(local.x) + abs(local.y);
  float edge = smoothstep(0.6, 0.55, tri);
  float pattern = sin(cell.x * 0.5 + cell.y * 0.5 + uTime * 2.0) * 0.5 + 0.5;
  vec3 col = vec3(edge * pattern * 0.8, edge * pattern * 0.4, edge * pattern * 0.6);
  col *= 1.0 + uBass * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"scale",label:"Scale",min:2,max:15,default:5,step:.5,group:"shape"},{id:"animation",label:"Animation",min:0,max:5,default:2,step:.1,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("geo-diamond","Diamond Grid","geometric","Diamond-shaped grid with internal patterns",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 4.0;
  vec2 grid = vec2(uv.x + uv.y, uv.y - uv.x);
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - 0.5;
  float diamond = abs(local.x) + abs(local.y);
  float edge = smoothstep(0.5, 0.45, diamond);
  float inner = smoothstep(0.3, 0.25, diamond);
  float pattern = sin(cell.x * 2.0 + cell.y * 2.0 + uTime) * 0.5 + 0.5;
  float pulse = 0.7 + 0.3 * uBeat;
  vec3 col = vec3(
    edge * pattern * 0.5 * pulse + inner * 0.3,
    edge * pattern * 0.3 * pulse + inner * 0.6,
    edge * pattern * 0.8 * pulse + inner * 0.4
  );
  fragColor = vec4(col, 1.0);
}`,[{id:"scale",label:"Scale",min:2,max:10,default:4,step:.5,group:"shape"},{id:"inner",label:"Inner Pattern",min:0,max:1,default:.5,step:.1,group:"detail"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"low"),i("geo-spiral","Spiral Grid","geometric","Logarithmic spiral tessellation",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  float spiral = angle / 6.28318 + log(radius + 0.1) * 0.5;
  float pattern = sin(spiral * 20.0 + uTime * 0.5) * 0.5 + 0.5;
  float rings = sin(radius * 10.0 - uTime) * 0.5 + 0.5;
  float combined = pattern * rings;
  vec3 col = vec3(combined * 0.8, combined * 0.4, combined * 0.9);
  col *= 1.0 / (1.0 + radius * 2.0);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"tightness",label:"Tightness",min:.1,max:1,default:.5,step:.05,group:"shape"},{id:"rings",label:"Rings",min:5,max:30,default:10,step:1,group:"detail"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("geo-truchet","Truchet Tiles","geometric","Truchet tile pattern with randomized connections",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 5.0;
  vec2 cell = floor(uv);
  vec2 local = fract(uv) - 0.5;
  float rnd = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
  float pattern = 0.0;
  if (rnd < 0.5) {
    float d = length(local - vec2(0.25, 0.25));
    pattern = smoothstep(0.3, 0.25, d);
    d = length(local - vec2(-0.25, -0.25));
    pattern += smoothstep(0.3, 0.25, d);
  } else {
    float d = length(local - vec2(0.25, -0.25));
    pattern = smoothstep(0.3, 0.25, d);
    d = length(local - vec2(-0.25, 0.25));
    pattern += smoothstep(0.3, 0.25, d);
  }
  vec3 col = vec3(pattern * 0.6, pattern * 0.8, pattern);
  col *= 1.0 + uBeat * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"scale",label:"Scale",min:2,max:15,default:5,step:.5,group:"shape"},{id:"complexity",label:"Complexity",min:1,max:4,default:2,step:1,group:"detail"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("geo-lattice","Lattice","geometric","Interlocking lattice structure with depth",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 4.0;
  float lattice = 0.0;
  lattice += smoothstep(0.1, 0.0, abs(fract(uv.x) - 0.5));
  lattice += smoothstep(0.1, 0.0, abs(fract(uv.y) - 0.5));
  vec2 offset = vec2(0.5);
  lattice += smoothstep(0.1, 0.0, abs(fract(uv.x + offset.x) - 0.5)) * 0.5;
  lattice += smoothstep(0.1, 0.0, abs(fract(uv.y + offset.y) - 0.5)) * 0.5;
  lattice = min(lattice, 1.0);
  vec3 col = vec3(lattice * 0.4, lattice * 0.7, lattice * 0.9);
  col *= 1.0 + uBass * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"thickness",label:"Thickness",min:.05,max:.2,default:.1,step:.01,group:"shape"},{id:"scale",label:"Scale",min:2,max:10,default:4,step:.5,group:"transform"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"low"),i("geo-polyhedra","Polyhedra","geometric","Rotating polyhedron wireframe projection",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(uv, -1.0));
  float edges = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    vec3 p = vec3(cos(fi * 0.5236 + t) * 1.0, sin(fi * 0.5236 + t) * 1.0, sin(fi * 1.0472 + t) * 0.5);
    float d = length(p - ro);
    edges += exp(-d * 0.5);
  }
  edges = min(edges, 1.0);
  vec3 col = vec3(edges * 0.5, edges * 0.8, edges);
  col *= 1.0 + uBeat * 0.4;
  fragColor = vec4(col, 1.0);
}`,[{id:"vertices",label:"Vertices",min:4,max:20,default:12,step:1,group:"shape"},{id:"rotation",label:"Rotation Speed",min:0,max:2,default:.3,step:.1,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"high"),i("geo-celtic","Celtic Knot","geometric","Interlacing Celtic knot pattern",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 3.0;
  float knot = 0.0;
  knot += smoothstep(0.15, 0.1, abs(sin(uv.x * 3.14159) * cos(uv.y * 3.14159)));
  knot += smoothstep(0.15, 0.1, abs(cos(uv.x * 3.14159) * sin(uv.y * 3.14159)));
  knot = min(knot, 1.0);
  float interlace = sin(uv.x * 6.28318 + uv.y * 6.28318 + uTime * 0.5) * 0.5 + 0.5;
  vec3 col = vec3(knot * interlace * 0.6, knot * interlace * 0.8, knot * 0.5);
  col *= 1.0 + uMid * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"complexity",label:"Complexity",min:1,max:5,default:3,step:1,group:"shape"},{id:"interlace",label:"Interlace",min:0,max:1,default:.5,step:.1,group:"detail"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"distortion",amount:.3,curve:"linear"},{signal:"mid",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-oil","Oil Slick","liquid","Iridescent oil slick interference patterns",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  vec2 q = vec2(sin(uv.x * 3.0 + t) * cos(uv.y * 2.0 + t * 0.7), cos(uv.x * 2.5 + t * 0.8) * sin(uv.y * 3.5 + t * 0.5));
  float f1 = sin(uv.x * 10.0 + q.x * 5.0);
  float f2 = sin(uv.y * 10.0 + q.y * 5.0);
  float f3 = sin((uv.x + uv.y) * 8.0 + t);
  vec3 col = vec3(sin(f1 * 3.14159) * 0.5 + 0.5, sin(f2 * 3.14159 + 2.094) * 0.5 + 0.5, sin(f3 * 3.14159 + 4.188) * 0.5 + 0.5);
  col = pow(col, vec3(0.8));
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"thickness",label:"Thickness",min:5,max:20,default:10,step:1,group:"detail"},{id:"distortion",label:"Distortion",min:0,max:5,default:2,step:.1,group:"distortion"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-marble","Marble","liquid","Veined marble texture with subsurface scattering",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  float vein = sin(uv.x * 20.0 + sin(uv.y * 10.0 + t) * 3.0) * 0.5 + 0.5;
  vein = pow(vein, 0.5);
  float noise = fract(sin(dot(uv * 50.0, vec2(12.9898, 78.233))) * 43758.5453);
  vein = mix(vein, noise, 0.1);
  vec3 col = vec3(vein * 0.9 + 0.1, vein * 0.85 + 0.15, vein * 0.8 + 0.2);
  col *= 1.0 + uMid * 0.15;
  fragColor = vec4(col, 1.0);
}`,[{id:"scale",label:"Scale",min:5,max:30,default:20,step:1,group:"shape"},{id:"vein",label:"Vein Intensity",min:0,max:5,default:3,step:.1,group:"detail"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"low"),i("liq-wave","Wave","liquid","Fluid wave interference with caustics",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float wave = 0.0;
  wave += sin(uv.x * 5.0 + t) * 0.3;
  wave += sin(uv.y * 5.0 + t * 0.7) * 0.3;
  wave += sin((uv.x + uv.y) * 3.0 + t * 1.3) * 0.2;
  wave += sin(length(uv) * 10.0 - t * 2.0) * 0.2;
  float caustic = pow(max(0.0, sin(wave * 10.0)), 4.0);
  vec3 col = vec3(caustic * 0.2, caustic * 0.6, caustic * 0.8);
  col *= 1.0 + uBass * 0.4;
  fragColor = vec4(col, 1.0);
}`,[{id:"speed",label:"Speed",min:.1,max:2,default:.5,step:.1,group:"animation"},{id:"complexity",label:"Complexity",min:2,max:8,default:4,step:1,group:"shape"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-plasma","Plasma","liquid","Classic plasma effect with multiple wave interference",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float v1 = sin(uv.x * 10.0 + t);
  float v2 = sin(uv.y * 10.0 + t * 0.7);
  float v3 = sin((uv.x + uv.y) * 10.0 + t * 1.3);
  float v4 = sin(length(uv) * 12.0 - t * 2.0);
  float plasma = (v1 + v2 + v3 + v4) * 0.25;
  vec3 col = vec3(sin(plasma * 3.14159) * 0.5 + 0.5, sin(plasma * 3.14159 + 2.094) * 0.5 + 0.5, sin(plasma * 3.14159 + 4.188) * 0.5 + 0.5);
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"speed",label:"Speed",min:.1,max:2,default:.3,step:.1,group:"animation"},{id:"complexity",label:"Complexity",min:2,max:8,default:4,step:1,group:"shape"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"low"),i("liq-lava","Lava","liquid","Molten lava flow with glowing cracks",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  float flow = sin(uv.x * 5.0 + sin(uv.y * 3.0 + t) * 2.0) * 0.5 + 0.5;
  flow = pow(flow, 2.0);
  float crack = 1.0 - smoothstep(0.39, 0.4, flow);
  float glow = exp(-flow * 3.0) * 0.5;
  vec3 col = vec3(flow * 0.8 + glow, flow * 0.2, flow * 0.1);
  col += crack * vec3(1.0, 0.8, 0.2) * 0.5;
  col *= 1.0 + uBass * 0.4;
  fragColor = vec4(col, 1.0);
}`,[{id:"temperature",label:"Temperature",min:.5,max:2,default:1,step:.1,group:"color"},{id:"flow",label:"Flow Speed",min:.05,max:.5,default:.1,step:.01,group:"animation"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-aurora-fluid","Aurora Fluid","liquid","Northern lights fluid simulation",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.15;
  float aurora = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float y = uv.y * (1.0 + fi * 0.2) + sin(uv.x * 2.0 + t + fi) * 0.3;
    aurora += exp(-abs(y) * 2.0) * (0.5 + 0.5 * sin(uv.x * 5.0 + t * 2.0 + fi * 1.5));
  }
  vec3 col = vec3(aurora * 0.2, aurora * 0.8, aurora * 0.6);
  col *= 1.0 + uMid * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"curtains",label:"Curtains",min:3,max:10,default:5,step:1,group:"shape"},{id:"brightness",label:"Brightness",min:.5,max:2,default:1,step:.1,group:"color"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-silk","Silk","liquid","Flowing silk fabric with subsurface scattering",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  float fold = sin(uv.x * 8.0 + sin(uv.y * 3.0 + t) * 2.0) * 0.5 + 0.5;
  fold = pow(fold, 0.3);
  float sheen = pow(max(0.0, sin(fold * 6.28318)), 8.0);
  vec3 col = vec3(fold * 0.8 + sheen * 0.2, fold * 0.7 + sheen * 0.3, fold * 0.9 + sheen * 0.1);
  col *= 1.0 + uMid * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"sheen",label:"Sheen",min:0,max:1,default:.5,step:.1,group:"material"},{id:"flow",label:"Flow",min:.1,max:1,default:.2,step:.05,group:"animation"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-chrome","Chrome","liquid","Reflective chrome surface with environment mapping",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec3 normal = normalize(vec3(uv, 1.0));
  float t = uTime * 0.3;
  vec3 reflectDir = reflect(normal, vec3(0.0, 0.0, 1.0));
  float env = sin(reflectDir.x * 5.0 + t) * sin(reflectDir.y * 5.0 + t * 0.7);
  env = env * 0.5 + 0.5;
  vec3 col = vec3(env * 0.8 + 0.2);
  col *= vec3(1.0, 0.95, 0.9);
  col += pow(env, 8.0) * 0.3;
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"smoothness",label:"Smoothness",min:0,max:1,default:.8,step:.1,group:"material"},{id:"environment",label:"Environment",min:1,max:10,default:5,step:1,group:"detail"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-abalone","Abalone","liquid","Iridescent abalone shell with nacre layers",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  float nacre = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    nacre += sin(uv.x * (10.0 + fi * 2.0) + t + fi * 1.5) * (0.5 + 0.5 * cos(uv.y * 8.0 + t * 0.5));
  }
  nacre /= 5.0;
  vec3 col = vec3(sin(nacre * 6.28318) * 0.5 + 0.5, sin(nacre * 6.28318 + 2.094) * 0.5 + 0.5, sin(nacre * 6.28318 + 4.188) * 0.5 + 0.5);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"layers",label:"Layers",min:3,max:10,default:5,step:1,group:"detail"},{id:"iridescence",label:"Iridescence",min:0,max:2,default:1,step:.1,group:"color"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-ripple","Ripple","liquid","Concentric water ripples with interference",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float ripple = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 center = vec2(sin(t * 0.3 + fi * 2.094) * 0.3, cos(t * 0.4 + fi * 2.094) * 0.3);
    float d = length(uv - center);
    ripple += sin(d * 20.0 - t * 3.0 + fi * 1.5) * exp(-d * 2.0);
  }
  ripple = ripple * 0.33 + 0.5;
  vec3 col = vec3(ripple * 0.3, ripple * 0.6, ripple * 0.9);
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"sources",label:"Sources",min:1,max:5,default:3,step:1,group:"shape"},{id:"frequency",label:"Frequency",min:10,max:40,default:20,step:1,group:"detail"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("liq-viscous","Viscous","liquid","Thick viscous fluid with slow deformation",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.05;
  vec2 q = vec2(sin(uv.x * 3.0 + t) * cos(uv.y * 2.0 + t * 0.7), cos(uv.x * 2.5 + t * 0.8) * sin(uv.y * 3.5 + t * 0.5));
  float f = sin(uv.x * 5.0 + q.x * 3.0) * cos(uv.y * 5.0 + q.y * 3.0);
  f = f * 0.5 + 0.5;
  f = pow(f, 0.5);
  vec3 col = vec3(f * 0.8 + 0.2, f * 0.6 + 0.1, f * 0.3);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"viscosity",label:"Viscosity",min:.01,max:.2,default:.05,step:.01,group:"physics"},{id:"distortion",label:"Distortion",min:1,max:5,default:3,step:.1,group:"distortion"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"low"),i("cos-wormhole","Wormhole","cosmic","Traversable wormhole with gravitational lensing",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  float dist = length(uv);
  float tunnel = 1.0 / (dist + 0.1);
  float angle = atan(uv.y, uv.x);
  vec2 tiledUv = vec2(angle / 3.14159, tunnel + t + uBass * 0.5);
  float pattern = sin(tiledUv.x * 20.0) * sin(tiledUv.y * 5.0) * 0.5 + 0.5;
  vec3 col = vec3(pattern * 0.2, pattern * 0.5, pattern * 0.8);
  col *= exp(-dist * 2.0);
  col += vec3(0.1, 0.05, 0.2) * (1.0 - exp(-dist * 3.0));
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"depth",label:"Depth",min:.5,max:3,default:1,step:.1,group:"transform"},{id:"speed",label:"Speed",min:.1,max:2,default:.5,step:.1,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"medium"),i("cos-supernova","Supernova","cosmic","Stellar explosion with expanding shockwave",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float dist = length(uv);
  float shockwave = smoothstep(0.1, 0.0, abs(dist - t * 0.5));
  float debris = sin(dist * 30.0 - t * 10.0) * exp(-dist * 3.0) * 0.5 + 0.5;
  float core = exp(-dist * 10.0) * max(0.0, 1.0 - t * 0.2);
  vec3 col = vec3(shockwave * 0.8 + debris * 0.5 + core, shockwave * 0.3 + debris * 0.2, shockwave * 0.1 + debris * 0.8 + core * 0.5);
  col *= 1.0 + uBeat * 0.5;
  fragColor = vec4(col, 1.0);
}`,[{id:"expansion",label:"Expansion",min:.1,max:1,default:.5,step:.05,group:"animation"},{id:"brightness",label:"Brightness",min:.5,max:2,default:1,step:.1,group:"color"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"medium"),i("cos-dark-matter","Dark Matter","cosmic","Dark matter web structure visualization",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.05;
  vec2 q = vec2(sin(uv.x * 2.0 + t) * cos(uv.y * 1.5 + t * 0.7), cos(uv.x * 1.8 + t * 0.8) * sin(uv.y * 2.2 + t * 0.5));
  float filament = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float d = abs(sin(uv.x * 3.0 + q.x * 2.0 + fi * 1.5) * cos(uv.y * 3.0 + q.y * 2.0 + fi * 1.5));
    filament += exp(-d * 10.0);
  }
  filament = min(filament, 1.0);
  vec3 col = vec3(filament * 0.1, filament * 0.2, filament * 0.4);
  col *= 1.0 + uBass * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"density",label:"Density",min:.1,max:1,default:.5,step:.05,group:"structure"},{id:"filaments",label:"Filaments",min:3,max:10,default:5,step:1,group:"shape"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"high"),i("cos-pulsar","Pulsar","cosmic","Rotating pulsar with lighthouse beams",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 2.0;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  float beam1 = pow(max(0.0, cos(angle - t)), 32.0);
  float beam2 = pow(max(0.0, cos(angle - t + 3.14159)), 32.0);
  float core = exp(-dist * 20.0);
  vec3 col = vec3((beam1 + beam2) * exp(-dist * 3.0) * 0.8, (beam1 + beam2) * exp(-dist * 3.0) * 0.6, (beam1 + beam2) * exp(-dist * 3.0) * 1.0);
  col += core * vec3(1.0, 0.9, 0.8);
  col *= 1.0 + uBeat * 0.4;
  fragColor = vec4(col, 1.0);
}`,[{id:"speed",label:"Rotation Speed",min:.5,max:5,default:2,step:.1,group:"animation"},{id:"beamWidth",label:"Beam Width",min:8,max:64,default:32,step:4,group:"shape"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"medium"),i("cos-web","Cosmic Web","cosmic","Large-scale structure of the universe",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.03;
  float web = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    vec2 offset = vec2(sin(t + fi * 0.785) * 0.5, cos(t * 0.7 + fi * 0.785) * 0.5);
    float d = length(uv - offset);
    web += exp(-d * 2.0) * 0.5;
  }
  web = min(web, 1.0);
  web *= 0.7 + 0.3 * uBass;
  vec3 col = vec3(web * 0.1, web * 0.3, web * 0.6);
  fragColor = vec4(col, 1.0);
}`,[{id:"nodes",label:"Nodes",min:4,max:12,default:8,step:1,group:"structure"},{id:"connections",label:"Connections",min:.5,max:3,default:1,step:.1,group:"detail"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"high"),i("cos-event-horizon","Event Horizon","cosmic","Black hole event horizon with accretion disk",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  float disk = smoothstep(0.3, 0.25, dist) - smoothstep(0.15, 0.1, dist);
  float spiral = sin(angle * 3.0 - dist * 10.0 + t * 5.0) * 0.5 + 0.5;
  disk *= spiral;
  float horizon = smoothstep(0.09, 0.1, dist);
  float lensing = 1.0 / (1.0 + dist * 5.0);
  vec3 col = vec3(disk * 0.8 + horizon, disk * 0.4 + horizon, disk * 0.2 + horizon);
  col *= lensing;
  col += vec3(0.05, 0.02, 0.1) * (1.0 - horizon);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"diskSize",label:"Disk Size",min:.1,max:.5,default:.3,step:.01,group:"shape"},{id:"spin",label:"Spin",min:.1,max:2,default:.5,step:.1,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"medium"),i("cos-neutron","Neutron Star","cosmic","Dense neutron star with magnetic field lines",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 1.5;
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);
  float field = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float fieldAngle = fi * 1.047 + t;
    float d = abs(sin(angle - fieldAngle) * dist);
    field += exp(-d * 5.0) * exp(-dist * 2.0);
  }
  float core = exp(-dist * 15.0);
  vec3 col = vec3(field * 0.5, field * 0.7, field + core);
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"fieldLines",label:"Field Lines",min:3,max:12,default:6,step:1,group:"shape"},{id:"intensity",label:"Intensity",min:.5,max:2,default:1,step:.1,group:"color"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"medium"),i("cos-comet","Comet","cosmic","Comet with ion tail and dust trail",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  vec2 cometPos = vec2(sin(t * 0.3) * 0.5, cos(t * 0.2) * 0.3);
  vec2 toComet = uv - cometPos;
  float dist = length(toComet);
  float angle = atan(toComet.y, toComet.x);
  float ionTail = exp(-abs(sin(angle)) * 5.0) * exp(-dist * 1.5);
  float dustTrail = exp(-abs(sin(angle + 0.5)) * 3.0) * exp(-dist * 1.0) * 0.5;
  float nucleus = exp(-dist * 20.0);
  vec3 col = vec3(nucleus + ionTail * 0.2, nucleus * 0.8 + ionTail * 0.5, nucleus * 0.6 + dustTrail * 0.8);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"tailLength",label:"Tail Length",min:.5,max:3,default:1.5,step:.1,group:"shape"},{id:"speed",label:"Speed",min:.1,max:1,default:.5,step:.05,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"medium"),i("cos-constellation","Constellation","cosmic","Star constellation with connecting lines",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float fi = float(i);
    vec2 star = vec2(fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0, fract(cos(fi * 311.7) * 43758.5453) * 2.0 - 1.0);
    float brightness = fract(sin(fi * 43.5) * 43758.5453);
    float twinkle = sin(t * (1.0 + brightness) + fi) * 0.3 + 0.7;
    float d = length(uv - star);
    col += exp(-d * 50.0) * twinkle * brightness * (0.7 + 0.3 * uBass);
  }
  fragColor = vec4(col, 1.0);
}`,[{id:"starCount",label:"Star Count",min:10,max:50,default:20,step:1,group:"shape"},{id:"twinkle",label:"Twinkle",min:0,max:1,default:.5,step:.1,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"medium"),i("cos-dark-energy","Dark Energy","cosmic","Accelerating expansion of the universe",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  float expansion = 1.0 + t * 0.2;
  vec2 expanded = uv * expansion;
  float density = 0.0;
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    vec2 offset = vec2(sin(t * 0.5 + fi * 0.628) * 0.3, cos(t * 0.4 + fi * 0.628) * 0.3);
    float d = length(expanded - offset);
    density += exp(-d * 3.0);
  }
  density = min(density, 1.0);
  vec3 col = vec3(density * 0.1, density * 0.05, density * 0.3);
  col *= 1.0 / expansion;
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"expansionRate",label:"Expansion Rate",min:.05,max:.5,default:.2,step:.01,group:"cosmology"},{id:"filaments",label:"Filaments",min:5,max:20,default:10,step:1,group:"structure"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"high"),i("cos-stardust","Stardust","cosmic","Interstellar dust clouds with emission nebula",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.05;
  vec2 q = vec2(sin(uv.x * 2.0 + t) * cos(uv.y * 1.5 + t * 0.7), cos(uv.x * 1.8 + t * 0.8) * sin(uv.y * 2.2 + t * 0.5));
  float dust = sin(uv.x * 3.0 + q.x * 2.0) * cos(uv.y * 3.0 + q.y * 2.0);
  dust = dust * 0.5 + 0.5;
  dust = pow(dust, 2.0);
  float emission = pow(dust, 4.0) * 0.5;
  vec3 col = vec3(dust * 0.1 + emission * 0.8, dust * 0.05 + emission * 0.3, dust * 0.15 + emission * 0.5);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"density",label:"Density",min:.5,max:3,default:1,step:.1,group:"structure"},{id:"emission",label:"Emission",min:0,max:1,default:.5,step:.1,group:"color"}],{},[{signal:"bass",param:"scale",amount:.3,curve:"log"},{signal:"mid",param:"brightness",amount:.3,curve:"linear"},{signal:"treble",param:"distortion",amount:.2,curve:"linear"}],"medium"),i("syn-grid-runner","Grid Runner","synthwave","Retro synthwave infinite grid",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 2.0;
  uv.y += 0.3;
  vec2 grid = vec2(uv.x / (uv.y + 0.5), 1.0 / (uv.y + 0.5));
  float lineX = smoothstep(0.02, 0.0, abs(fract(grid.x * 5.0) - 0.5));
  float lineY = smoothstep(0.02, 0.0, abs(fract(grid.y + t) - 0.5));
  float gridPattern = lineX + lineY;
  float horizon = exp(-uv.y * 3.0);
  vec3 col = vec3(gridPattern * horizon * 0.8, gridPattern * horizon * 0.2, gridPattern * horizon * 0.9);
  col += vec3(0.1, 0.0, 0.2) * (1.0 - horizon);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"speed",label:"Speed",min:.5,max:5,default:2,step:.1,group:"animation"},{id:"density",label:"Density",min:3,max:15,default:5,step:1,group:"shape"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("syn-chrome","Chrome Text","synthwave","Chrome metallic text effect",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float chrome = sin(uv.y * 30.0 + t) * 0.5 + 0.5;
  chrome = pow(chrome, 0.3);
  float reflection = sin(uv.x * 20.0 + t * 0.3) * 0.5 + 0.5;
  vec3 col = vec3(chrome * 0.8 + reflection * 0.2, chrome * 0.7 + reflection * 0.3, chrome * 0.9 + reflection * 0.1);
  col *= 1.0 + uBeat * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"smoothness",label:"Smoothness",min:0,max:1,default:.8,step:.1,group:"material"},{id:"reflection",label:"Reflection",min:0,max:1,default:.5,step:.1,group:"detail"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("syn-palms","Neon Palms","synthwave","Synthwave palm tree silhouettes",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  float sky = uv.y * 0.5 + 0.5;
  sky = pow(sky, 0.5);
  vec3 col = vec3(sky * 0.2, sky * 0.05, sky * 0.3);
  float sun = smoothstep(0.3, 0.29, length(uv - vec2(0.0, 0.3)));
  col += sun * vec3(1.0, 0.3, 0.5);
  float palm = smoothstep(0.02, 0.0, abs(uv.x - sin(uv.y * 5.0 + t) * 0.1 - 0.5));
  palm *= step(uv.y, 0.0);
  col = mix(col, vec3(0.0), palm);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"sunSize",label:"Sun Size",min:.1,max:.5,default:.3,step:.01,group:"shape"},{id:"palmCount",label:"Palm Count",min:1,max:5,default:2,step:1,group:"shape"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("syn-sunset","Sunset","synthwave","Retro sunset gradient with scanlines",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float gradient = uv.y * 0.5 + 0.5;
  vec3 col = vec3(gradient * 0.8 + 0.2, gradient * 0.3 + 0.1, gradient * 0.5 + 0.3);
  float sun = smoothstep(0.35, 0.34, length(uv - vec2(0.0, 0.1)));
  col += sun * vec3(1.0, 0.5, 0.3);
  float scanline = sin(uv.y * 100.0) * 0.03;
  col -= scanline;
  col *= 1.0 + uBeat * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"scanlines",label:"Scanlines",min:0,max:.1,default:.03,step:.01,group:"crt"},{id:"warmth",label:"Warmth",min:.5,max:2,default:1,step:.1,group:"color"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("syn-cassette","Cassette","synthwave","Retro cassette tape animation",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 2.0;
  float tape = smoothstep(0.3, 0.29, length(uv - vec2(-0.15, 0.0)));
  tape += smoothstep(0.3, 0.29, length(uv - vec2(0.15, 0.0)));
  float reel = smoothstep(0.1, 0.09, length(uv - vec2(-0.15, 0.0)));
  reel += smoothstep(0.1, 0.09, length(uv - vec2(0.15, 0.0)));
  float spin = sin(atan(uv.y, uv.x + 0.15) * 3.0 + t) * 0.5 + 0.5;
  vec3 col = vec3(tape * 0.3, tape * 0.3, tape * 0.3);
  col += reel * spin * vec3(0.5, 0.3, 0.2);
  col += smoothstep(0.5, 0.49, abs(uv.y)) * 0.1;
  col *= 0.7 + 0.3 * uBeat;
  fragColor = vec4(col, 1.0);
}`,[{id:"speed",label:"Reel Speed",min:.5,max:4,default:2,step:.1,group:"animation"},{id:"glow",label:"Glow",min:0,max:1,default:.5,step:.1,group:"color"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("syn-laser","Laser Grid","synthwave","Synthwave laser grid floor",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 2.0;
  uv.y += 0.3;
  if (uv.y < 0.0) {
    vec2 grid = vec2(uv.x / (-uv.y + 0.1), t / (-uv.y + 0.1));
    float lineX = smoothstep(0.05, 0.0, abs(fract(grid.x * 2.0) - 0.5));
    float lineY = smoothstep(0.05, 0.0, abs(fract(grid.y * 0.5) - 0.5));
    float gridPattern = lineX + lineY;
    float fade = exp(uv.y * 3.0);
    vec3 col = vec3(gridPattern * fade * 0.9, gridPattern * fade * 0.1, gridPattern * fade * 0.8);
    col *= 0.7 + 0.3 * uBass;
    fragColor = vec4(col, 1.0);
  } else {
    vec3 col = vec3(0.05, 0.0, 0.1);
    fragColor = vec4(col, 1.0);
  }
}`,[{id:"speed",label:"Speed",min:.5,max:5,default:2,step:.1,group:"animation"},{id:"perspective",label:"Perspective",min:.05,max:.3,default:.1,step:.01,group:"transform"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("syn-vhs","VHS Glitch","synthwave","VHS tape distortion with tracking errors",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  float glitch = step(0.98, fract(sin(floor(uv.y * 20.0) * 127.1) * 43758.5453));
  float offset = glitch * sin(t * 100.0) * 0.05;
  vec2 distortedUv = uv + vec2(offset, 0.0);
  float scanline = sin(uv.y * 200.0) * 0.02;
  vec3 col = vec3(sin(distortedUv.x * 10.0 + t) * 0.5 + 0.5, sin(distortedUv.x * 10.0 + t + 2.094) * 0.5 + 0.5, sin(distortedUv.x * 10.0 + t + 4.188) * 0.5 + 0.5);
  col -= scanline;
  col += filmGrain * fract(sin(dot(uv * t, vec2(12.9898, 78.233))) * 43758.5453);
  col *= 1.0 + glitch * 0.5;
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"tracking",label:"Tracking",min:0,max:1,default:.5,step:.1,group:"glitch"},{id:"filmGrain",label:"Noise Grain",min:0,max:.2,default:.05,step:.01,group:"glitch"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("syn-outrun","Outrun","synthwave","Retrowave car dashboard view",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float dashboard = smoothstep(0.3, 0.29, uv.y);
  vec3 col = vec3(0.0);
  col += dashboard * vec3(0.1, 0.0, 0.2);
  float speed = sin(uv.x * 20.0 + t * 10.0) * 0.5 + 0.5;
  speed *= exp(-abs(uv.x) * 3.0);
  col += speed * vec3(0.0, 1.0, 0.8) * 0.3;
  float horizon = smoothstep(0.3, 0.31, uv.y);
  col += horizon * vec3(0.3, 0.0, 0.5);
  float sun = smoothstep(0.15, 0.14, length(uv - vec2(0.0, 0.5)));
  col += sun * vec3(1.0, 0.3, 0.5) * 0.5;
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"speed",label:"Speed",min:5,max:30,default:10,step:1,group:"animation"},{id:"glow",label:"Glow",min:0,max:1,default:.5,step:.1,group:"color"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("syn-neon-sign","Neon Sign","synthwave","Glowing neon sign with flicker",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  float flicker = 1.0 - step(0.95, fract(sin(floor(t * 10.0) * 127.1) * 43758.5453)) * 0.3;
  float glow = sin(uv.x * 10.0 + t) * 0.5 + 0.5;
  glow *= exp(-abs(uv.y) * 3.0);
  float core = smoothstep(0.02, 0.0, abs(uv.y)) * glow;
  vec3 col = vec3(glow * 0.8 * flicker, glow * 0.2 * flicker, glow * 0.9 * flicker);
  col += core * vec3(1.0, 0.5, 1.0) * 0.5;
  col *= 0.7 + 0.3 * uBeat;
  fragColor = vec4(col, 1.0);
}`,[{id:"flicker",label:"Flicker",min:0,max:1,default:.5,step:.1,group:"animation"},{id:"glow",label:"Glow",min:.5,max:2,default:1,step:.1,group:"color"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("syn-chrome-sphere","Chrome Sphere","synthwave","Reflective chrome sphere with environment",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float dist = length(uv);
  float sphere = smoothstep(0.5, 0.49, dist);
  vec3 normal = normalize(vec3(uv, sqrt(max(0.0, 1.0 - dist * dist))));
  float t = uTime * 0.3;
  float env = sin(normal.x * 5.0 + t) * sin(normal.y * 5.0 + t * 0.7);
  env = env * 0.5 + 0.5;
  vec3 col = vec3(env * 0.8 + 0.2);
  col *= sphere;
  col += exp(-dist * 2.0) * 0.1;
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"smoothness",label:"Smoothness",min:0,max:1,default:.9,step:.1,group:"material"},{id:"environment",label:"Environment",min:1,max:10,default:5,step:1,group:"detail"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("syn-80s-tv","80s TV","synthwave","Retro 80s television static and test pattern",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  float bars = step(0.5, fract(uv.y * 10.0));
  vec3 col = vec3(filmGrain * fract(sin(dot(uv * t, vec2(12.9898, 78.233))) * 43758.5453));
  col += bars * vec3(step(0.8, fract(uv.x * 7.0 + t)), step(0.6, fract(uv.x * 7.0 + t + 0.2)), step(0.4, fract(uv.x * 7.0 + t + 0.4))) * 0.5;
  col *= 1.0 + uBeat * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"filmGrain",label:"Noise Grain",min:0,max:.5,default:.3,step:.05,group:"glitch"},{id:"pattern",label:"Pattern",min:0,max:1,default:.5,step:.1,group:"detail"}],{},[{signal:"beat",param:"scale",amount:.5,curve:"log"},{signal:"bass",param:"distortion",amount:.3,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"low"),i("abs-moire","Moiré","abstract","Interference moiré pattern with rotation",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  float angle = t * 0.1;
  vec2 rotUv = vec2(uv.x * cos(angle) - uv.y * sin(angle), uv.x * sin(angle) + uv.y * cos(angle));
  float f1 = sin(rotUv.x * 30.0) * sin(rotUv.y * 30.0);
  float f2 = sin(uv.x * 30.0) * sin(uv.y * 30.0);
  float moire = f1 * f2;
  moire = moire * 0.5 + 0.5;
  vec3 col = vec3(moire * 0.8, moire * 0.6, moire * 0.9);
  col *= 1.0 + uBass * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"frequency",label:"Frequency",min:10,max:50,default:30,step:1,group:"shape"},{id:"rotation",label:"Rotation",min:0,max:1,default:.1,step:.01,group:"animation"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"low"),i("abs-opart","Op Art","abstract","Optical art illusion with moving patterns",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float pattern = sin(uv.x * 20.0 + sin(uv.y * 10.0 + t) * 3.0);
  pattern *= cos(uv.y * 20.0 + cos(uv.x * 10.0 + t) * 3.0);
  pattern = pattern * 0.5 + 0.5;
  float circle = sin(length(uv) * 30.0 - t * 5.0) * 0.5 + 0.5;
  float combined = pattern * circle;
  vec3 col = vec3(combined);
  col *= 1.0 + uBeat * 0.4;
  fragColor = vec4(col, 1.0);
}`,[{id:"frequency",label:"Frequency",min:10,max:40,default:20,step:1,group:"shape"},{id:"distortion",label:"Distortion",min:0,max:5,default:3,step:.1,group:"distortion"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"low"),i("abs-glitch-art","Glitch Art","abstract","Abstract glitch art with data corruption",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  float block = floor(uv.x * 10.0);
  float rnd = fract(sin(block * 127.1 + floor(t * 5.0)) * 43758.5453);
  float offset = rnd * 0.2 * step(0.8, rnd);
  vec2 corruptedUv = uv + vec2(offset, 0.0);
  float pattern = sin(corruptedUv.x * 30.0) * cos(corruptedUv.y * 30.0);
  pattern = pattern * 0.5 + 0.5;
  vec3 col = vec3(pattern * (1.0 - offset * 2.0), pattern * 0.5, pattern * (1.0 + offset));
  col *= 1.0 + uBeat * 0.5;
  fragColor = vec4(col, 1.0);
}`,[{id:"corruption",label:"Corruption",min:0,max:1,default:.5,step:.1,group:"glitch"},{id:"blockSize",label:"Block Size",min:5,max:20,default:10,step:1,group:"shape"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"low"),i("abs-smoke","Abstract Smoke","abstract","Wispy abstract smoke tendrils",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  vec2 q = vec2(sin(uv.x * 2.0 + t) * cos(uv.y * 1.5 + t * 0.7), cos(uv.x * 1.8 + t * 0.8) * sin(uv.y * 2.2 + t * 0.5));
  float smoke = 0.0;
  smoke += sin(uv.x * 3.0 + q.x * 2.0) * 0.5 + 0.5;
  smoke *= cos(uv.y * 3.0 + q.y * 2.0) * 0.5 + 0.5;
  smoke = pow(smoke, 0.5);
  vec3 col = vec3(smoke * 0.6, smoke * 0.5, smoke * 0.7);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"density",label:"Density",min:.5,max:3,default:1,step:.1,group:"structure"},{id:"flow",label:"Flow",min:.05,max:.3,default:.1,step:.01,group:"animation"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"low"),i("abs-geode","Geode","abstract","Cross-section of a crystal geode",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float dist = length(uv);
  float layers = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float radius = 0.1 + fi * 0.05;
    float thickness = 0.02;
    layers += smoothstep(thickness, 0.0, abs(dist - radius));
  }
  float crystal = sin(atan(uv.y, uv.x) * 12.0 + dist * 10.0) * 0.5 + 0.5;
  crystal *= layers;
  vec3 col = vec3(crystal * 0.6, crystal * 0.4, crystal * 0.8);
  col *= 1.0 + uMid * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"layers",label:"Layers",min:4,max:15,default:8,step:1,group:"shape"},{id:"crystal",label:"Crystal Detail",min:4,max:20,default:12,step:1,group:"detail"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("abs-topographic","Topographic","abstract","Topographic map contour lines",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.05;
  float elevation = sin(uv.x * 3.0 + sin(uv.y * 2.0 + t) * 2.0) * 0.5 + 0.5;
  elevation *= cos(uv.y * 3.0 + cos(uv.x * 2.0 + t) * 2.0) * 0.5 + 0.5;
  float contour = sin(elevation * 30.0) * 0.5 + 0.5;
  contour = smoothstep(0.4, 0.5, contour);
  vec3 col = vec3(contour * 0.3, contour * 0.6, contour * 0.2);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"contours",label:"Contour Density",min:10,max:40,default:30,step:1,group:"detail"},{id:"elevation",label:"Elevation",min:1,max:5,default:3,step:.1,group:"shape"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"low"),i("abs-crystallize","Crystallize","abstract","Crystallization pattern growth",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float crystal = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float angle = fi * 1.047;
    vec2 dir = vec2(cos(angle), sin(angle));
    float d = abs(dot(uv, vec2(-dir.y, dir.x)));
    crystal += smoothstep(0.1, 0.0, d - t * 0.1 * (1.0 + fi * 0.1));
  }
  crystal = min(crystal, 1.0);
  vec3 col = vec3(crystal * 0.7, crystal * 0.8, crystal * 1.0);
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"branches",label:"Branches",min:3,max:12,default:6,step:1,group:"shape"},{id:"growth",label:"Growth",min:.05,max:.3,default:.1,step:.01,group:"animation"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("abs-halftone","Halftone","abstract","Dot halftone pattern with variable size",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  vec2 grid = uv * 20.0;
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - 0.5;
  float brightness = sin(uv.x * 5.0 + t) * cos(uv.y * 5.0 + t * 0.7) * 0.5 + 0.5;
  float dotSize = brightness * 0.4;
  float d = length(local);
  float dotV = smoothstep(dotSize, dotSize - 0.05, d);
  vec3 col = vec3(dotV * 0.8);
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"gridSize",label:"Grid Size",min:10,max:40,default:20,step:1,group:"shape"},{id:"contrast",label:"Contrast",min:.5,max:2,default:1,step:.1,group:"color"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"low"),i("abs-liquid-chrome","Liquid Chrome","abstract","Flowing liquid chrome with reflections",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  vec2 q = vec2(sin(uv.x * 3.0 + t) * cos(uv.y * 2.0 + t * 0.7), cos(uv.x * 2.5 + t * 0.8) * sin(uv.y * 3.5 + t * 0.5));
  float chrome = sin(uv.x * 10.0 + q.x * 5.0) * cos(uv.y * 10.0 + q.y * 5.0);
  chrome = chrome * 0.5 + 0.5;
  chrome = pow(chrome, 0.3);
  float reflection = sin(q.x * 20.0 + q.y * 20.0) * 0.5 + 0.5;
  vec3 col = vec3(chrome * 0.8 + reflection * 0.2, chrome * 0.7 + reflection * 0.3, chrome * 0.9 + reflection * 0.1);
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"smoothness",label:"Smoothness",min:0,max:1,default:.8,step:.1,group:"material"},{id:"distortion",label:"Distortion",min:0,max:5,default:2,step:.1,group:"distortion"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("part-fireflies","Fireflies","particle","Glowing particles with soft trails",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    vec2 pos = vec2(sin(t * 0.3 + fi * 1.234) * 0.8, cos(t * 0.2 + fi * 2.345) * 0.6);
    float brightness = sin(t * 2.0 + fi * 3.456) * 0.5 + 0.5;
    float d = length(uv - pos);
    col += exp(-d * 10.0) * brightness * vec3(0.8, 1.0, 0.4);
  }
  col *= 1.0 + uBeat * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"count",label:"Count",min:10,max:60,default:30,step:1,group:"particle"},{id:"glow",label:"Glow",min:5,max:20,default:10,step:1,group:"material"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("part-rain","Rain","particle","Falling rain drops with splashes",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 3.0;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    float x = fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0;
    float speed = 0.5 + fract(sin(fi * 311.7) * 43758.5453) * 0.5;
    float y = fract(t * speed + fi * 0.1) * 2.0 - 1.0;
    float drop = smoothstep(0.02, 0.0, abs(uv.x - x)) * smoothstep(0.05, 0.0, abs(uv.y - y));
    col += drop * vec3(0.4, 0.6, 0.9) * 0.5;
  }
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"count",label:"Count",min:20,max:80,default:40,step:1,group:"particle"},{id:"speed",label:"Speed",min:1,max:5,default:3,step:.5,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("part-snow","Snow","particle","Gentle snowfall with wind drift",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 50; i++) {
    float fi = float(i);
    float x = fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0;
    float size = 0.01 + fract(sin(fi * 311.7) * 43758.5453) * 0.02;
    float spd = 0.2 + fract(sin(fi * 543.2) * 43758.5453) * 0.3;
    float drift = sin(t * 0.5 + fi * 0.1) * 0.3 + uBass * 0.1;
    float y = fract(t * spd + fi * 0.05) * 2.0 - 1.0;
    float d = length(uv - vec2(x + drift, y));
    col += exp(-d / size * 10.0) * vec3(0.9, 0.95, 1.0) * 0.3;
  }
  fragColor = vec4(col, 1.0);
}`,[{id:"count",label:"Count",min:20,max:100,default:50,step:1,group:"particle"},{id:"wind",label:"Wind",min:0,max:1,default:.3,step:.05,group:"physics"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("part-confetti","Confetti","particle","Falling confetti pieces with rotation",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    float x = fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0;
    float speed = 0.3 + fract(sin(fi * 311.7) * 43758.5453) * 0.4;
    float y = fract(t * speed + fi * 0.1) * 2.0 - 1.0;
    float rot = t * (1.0 + fract(fi * 0.5)) + fi;
    float confetti = smoothstep(0.03, 0.0, abs(uv.x - x - sin(rot) * 0.1)) * smoothstep(0.02, 0.0, abs(uv.y - y));
    vec3 c = vec3(sin(fi * 2.0) * 0.5 + 0.5, sin(fi * 2.0 + 2.094) * 0.5 + 0.5, sin(fi * 2.0 + 4.188) * 0.5 + 0.5);
    col += confetti * c;
  }
  col *= 1.0 + uBeat * 0.5;
  fragColor = vec4(col, 1.0);
}`,[{id:"count",label:"Count",min:10,max:60,default:30,step:1,group:"particle"},{id:"gravity",label:"Gravity",min:.1,max:1,default:.3,step:.05,group:"physics"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("part-sparks","Sparks","particle","Flying sparks with motion blur",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 25; i++) {
    float fi = float(i);
    float angle = fract(sin(fi * 127.1) * 43758.5453) * 6.28;
    float speed = 0.5 + fract(sin(fi * 311.7) * 43758.5453) * 1.0;
    float life = fract(t * speed * 0.5 + fi * 0.2);
    vec2 dir = vec2(cos(angle), sin(angle));
    vec2 pos = dir * life * 0.8;
    float spark = exp(-life * 5.0) * smoothstep(0.03, 0.0, length(uv - pos));
    vec3 c = vec3(1.0, 0.8 - life * 0.5, 0.2 - life * 0.2);
    col += spark * c;
  }
  col *= 1.0 + uBeat * 0.6;
  fragColor = vec4(col, 1.0);
}`,[{id:"count",label:"Count",min:10,max:50,default:25,step:1,group:"particle"},{id:"speed",label:"Speed",min:.2,max:2,default:1,step:.1,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("part-magnetic","Magnetic","particle","Particles following magnetic field lines",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    float angle = fi * 2.399 + t * 0.3;
    float r = 0.2 + sin(fi * 0.5 + t) * 0.1;
    vec2 pos = vec2(cos(angle) * r, sin(angle) * r);
    float field = sin(atan(uv.y - pos.y, uv.x - pos.x) * 3.0 + t) * 0.5 + 0.5;
    float d = length(uv - pos);
    col += exp(-d * 8.0) * field * vec3(0.5, 0.8, 1.0) * 0.3;
  }
  col *= 1.0 + uBass * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"particles",label:"Particles",min:10,max:60,default:30,step:1,group:"particle"},{id:"field",label:"Field Strength",min:1,max:5,default:3,step:.5,group:"physics"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"high"),i("part-meteor","Meteor Shower","particle","Meteors streaking across the sky",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 15; i++) {
    float fi = float(i);
    float startT = fract(fi * 0.137) * 5.0;
    float life = mod(t - startT, 5.0) / 5.0;
    vec2 dir = normalize(vec2(-0.7, -0.3));
    vec2 start = vec2(fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0, 1.0);
    vec2 pos = start + dir * life * 2.0;
    float trail = smoothstep(0.1, 0.0, length(uv - pos)) * exp(-life * 3.0);
    vec3 c = mix(vec3(1.0, 0.9, 0.7), vec3(0.3, 0.5, 1.0), life);
    col += trail * c;
  }
  col *= 1.0 + uBeat * 0.4;
  fragColor = vec4(col, 1.0);
}`,[{id:"count",label:"Count",min:5,max:30,default:15,step:1,group:"particle"},{id:"speed",label:"Speed",min:.5,max:3,default:1,step:.1,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("part-bubble","Bubbles","particle","Rising soap bubbles with iridescence",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float fi = float(i);
    float x = fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0;
    float speed = 0.2 + fract(sin(fi * 311.7) * 43758.5453) * 0.3;
    float y = fract(t * speed + fi * 0.1) * 2.0 - 1.0;
    float size = 0.05 + fract(sin(fi * 543.2) * 43758.5453) * 0.05;
    float d = length(uv - vec2(x, y));
    float bubble = smoothstep(size, size - 0.01, d) - smoothstep(size - 0.01, size - 0.02, d);
    float iridescent = sin(d * 50.0 + t * 2.0) * 0.5 + 0.5;
    vec3 c = vec3(iridescent * 0.5 + 0.5, iridescent * 0.3 + 0.7, 1.0) * bubble;
    col += c * 0.5;
  }
  col *= 1.0 + uBass * 0.2;
  fragColor = vec4(col, 1.0);
}`,[{id:"count",label:"Count",min:5,max:40,default:20,step:1,group:"particle"},{id:"iridescence",label:"Iridescence",min:0,max:2,default:1,step:.1,group:"color"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("part-aurora-particles","Aurora Particles","particle","Particles dancing in aurora borealis",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  vec3 col = vec3(0.0);
  for (int i = 0; i < 40; i++) {
    float fi = float(i);
    float x = fract(sin(fi * 127.1) * 43758.5453) * 2.0 - 1.0;
    float baseY = fract(sin(fi * 311.7) * 43758.5453) * 0.5;
    float y = baseY + sin(x * 3.0 + t + fi * 0.5) * 0.3;
    float brightness = sin(t * 2.0 + fi * 1.234) * 0.5 + 0.5;
    float d = length(uv - vec2(x, y));
    vec3 c = mix(vec3(0.1, 0.8, 0.4), vec3(0.2, 0.4, 0.9), sin(fi * 0.5) * 0.5 + 0.5);
    col += exp(-d * 12.0) * brightness * c * 0.3;
  }
  col *= 1.0 + uMid * 0.3;
  fragColor = vec4(col, 1.0);
}`,[{id:"count",label:"Count",min:20,max:80,default:40,step:1,group:"particle"},{id:"wave",label:"Wave Amplitude",min:.1,max:.6,default:.3,step:.05,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"intensity",amount:.4,curve:"log"},{signal:"treble",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("min-pulse","Pulse","minimal","Gentle breathing pulse circle",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float pulse = sin(t) * 0.5 + 0.5 + uBeat * 0.3;
  float d = length(uv);
  float circle = smoothstep(0.3 + pulse * 0.1, 0.29 + pulse * 0.1, d);
  float ring = smoothstep(0.01, 0.0, abs(d - 0.3 - pulse * 0.1));
  vec3 col = vec3(circle * 0.1 + ring * 0.3);
  fragColor = vec4(col, 1.0);
}`,[{id:"speed",label:"Speed",min:.1,max:2,default:.5,step:.1,group:"animation"},{id:"size",label:"Size",min:.1,max:.5,default:.3,step:.01,group:"shape"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-aurora","Aurora","minimal","Soft minimal aurora gradient",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  float aurora = sin(uv.y * 3.0 + sin(uv.x * 2.0 + t) * 2.0) * 0.5 + 0.5;
  aurora = pow(aurora, 0.5);
  vec3 col = vec3(aurora * 0.1, aurora * 0.4, aurora * 0.3);
  col *= 1.0 - length(uv) * 0.3;
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"flow",label:"Flow",min:.05,max:.3,default:.1,step:.01,group:"animation"},{id:"brightness",label:"Brightness",min:.2,max:1,default:.5,step:.1,group:"color"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-dot","Dot Grid","minimal","Minimal dot grid pattern",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  vec2 grid = uv * 10.0;
  vec2 local = fract(grid) - 0.5;
  float d = length(local);
  float dotV = smoothstep(0.15, 0.1, d);
  float alpha = 1.0 - length(uv) * 0.5;
  vec3 col = vec3(dotV * 0.2 * alpha * (0.7 + 0.3 * uBeat));
  fragColor = vec4(col, 1.0);
}`,[{id:"density",label:"Density",min:5,max:20,default:10,step:1,group:"shape"},{id:"dotSize",label:"Dot Size",min:.05,max:.25,default:.15,step:.01,group:"shape"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-horizon","Horizon","minimal","Minimal horizon line with gradient sky",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float horizon = smoothstep(0.01, 0.0, abs(uv.y));
  float sky = max(0.0, uv.y) * 0.15;
  float ground = max(0.0, -uv.y) * 0.05;
  vec3 col = vec3(sky + ground + horizon * (0.4 + 0.2 * uBeat));
  fragColor = vec4(col, 1.0);
}`,[{id:"skyColor",label:"Sky Brightness",min:.05,max:.3,default:.15,step:.01,group:"color"},{id:"lineWidth",label:"Line Width",min:.005,max:.05,default:.01,step:.005,group:"shape"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-gradient","Gradient","minimal","Smooth radial gradient with subtle animation",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  float d = length(uv);
  float gradient = exp(-d * 2.0);
  float shift = sin(t) * 0.05;
  vec2 offsetUv = uv + vec2(shift, shift * 0.5);
  float shifted = exp(-length(offsetUv) * 2.0);
  vec3 col = vec3(gradient * 0.15 + shifted * 0.05);
  col *= 0.7 + 0.3 * uBass;
  fragColor = vec4(col, 1.0);
}`,[{id:"spread",label:"Spread",min:.5,max:4,default:2,step:.1,group:"shape"},{id:"animation",label:"Animation",min:0,max:.3,default:.1,step:.01,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-cross","Cross","minimal","Minimal animated crosshair",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float h = smoothstep(0.005, 0.0, abs(uv.y)) * smoothstep(0.3, 0.0, abs(uv.x));
  float v = smoothstep(0.005, 0.0, abs(uv.x)) * smoothstep(0.3, 0.0, abs(uv.y));
  float cross = h + v;
  float pulse = sin(t) * 0.3 + 0.7 + uBeat * 0.2;
  vec3 col = vec3(cross * 0.2 * pulse);
  fragColor = vec4(col, 1.0);
}`,[{id:"size",label:"Size",min:.1,max:.5,default:.3,step:.01,group:"shape"},{id:"thickness",label:"Thickness",min:.001,max:.01,default:.005,step:.001,group:"shape"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-wave","Wave Line","minimal","Single oscillating wave line",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime;
  float wave = sin(uv.x * 6.28318 * 3.0 + t * 2.0) * (0.1 + uBass * 0.05);
  float line = smoothstep(0.005, 0.0, abs(uv.y - wave));
  float fade = smoothstep(1.0, 0.0, abs(uv.x));
  vec3 col = vec3(line * 0.2 * fade);
  fragColor = vec4(col, 1.0);
}`,[{id:"frequency",label:"Frequency",min:1,max:6,default:3,step:.5,group:"shape"},{id:"amplitude",label:"Amplitude",min:.02,max:.2,default:.1,step:.01,group:"shape"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-concentric","Concentric","minimal","Expanding concentric circles",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.5;
  float d = length(uv);
  float rings = sin(d * 20.0 - t * 2.0) * 0.5 + 0.5;
  rings = smoothstep(0.4, 0.5, rings);
  float fade = exp(-d * 2.0);
  vec3 col = vec3(rings * 0.15 * fade * (0.7 + 0.3 * uBeat));
  fragColor = vec4(col, 1.0);
}`,[{id:"rings",label:"Ring Count",min:5,max:25,default:10,step:1,group:"shape"},{id:"speed",label:"Speed",min:.1,max:2,default:.5,step:.1,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-rotate","Rotate","minimal","Slowly rotating minimal line",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.2;
  float angle = t + uBass * 0.2;
  vec2 rotUv = vec2(uv.x * cos(angle) - uv.y * sin(angle), uv.x * sin(angle) + uv.y * cos(angle));
  float line = smoothstep(0.003, 0.0, abs(rotUv.x)) * smoothstep(lineLen, 0.0, abs(rotUv.y));
  float fade = 1.0 - length(uv) * 0.8;
  vec3 col = vec3(line * 0.2 * max(0.0, fade));
  fragColor = vec4(col, 1.0);
}`,[{id:"speed",label:"Speed",min:.05,max:1,default:.2,step:.05,group:"animation"},{id:"lineLen",label:"Length",min:.2,max:.8,default:.5,step:.05,group:"shape"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low",`uniform float lineLen;
`),i("min-fade","Fade","minimal","Smooth fade in/out with minimal shape",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float fade = max(sin(t) * 0.5 + 0.5 + uBeat * 0.2, 0.30);
  float d = length(uv);
  float shape = smoothstep(0.2 + fade * 0.1, 0.19 + fade * 0.1, d);
  vec3 col = vec3(shape * 0.15 * fade + 0.015);
  fragColor = vec4(col, 1.0);
}`,[{id:"speed",label:"Speed",min:.1,max:1,default:.3,step:.05,group:"animation"},{id:"brightness",label:"Brightness",min:.05,max:.3,default:.15,step:.01,group:"color"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-grid","Minimal Grid","minimal","Clean minimal grid with subtle animation",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.1;
  vec2 grid = uv * 8.0;
  float lineX = smoothstep(0.02, 0.0, abs(fract(grid.x) - 0.5));
  float lineY = smoothstep(0.02, 0.0, abs(fract(grid.y) - 0.5));
  float lines = lineX + lineY;
  float fade = 1.0 - length(uv) * 0.6;
  float pulse = sin(t) * 0.1 + 0.9 + uBass * 0.1;
  vec3 col = vec3(lines * 0.1 * fade * pulse);
  fragColor = vec4(col, 1.0);
}`,[{id:"density",label:"Density",min:4,max:16,default:8,step:1,group:"shape"},{id:"animation",label:"Animation",min:0,max:.5,default:.1,step:.05,group:"animation"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("min-dot-circle","Dot Circle","minimal","Ring of dots with minimal animation",[],`void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  float t = uTime * 0.3;
  float d = length(uv);
  float ring = smoothstep(0.25, 0.24, abs(d - 0.3));
  float angle = atan(uv.y, uv.x);
  float dots = sin(angle * 12.0) * 0.5 + 0.5;
  dots = smoothstep(0.3, 0.7, dots);
  float shape = ring * dots;
  float fade = 1.0 - d * 0.5;
  vec3 col = vec3(shape * 0.15 * max(0.0, fade) * (0.7 + 0.3 * uBeat));
  fragColor = vec4(col, 1.0);
}`,[{id:"dotCount",label:"Dot Count",min:6,max:24,default:12,step:1,group:"shape"},{id:"radius",label:"Radius",min:.1,max:.5,default:.3,step:.01,group:"transform"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"low"),i("oss-iq-warp","Domain Warp","abstract","Double-warped FBM nebula by Inigo Quilez (MIT)",["iq","warp","fbm","nebula","organic"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float t = uTime * 0.15 * speed;
      vec2 q = vec2(fbm(uv + t*0.1), fbm(uv + vec2(5.2,1.3) + t*0.12));
      vec2 r = vec2(fbm(uv + 4.0*q + vec2(1.7,9.2) + t*0.15), fbm(uv + 4.0*q + vec2(8.3,2.8) + t*0.18));
      float f = fbm(uv + 4.0*r);
      vec3 col = mix(vec3(0.1,0.2,0.4), vec3(0.8,0.3,0.1), clamp(f*f*4.0, 0.0, 1.0));
      col = mix(col, vec3(0.9,0.9,0.6), clamp(length(q), 0.0, 1.0));
      col = mix(col, vec3(0.1,0.3,0.5), clamp(length(r.x), 0.0, 1.0));
      f = f*f*f*(f*(f*6.0-15.0)+10.0);
      col *= f;
      col *= 0.5 + 0.5*cos(6.28*(f*0.5 + uTime*0.1 + vec3(0.0,0.1,0.2) + uBass*0.3));
      col *= intensity * (0.7 + 0.5*uBeat);
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("oss-curl-fluid","Curl Fluid","liquid","Audio-reactive curl noise fluid simulation",["fluid","curl","noise","organic","flow"],`
    vec2 curlNoise(vec2 p) {
      float e = 0.01;
      float n1 = noise(p + vec2(0.0, e));
      float n2 = noise(p - vec2(0.0, e));
      float a = (n1 - n2) / (2.0*e);
      n1 = noise(p + vec2(e, 0.0));
      n2 = noise(p - vec2(e, 0.0));
      float b = (n1 - n2) / (2.0*e);
      return vec2(a, -b);
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float t = uTime * 0.3 * speed;
      vec2 p = uv * 2.0;
      vec2 q = vec2(0.0);
      for(int i = 0; i < 6; i++) {
        q += curlNoise(p + t*0.5 + float(i)*0.5) * 0.3 * (1.0 + uBass*0.5);
      }
      float f = fbm(p + q*2.0);
      vec3 col = 0.5 + 0.5*cos(6.28*(f*2.0 + vec3(0.0,0.1,0.2) + uTime*0.05));
      col *= 1.0 - 0.5*length(q);
      col *= intensity * (0.6 + 0.6*uBeat);
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("oss-kaleidoscope","Kaleidoscope","geometric","Audio-reactive kaleidoscope folding pattern",["kaleidoscope","mirror","geometric","folding"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      vec2 p = uv;
      float t = uTime * speed * 0.5 + uBeat * 0.3;
      float angle = 3.14159 / (3.0 + uBass);
      for(int i = 0; i < 7; i++) {
        p = vec2(sin(t)*p.x + cos(t)*p.y, sin(t)*p.y - cos(t)*p.x);
        t += angle;
        p = abs(mod(p, 2.0) - 1.0);
      }
      float f = fbm(p*3.0 + uTime*0.1);
      vec3 col = 0.5 + 0.5*cos(6.28*(f + vec3(0.0,0.33,0.67) + uTime*0.05 + uBass*0.4));
      col *= intensity * (0.8 + 0.4*uBeat);
      fragColor = vec4(col, 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"beat",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),i("oss-voronoi-pulse","Voronoi Pulse","geometric","Audio-reactive smooth voronoi cells with pulse animation",["voronoi","cells","geometric","pulse","iq"],`
    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
      return -1.0 + 2.0*fract(sin(p)*43758.5453123);
    }
    float voronoi(vec2 p) {
      vec2 n = floor(p);
      vec2 f = fract(p);
      float md = 8.0;
      for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
          vec2 g = vec2(float(i), float(j));
          vec2 o = hash2(n + g);
          o = 0.5 + 0.5*sin(uTime*0.3*speed + 6.2831*o);
          vec2 r = g + o - f;
          float d = dot(r, r);
          md = min(md, d);
        }
      }
      return sqrt(md);
    }
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float f = voronoi(uv * 4.0 * scale + uBass*0.5);
      vec3 col = vec3(0.0);
      col += 0.5 + 0.5*cos(6.28*(f*2.0 + vec3(0.0,0.33,0.67) + uTime*0.1*speed));
      col *= smoothstep(0.0, 0.1, f) * (1.0 - f);
      col *= intensity * (0.6 + 0.6*uBeat);
      fragColor = vec4(col, 1.0);
    }`,[{id:"scale",label:"Scale",min:1,max:8,default:4,step:.5,group:"shape"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"scale",amount:.4,curve:"log"},{signal:"beat",param:"brightness",amount:.3,curve:"linear"}],"medium"),i("oss-plasma-tunnel","Plasma Tunnel","fractals","Fractal plasma tunnel with FBM distortion and IQ cosine palette",["tunnel","plasma","fractal","fbm","palette"],`
    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / min(uResolution.x, uResolution.y);
      float angle = atan(uv.y, uv.x);
      float radius = length(uv);
      float tunnel = 1.0 / (radius + 0.01);
      float tunnelAngle = angle / 3.14159;
      float t = uTime * speed;
      float pattern = fbm(vec2(tunnelAngle*3.0 + t*0.2, tunnel + t*0.5));
      pattern += 0.5*fbm(vec2(angle*2.0 + t*0.1, radius*5.0 - t*0.3));
      vec3 col = palette(pattern + uBass*0.2, vec3(0.5,0.5,0.5), vec3(0.5,0.5,0.5), vec3(1.0,1.0,1.0), vec3(0.0,0.33,0.67));
      col *= 1.0 - radius*0.8;
      col *= intensity * (0.7 + 0.5*uBeat);
      fragColor = vec4(max(col, vec3(0.0)), 1.0);
    }`,[{id:"distortion",label:"Distortion",min:0,max:3,default:1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:1,step:.05,group:"audio"}],{},[{signal:"bass",param:"distortion",amount:.5,curve:"log"},{signal:"mid",param:"scale",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"}],"medium"),...Oa,...ha.map(t=>{const o=[{id:"mdZoom",label:"Zoom",min:.2,max:3,default:t.defaults.mdZoom??1,step:.05,group:"transform"},{id:"mdRot",label:"Rotate",min:-3,max:3,default:t.defaults.mdRot??0,step:.05,group:"transform"},{id:"mdDecay",label:"Decay",min:0,max:1,default:t.defaults.mdDecay??.6,step:.05,group:"audio"},{id:"mdWarp",label:"Warp",min:0,max:2,default:t.defaults.mdWarp??.5,step:.05,group:"audio"},{id:"mdGamma",label:"Gamma",min:.5,max:3,default:t.defaults.mdGamma??1.4,step:.05,group:"color"},{id:"mdWaveMode",label:"Wave Mode",min:0,max:6,default:t.defaults.mdWaveMode??0,step:1,group:"shape"},{id:"mdWaveAlpha",label:"Wave Alpha",min:0,max:2,default:t.defaults.mdWaveAlpha??1,step:.05,group:"audio"},{id:"mdWaveScale",label:"Wave Scale",min:.2,max:3,default:t.defaults.mdWaveScale??1,step:.05,group:"shape"},{id:"mdWaveFreq",label:"Wave Freq",min:.5,max:12,default:t.defaults.mdWaveFreq??4,step:.1,group:"shape"},{id:"mdObSize",label:"Obj Size",min:.05,max:1,default:t.defaults.mdObSize??.3,step:.01,group:"shape"},{id:"mdObAlpha",label:"Obj Alpha",min:0,max:2,default:t.defaults.mdObAlpha??0,step:.05,group:"audio"},{id:"mdIbSize",label:"Inner Size",min:.05,max:1,default:t.defaults.mdIbSize??.3,step:.01,group:"shape"},{id:"mdIbAlpha",label:"Inner Alpha",min:0,max:2,default:t.defaults.mdIbAlpha??0,step:.05,group:"audio"}],a=[{id:"speed",label:"Speed",min:0,max:3,default:t.defaults.speed??1,step:.1},{id:"intensity",label:"Intensity",min:0,max:2,default:t.defaults.intensity??1,step:.05},{id:"distortion",label:"Distortion",min:0,max:2,default:t.defaults.distortion??0,step:.05,group:"audio"},{id:"scale",label:"Scale",min:.1,max:3,default:t.defaults.scale??1,step:.1,group:"audio"},{id:"brightness",label:"Brightness",min:0,max:2,default:t.defaults.brightness??1,step:.05,group:"audio"},{id:"hueShift",label:"Hue Shift",min:0,max:6.28,default:t.defaults.hueShift??0,step:.05},{id:"saturation",label:"Saturation",min:0,max:2,default:t.defaults.saturation??1,step:.05}];return{...t,params:[...a,...o],defaults:{speed:1,intensity:1,distortion:0,scale:1,brightness:1,hueShift:0,saturation:1,mdZoom:t.defaults.mdZoom??1,mdRot:t.defaults.mdRot??0,mdDecay:t.defaults.mdDecay??.6,mdWarp:t.defaults.mdWarp??.5,mdGamma:t.defaults.mdGamma??1.4,mdWaveMode:t.defaults.mdWaveMode??0,mdWaveAlpha:t.defaults.mdWaveAlpha??1,mdWaveScale:t.defaults.mdWaveScale??1,mdWaveFreq:t.defaults.mdWaveFreq??4,mdObSize:t.defaults.mdObSize??.3,mdObAlpha:t.defaults.mdObAlpha??0,mdIbSize:t.defaults.mdIbSize??.3,mdIbAlpha:t.defaults.mdIbAlpha??0,...t.defaults},audioMappings:[{signal:"bass",param:"mdZoom",amount:.3,curve:"log"},{signal:"beat",param:"intensity",amount:.35,curve:"linear"},{signal:"mid",param:"hueShift",amount:.3,curve:"linear"},{signal:"treble",param:"brightness",amount:.2,curve:"linear"},{signal:"volume",param:"brightness",amount:.25,curve:"log"}]}})];export{oe as S,i as c};
