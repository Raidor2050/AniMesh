/**
 * One-off audit: compile-sweep the ENTIRE shader library on a real browser GL.
 * Cycles every catalog entry (plus pre-warm of 3 neighbours each) and reports:
 *   - shaders rejected by the active driver (name + GLSL log)
 *   - any page/boundary crash (regression of the warmShader fix)
 *
 * Usage: node scripts/sweep-gls-wrapper.mjs <url> [edge|chrome] <presses>
 */
import puppeteer from 'puppeteer-core'
import { statSync } from 'node:fs'

const url = process.argv[2] || 'http://localhost:4173/'
const browserName = process.argv[3] || 'chrome'
const presses = parseInt(process.argv[4] || '400', 10)
const executables = {
  edge: ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'],
  chrome: ['C:/Program Files/Google/Chrome/Application/chrome.exe'],
}
const executablePath = executables[browserName].find(p => { try { statSync(p); return true } catch { return false } })
if (!executablePath) throw new Error(`no ${browserName}`)

const b = await puppeteer.launch({
  executablePath, headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
})
const ctx = await b.createBrowserContext()
const p = await ctx.newPage()
await p.setViewport({ width: 1024, height: 768 })

const state = { compile: new Set(), warm: new Set(), boundary: new Set(), pageerrors: [] }
p.on('pageerror', e => { state.pageerrors.push(e.message); })
p.on('console', m => {
  if (m.type() !== 'error') return
  const t = m.text()
  const name = t.match(/\(([^)]+)\)\s*(?:\(|$)/) || t.match(/\(([^)]+)\)\s*$/)
  if (t.includes('Shader compile failed')) state.compile.add(name ? name[1] : t.slice(0, 60))
  else if (t.includes('warm failed')) state.warm.add(name ? name[1] : t.slice(0, 60))
  else if (t.includes('CRASHED') || t.includes('Unsatisfied') || t.includes('broken')) state.boundary.add(t.slice(0, 120))
})

await p.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
await p.waitForFunction(() => !!document.querySelector('canvas'), { timeout: 20000 })
await new Promise(r => setTimeout(r, 5200))

const glInfo = await p.evaluate(() => {
  const cvs = [...document.querySelectorAll('canvas')].sort((a, b) => b.clientWidth - a.clientWidth)[0]
  const gl = cvs && cvs.getContext('webgl2')
  if (!gl) return { gl: false }
  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  return { gl: true, renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'n/a' }
})
console.log(`GL: ${glInfo.gl ? glInfo.renderer : 'UNAVAILABLE'}`)

if (glInfo.gl) {
  for (let i = 0; i < presses; i++) {
    await p.keyboard.press(']')
    await new Promise(r => setTimeout(r, i % 25 === 24 ? 220 : 55))
  }
  await new Promise(r => setTimeout(r, 1200))
}

console.log(`comple-sweep presses: ${presses}`)
console.log(`compile_errors(${state.compile.size}):`, [...state.compile].join(' | '))
console.log(`warm_failures(${state.warm.size}):`, [...state.warm].join(' | '))
console.log(`boundary_crashes(${state.boundary.size}):`, [...state.boundary].join(' | '))
console.log(`pageerrors(${state.pageerrors.length}):`, state.pageerrors.slice(0, 5).join(' | '))

const canvasAlive = await p.evaluate(() => {
  const cvs = [...document.querySelectorAll('canvas')].sort((a, b) => b.clientWidth - a.clientWidth)[0]
  return !!cvs && cvs.clientWidth > 0 && !!cvs.getContext('webgl2')
})
console.log(`canvas_alive_after_sweep: ${canvasAlive}`)

await ctx.close(); await b.close()