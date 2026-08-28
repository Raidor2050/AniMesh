/**
 * Headless E2E smoke — one-off audit verifier (NOT wired into CI, per AGENTS/DECISIONS).
 * Drives the built app against a preview server, covering the FINAL_AUDIT manual
 * checklist items that can be automated. Each group opens a fresh page so a bad
 * driver/permission path can't contaminate the next group.
 *
 * Usage: node scripts/e2e-smoke.mjs <url> [edge|chrome]
 */
import puppeteer from 'puppeteer-core'
import { statSync } from 'node:fs'

const url = process.argv[2] || 'http://localhost:4173/'
const browserName = process.argv[3] || (process.env.SMOKE_BROWSER || 'edge')
const executables = {
  edge: ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'],
  chrome: ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'],
}
const executablePath = executables[browserName].find(p => { try { statSync(p); return true } catch { return false } })
if (!executablePath) throw new Error(`no ${browserName} executable found`)

let pass = 0, fail = 0
const problems = []
const notes = []
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}${detail ? ' — ' + detail : ''}`) }
  else { fail++; problems.push(name + (detail ? ' — ' + detail : '')); console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}
const info = msg => { notes.push(msg); console.log('  NOTE  ' + msg) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: [
    '--no-sandbox', '--enable-unsafe-swiftshader',
    '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream',
    '--autoplay-policy=no-user-gesture-required', '--mute-audio',
  ],
})

async function openPage(opts = {}) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport({ width: 1280, height: 800 })
  // Headless file-chooser interception is unreliable; for the FILE source test,
  // polyfill document.createElement so the app's own dynamic <input type=file>
  // path spawns a synthetic WAV instead of a native dialog. This exercises the
  // REAL code path (createElement → onchange(File) → connectFile → decodeAudioData).
  if (opts.polyfillFile) {
    const b64 = makeWav().toString('base64')
    await page.evaluateOnNewDocument((payload) => {
      const bytes = Uint8Array.from(atob(payload), c => c.charCodeAt(0))
      const wav = new File([bytes], 'tone.wav', { type: 'audio/wav' })
      const origCE = document.createElement.bind(document)
      document.createElement = (tag, opt) => {
        const el = origCE(tag, opt)
        if (String(tag).toLowerCase() === 'input') {
          const origClick = el.click.bind(el)
          el.click = () => {
            if (/file/i.test(el.type || '')) {
              const dt = new DataTransfer()
              dt.items.add(wav)
              el.files = dt.files
              el.dispatchEvent(new Event('change', { bubbles: true }))
            } else origClick()
          }
        }
        return el
      }
    }, b64)
  }
  const state = { pageerrors: [], consoleErrs: [], httpErrors: [], failedRefs: new Set() }
  page.on('pageerror', e => state.pageerrors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') state.consoleErrs.push(m.text()) })
  page.on('response', r => {
    const st = r.status()
    if (st >= 400) {
      state.httpErrors.push({ status: st, url: r.url() })
      if (st >= 500) state.failedRefs.add(r.url())
    }
  })
  page.__st = state
  page.__ctx = ctx
  return page
}
async function boot(page, { wait = 5200 } = {}) {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })
  await page.waitForFunction(() => !!document.querySelector('canvas'), { timeout: 20000 })
  await sleep(wait)
}
const srcHeader = page => page.evaluate(`(() => { const b = document.querySelector('[data-source-menu] button'); return b ? b.innerText.trim().replace(/\s+/g, ' ') : '' })()`)
async function webglOk(page) {
  return page.evaluate(`(() => { const cs = [...document.querySelectorAll('canvas')].sort((a,b)=>b.clientWidth-a.clientWidth); return !!(cs[0] && cs[0].getContext('webgl2')) })()`)
}
async function shotHash(page) {
  const b = await page.screenshot({ type: 'png' })
  let h = 2166136261
  for (let i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 16777619) }
  return h >>> 0
}
async function framesLive(page) { // two screenshots ~450ms apart must differ (compositor truth)
  const a = await shotHash(page)
  await sleep(450)
  const b = await shotHash(page)
  return a !== b
}
async function clickSource(page, label, { settle = 1200 } = {}) {
  const opened = await page.evaluate(`(() => { const b = document.querySelector('[data-source-menu] button'); if (b) b.click(); return !!b })()`)
  await sleep(300)
  const clicked = await page.evaluate(l => {
    const hit = [...document.querySelectorAll('[data-source-menu] button')].find(x => x.innerText.includes(l))
    if (hit) hit.click()
    return !!hit
  }, label)
  await sleep(settle)
  return opened && clicked
}

const totalErrs = s => s.pageerrors.length + s.consoleErrs.length

// ─── Group A: fresh boot + steady-state ────────────────────────────────
{
  const p = await openPage(); await boot(p)
  ok('A1 page + canvas mounted on fresh boot', await p.evaluate(`!!document.querySelector('canvas')`))
  ok('A2 canvas holds a WebGL2 context (software GL headless)', await webglOk(p))
  const bootErrs = totalErrs(p.__st)
  ok('A3 no page errors during 5s settle', p.__st.pageerrors.length === 0, p.__st.pageerrors.slice(0, 2).join(' | '))
  const http = p.__st.httpErrors.filter(e => !/favicon/i.test(e.url))
  ok('A4 no HTTP >=400 for app resources (excl. favicon)', http.length === 0, http.slice(0, 4).map(e => `${e.status} ${e.url}`.replace(url, '')).join(' ; '))
  ok('A5 frames are live (screenshots differ)', await framesLive(p))
  ok('A6 zero total errors in settle', bootErrs === 0, p.__st.consoleErrs.slice(0, 2).join(' | '))
  await p.__ctx.close()
}

// ─── Group B: 50-cycle shader switching + perf overlay + immersive ─────
{
  const p = await openPage(); await boot(p)
  await p.keyboard.press('g'); await sleep(400)
  ok('B1 perf overlay mounts on g', await p.evaluate(`document.body.innerText.includes('fps') && document.body.innerText.includes('frame')`))
  await p.keyboard.press('g'); await sleep(150)
  const before = totalErrs(p.__st)
  const heap0 = (await p.metrics()).JSHeapUsedSize
  const failedShaders = new Set()
  const seenCompileErrs = new Set()
  const grabCompileErrs = () => {
    for (const t of p.__st.consoleErrs) {
      if (t.includes('Shader compile failed')) {
        const m = t.match(/\(([^)]+)\)\s*$/)
        if (m) failedShaders.add(m[1])
        seenCompileErrs.add(t)
      }
    }
  }
  for (let i = 0; i < 50; i++) {
    await p.keyboard.press(i < 25 ? ']' : '[')
    await sleep(280)
    grabCompileErrs()
  }
  await sleep(700)
  const heapGrow = (await p.metrics()).JSHeapUsedSize - heap0
  const newErrs = totalErrs(p.__st) - before
  const rhs = await p.evaluate(`(() => { const c = [...document.querySelectorAll('canvas')].sort((a,b)=>b.clientWidth-a.clientWidth)[0]; return !!(c && c.clientWidth>0 && c.clientHeight>0) })()`)
  ok('B2 50 cycles: canvas still mounted + sized', rhs)
  ok('B3 50 cycles: heap growth < 40MB', heapGrow < 40e6, `${(heapGrow / 1e6).toFixed(1)}MB`)
  ok('B4 50 cycles: frames still live after switches', await framesLive(p))
  ok('B5 50 cycles: no render-loop crashes (zero page errors from cycling)', p.__st.pageerrors.length === 0, p.__st.pageerrors.slice(0, 2).join(' | '))
  info(`${newErrs} console/log errors across 50 cycles (mostly per-shader compile fallbacks on SwiftShader)`)
  if (failedShaders.size) info(`swiftshader-rejected shaders (graceful fallback OK): ${[...failedShaders].join(', ')}`)
  else info('all 50 cycled shaders compiled cleanly (no fallbacks)')

  await p.keyboard.press('f'); await sleep(600)
  const hud = await p.evaluate(`!document.querySelector('[data-source-menu]') && !!document.querySelector('canvas')`)
  ok('C1 immersive HUD replaces chrome on f', hud)
  await p.keyboard.press('Escape'); await sleep(600)
  ok('C2 Escape restores chrome', await p.evaluate(`!!document.querySelector('[data-source-menu]')`))
  ok('C3 immersive round-trip: no page errors', !p.__st.pageerrors.length, p.__st.pageerrors.slice(0, 2).join(' | '))
  await p.__ctx.close()
}

// ─── Group C: audio sources (demo / mic / system / file) ───────────────
{
  const p = await openPage(); await boot(p)
  ok('D1 demo source engages', await clickSource(p, 'Demo') && (await srcHeader(p)).includes('Demo'), (await srcHeader(p)) || 'no header')
  ok('D2 mic (fake media stream) engages', await clickSource(p, 'Microphone') && (await srcHeader(p)).includes('Mic'), (await srcHeader(p)) || 'no header')
  await clickSource(p, 'System Audio', { settle: 2500 })
  ok('D3 system capture failure is graceful (no pageerror)', p.__st.pageerrors.length === 0, p.__st.pageerrors.slice(0, 2).join(' | '))
  ok('D4 app alive after system attempt', (await srcHeader(p)).length > 0, (await srcHeader(p)) || 'no header')
  await p.__ctx.close()
}

// ─── Group C2: audio source file upload (synthetic WAV via input polyfill) ─
{
  const p = await openPage({ polyfillFile: true }); await boot(p)
  const clicked = await clickSource(p, 'Audio File', { settle: 2500 })
  const header = await srcHeader(p)
  ok('D5 file source decodes + plays synthetic WAV', clicked && header.includes('File'), header || 'no header')
  ok('D6 audio flow overall: no page errors', p.__st.pageerrors.length === 0, p.__st.pageerrors.slice(0, 2).join(' | '))
  await p.__ctx.close()
}

// ─── Group D: reduced motion ───────────────────────────────────────────
{
  const p = await openPage()
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await boot(p)
  ok('E1 reduced-motion boot: canvas + WebGL2', await webglOk(p))
  ok('E2 reduced-motion boot: no page errors', !p.__st.pageerrors.length, p.__st.pageerrors.slice(0, 2).join(' | '))
  ok('E3 reduced-motion boot: frames live', await framesLive(p))
  await p.__ctx.close()
}

// ─── Group E: corrupt persisted state ──────────────────────────────────
{
  const p = await openPage()
  await boot(p, { wait: 1500 })
  await p.evaluate(`(() => {
    localStorage.setItem('animesh-favorites', '{ooops not json')
    localStorage.setItem('animesh-recent', '[unterminated')
    localStorage.setItem('animesh-chips', '42')
    localStorage.setItem('animesh:ui', 'garbage')
  })()`)
  await p.reload({ waitUntil: 'networkidle0' })
  await p.waitForFunction(`!!document.querySelector('canvas')`, { timeout: 20000 }).catch(() => {})
  await sleep(5200)
  ok('G1 corrupt storage boot: canvas mounts', await p.evaluate(`!!document.querySelector('canvas')`))
  ok('G2 corrupt storage boot: no page errors', !p.__st.pageerrors.length, p.__st.pageerrors.slice(0, 2).join(' | '))
  ok('G3 corrupt storage boot: frames live', await framesLive(p))
  await p.__ctx.close()
}

// ─── Group F: context loss + restore ───────────────────────────────────
{
  const p = await openPage(); await boot(p)
  const lost = await p.evaluate(`(() => {
    const c = [...document.querySelectorAll('canvas')].sort((a,b)=>b.clientWidth-a.clientWidth)[0]
    const gl = c && c.getContext('webgl2')
    const ext = gl && gl.getExtension('WEBGL_lose_context')
    if (ext) { ext.loseContext(); return true }
    return false
  })()`)
  await sleep(1500)
  await p.evaluate(`(() => {
    const c = [...document.querySelectorAll('canvas')].sort((a,b)=>b.clientWidth-a.clientWidth)[0]
    const gl = c && c.getContext('webgl2')
    const ext = gl && gl.getExtension('WEBGL_lose_context')
    if (ext) ext.restoreContext()
  })()`).catch(() => {})
  await sleep(1800)
  ok('F1 context-loss+restore initiated', lost)
  ok('F2 frames resume after restore', await framesLive(p))
  ok('F3 context-loss handling: no page errors', !p.__st.pageerrors.length, p.__st.pageerrors.slice(0, 2).join(' | '))
  await p.__ctx.close()
}

console.log(`\n${pass} passed, ${fail} failed`)
if (notes.length) console.log('Notes:\n' + notes.map(n => '  - ' + n).join('\n'))
if (fail > 0) console.log('Problems:\n' + problems.map(x => '  - ' + x).join('\n'))
await browser.close()
process.exit(fail > 0 ? 1 : 0)

function makeWav() {
  const rate = 22050, n = rate
  const data = Buffer.alloc(44 + n * 2)
  data.write('RIFF', 0); data.writeUInt32LE(36 + n * 2, 4); data.write('WAVE', 8)
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20)
  data.writeUInt16LE(1, 22); data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28)
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34)
  data.write('data', 36); data.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) data.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 800 * i / rate) * 12000), 44 + i * 2)
  return data
}