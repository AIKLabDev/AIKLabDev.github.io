import { chromium } from '/home/aik3/.npm/_npx/db89d7302a373f10/node_modules/playwright/index.mjs'

const OUT = '/tmp/claude-1000/-home-aik3-Projects-careers-web/0f10e232-6a91-46ac-909c-d03dbeb831ae/scratchpad'
const tag = process.argv[2] ?? 'v1'
const width = Number(process.argv[3] ?? 1100)
const height = Number(process.argv[4] ?? 690)
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
const logs = []
page.on('console', (m) => { if (m.type() !== 'debug' && m.type() !== 'info') logs.push(`[${m.type()}] ${m.text()}`) })
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto('http://localhost:5199/?hero=flow', { waitUntil: 'load' })
await page.waitForTimeout(16000)

const info = await page.evaluate(() => {
  const el = document.querySelector('[data-hero-variant]')
  return { top: el.offsetTop, height: el.offsetHeight, vh: window.innerHeight }
})
const travel = info.height - info.vh
// 각 장의 중앙 + 장 사이 전환점
const stops = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
for (let i = 0; i < stops.length; i++) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), info.top + travel * stops[i])
  await page.waitForTimeout(2600)
  try {
    await page.screenshot({ path: `${OUT}/${tag}-${String(i).padStart(2, '0')}.png`, timeout: 90000, animations: 'disabled' })
  } catch (e) { logs.push(`[shot ${i}] ${e.message.split('\n')[0]}`) }
}
console.log(logs.length ? logs.join('\n') : 'console clean')
await browser.close()
