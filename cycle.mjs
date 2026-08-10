import { chromium } from '/home/aik3/.npm/_npx/db89d7302a373f10/node_modules/playwright/index.mjs'

const OUT = '/tmp/claude-1000/-home-aik3-Projects-careers-web/0f10e232-6a91-46ac-909c-d03dbeb831ae/scratchpad'
const tag = process.argv[2]
const at = Number(process.argv[3])
const shots = Number(process.argv[4] ?? 8)
const gap = Number(process.argv[5] ?? 1500)

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1100, height: 690 }, deviceScaleFactor: 1 })
const logs = []
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto('http://localhost:5199/?hero=flow', { waitUntil: 'load' })
await page.waitForTimeout(16000)
const info = await page.evaluate(() => {
  const el = document.querySelector('[data-hero-variant]')
  return { top: el.offsetTop, height: el.offsetHeight, vh: window.innerHeight }
})
await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), info.top + (info.height - info.vh) * at)
await page.waitForTimeout(4000)
for (let i = 0; i < shots; i++) {
  try {
    await page.screenshot({ path: `${OUT}/${tag}-${String(i).padStart(2, '0')}.png`, timeout: 90000, animations: 'disabled' })
  } catch (e) { logs.push(`[shot ${i}] ${e.message.split('\n')[0]}`) }
  await page.waitForTimeout(gap)
}
console.log(logs.length ? logs.join('\n') : 'ok')
await browser.close()
