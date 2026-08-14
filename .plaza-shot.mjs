import { chromium } from '/home/aik3/.npm/_npx/db89d7302a373f10/node_modules/playwright/index.mjs'

const OUT = process.argv[2]
const tag = process.argv[3] ?? 'v'
const width = Number(process.argv[4] ?? 1440)
const height = Number(process.argv[5] ?? 810)
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
const logs = []
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto('http://127.0.0.1:5199/?hero=flow', { waitUntil: 'load' })
await page.waitForTimeout(14000)

const info = await page.evaluate(() => {
  const el = document.querySelector('[data-hero-variant]')
  return { top: el.offsetTop, height: el.offsetHeight, vh: window.innerHeight }
})
const travel = info.height - info.vh
await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), info.top + travel * 0.8061)
await page.waitForTimeout(3000)
for (let i = 0; i < 6; i++) {
  await page.screenshot({ path: `${OUT}/${tag}-${String(i).padStart(2, '0')}.png`, timeout: 90000 })
  await page.waitForTimeout(4000)
}
console.log(logs.length ? logs.slice(0, 10).join('\n') : 'console clean')
await browser.close()
