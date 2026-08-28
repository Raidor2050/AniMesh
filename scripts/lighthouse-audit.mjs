/**
 * One-off Lighthouse audit (NOT wired into CI, per AGENTS/DECISIONS).
 *
 * Launches our own Chrome (like the other audit scripts) and feeds its
 * debugging port to Lighthouse. chrome-launcher's tmp-dir cleanup is fragile on
 * Windows; attaching to a self-managed instance avoids the EPERM entirely.
 *
 * Usage: node scripts/lighthouse-audit.mjs <url>
 */
import puppeteer from 'puppeteer-core'
import lighthouse from 'lighthouse'
import { statSync } from 'node:fs'

const url = process.argv[2] || 'http://localhost:4173/AniMesh/'
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
statSync(chromePath) // fail fast if missing

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--remote-debugging-port=9223'],
})

const port = 9223
browser.process().once('exit', () => {}) // keep the instance alive while LH drives it

const results = await lighthouse(url, {
  port,
  output: 'json',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  logLevel: 'silent',
  maxWaitForLoad: 60000,
}, null)

await browser.close()

if (!results) { console.error('Lighthouse produced no report'); process.exit(1) }
const r = results.lhr
for (const cat of ['performance', 'accessibility', 'best-practices', 'seo']) {
  console.log('  ' + cat + ': ' + r.categories?.[cat]?.score ?? 'n/a')
}
console.log('  url: ' + r.finalUrl)
const failed = r.audits ? Object.entries(r.audits).filter(([, a]) => a.score !== null && a.score < 0.9) : []
console.log('  sub-0.9 audits: ' + failed.map(([k]) => k).join(', ') || 'none')