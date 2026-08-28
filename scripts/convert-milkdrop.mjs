#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, basename, dirname } from 'path'

const CATEGORY_MAP = {
  '! Transition': 'vj',
  Transition: 'vj',
  Dancer: 'abstract',
  Drawing: 'abstract',
  Fractal: 'fractals',
  Geometric: 'geometric',
  Hypnotic: 'vj',
  Milkdrop2: 'vj',
  Particles: 'particle',
  Reaction: 'cosmic',
  Sparkle: 'cosmic',
  Supernova: 'cosmic',
  Waveform: 'liquid',
}

const GLSL = `#version 300 es
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
}`

function scanMilkFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) results.push(...scanMilkFiles(full))
    else if (entry.name.endsWith('.milk') && !entry.name.startsWith('desktop')) results.push(full)
  }
  return results
}

function parseMilkDrop(content) {
  const params = {}
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('[') || t.startsWith(';')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const k = t.substring(0, i).trim()
    const v = parseFloat(t.substring(i + 1).trim())
    if (!isNaN(v)) params[k] = v
  }
  return params
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50)
}

function extractName(filename) {
  let name = filename.replace(/\.milk$/i, '')
  const d = name.indexOf(' - ')
  if (d !== -1 && d < 40) name = name.substring(d + 3)
  return name.substring(0, 40).trim()
}

const milkDir = join(process.cwd(), 'NestDropResources')
const files = scanMilkFiles(milkDir)
console.log('Found ' + files.length + ' .milk presets')

const all = []
for (const f of files) {
  const content = readFileSync(f, 'utf-8')
  const params = parseMilkDrop(content)
  const folder = basename(dirname(dirname(f)))
  const cat = CATEGORY_MAP[folder] || 'vj'
  all.push({
    name: extractName(basename(f)),
    folder,
    category: cat,
    params,
    rating: params.fRating || 3,
  })
}

const byCat = {}
for (const p of all) {
  if (!byCat[p.category]) byCat[p.category] = []
  byCat[p.category].push(p)
}

const curated = []
for (const [cat, presets] of Object.entries(byCat)) {
  presets.sort((a, b) => b.rating - a.rating)
  const unique = []
  const seen = new Set()
  for (const p of presets) {
    const key = Math.round((p.params.zoom || 1) * 10) + '-' + Math.round((p.params.warp || 0) * 10) + '-' + Math.round((p.params.fDecay || 0.95) * 10)
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(p)
    }
    if (unique.length >= 20) break
  }
  curated.push(...unique)
}

console.log('Curated ' + curated.length + ' unique presets')

let escapedGlsl = GLSL.replace(/\\/g, '\\\\').replace(/\`/g, '\\`')

let output = '// AUTO-GENERATED by scripts/convert-milkdrop.mjs — DO NOT EDIT\n'
output += "import { ShaderDefinition } from '../utils/types'\n\n"
// #version must be the very first line: strip any leading newlines so strict
// compilers don't reject the whole fragment.
output += 'const MILKDROP_ADAPTER_FRAG = `' + escapedGlsl.trimStart() + '\n`\n\n'
output += 'export const MILKDROP_PRESETS: ShaderDefinition[] = [\n'

let idx = 0
for (const p of curated) {
  const id = 'md-' + slugify(p.name) + '-' + idx++
  const pp = p.params
  const defaults = {
    speed: 1, intensity: 1, distortion: 0, scale: 1, brightness: 1, hueShift: 0, saturation: 1,
    mdZoom: +(pp.zoom || 1).toFixed(3),
    mdRot: +(pp.rot || 0).toFixed(3),
    mdDecay: +(pp.fDecay || 0.95).toFixed(3),
    mdWarp: +Math.min(pp.warp || 0.2, 1).toFixed(3),
    mdGamma: +(pp.fGammaAdj || 2).toFixed(2),
    mdWaveMode: pp.nWaveMode || 0,
    mdWaveAlpha: +Math.min(pp.fWaveAlpha || 0.5, 2).toFixed(3),
    mdWaveScale: +Math.min(pp.fWaveScale || 1, 3).toFixed(3),
    mdWaveFreq: +(pp.fWaveParam || 0).toFixed(3),
    mdObSize: +(pp.ob_size || 0).toFixed(3),
    mdObAlpha: +(pp.ob_a || 0).toFixed(3),
    mdIbSize: +(pp.ib_size || 0).toFixed(3),
    mdIbAlpha: +(pp.ib_a || 0).toFixed(3),
  }

  const defaultsStr = Object.entries(defaults).map(function(e) { return '      ' + e[0] + ': ' + e[1] }).join(',\n')
  const escapedName = p.name.replace(/'/g, "\\'")
  const escapedFolder = p.folder.replace(/'/g, "\\'")

  output += '  {\n'
  output += "    id: '" + id + "',\n"
  output += "    name: '" + escapedName + "',\n"
  output += "    category: '" + p.category + "',\n"
  output += "    description: 'MilkDrop: " + escapedFolder + " — " + escapedName + "',\n"
  output += "    tags: ['milkdrop', '" + p.category + "', '" + slugify(p.folder) + "'],\n"
  output += '    fragment: MILKDROP_ADAPTER_FRAG,\n'
  output += '    uniforms: [],\n'
  output += '    params: [],\n'
  output += '    defaults: {\n' + defaultsStr + ',\n    },\n'
  output += '    audioMappings: [\n'
  output += "      { signal: 'bass', param: 'mdZoom', amount: 0.3, curve: 'log' },\n"
  output += "      { signal: 'beat', param: 'intensity', amount: 0.4, curve: 'linear' },\n"
  output += "      { signal: 'treble', param: 'mdWaveAlpha', amount: 0.5, curve: 'linear' },\n"
  output += "      { signal: 'volume', param: 'mdWarp', amount: 0.2, curve: 'linear' },\n"
  output += '    ],\n'
  output += "    performanceTier: 'medium',\n"
  output += '  },\n'
}

output += ']\n'

const outPath = join(process.cwd(), 'src', 'shaders', 'milkdrop-generated.ts')
writeFileSync(outPath, output)
console.log('Wrote ' + outPath + ' (' + curated.length + ' presets)')
