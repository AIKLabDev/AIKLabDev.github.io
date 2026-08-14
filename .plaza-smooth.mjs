// ⑤ 의 움직임이 얼마나 매끄러운지 잰다 — 속도·가속도·요각속도·요각가속도
import { BoxGeometry, MeshStandardMaterial, Object3D } from 'three'

const ROOT = new URL('./src', import.meta.url).pathname
const { heroStages } = await import(`${ROOT}/data/heroStages.js`)
const { createPlaza } = await import(`${ROOT}/components/scroll-scene/stages/plaza.js`)

const library = {
  robot: new Object3D(),
  pallet: new Object3D(),
  boxGeometry: new BoxGeometry(0.509, 0.4083, 0.35),
  boxMaterial: new MeshStandardMaterial(),
}

const P = heroStages.journey.plaza
const compact = process.argv[3] === 'compact'
const plaza = createPlaza(P, { library, compact })
const lead = plaza.lead
const rigs = plaza.group.children.filter((c) => c.type === 'Group')

const dt = 1 / 60
const SECONDS = Number(process.argv[2] ?? 600)
const STEPS = Math.round(SECONDS / dt)
const TAU = Math.PI * 2
const wrap = (a) => a - TAU * Math.round(a / TAU)

const N = 1 + rigs.length
const hist = Array.from({ length: N }, () => ({ v: [], w: [], a: [], j: [], stops: 0 }))
let prev = null
let prevV = null
let prevA = null
let worstFrame = 0

for (let i = 0; i < STEPS; i++) {
  const t0 = process.hrtime.bigint()
  plaza.update(dt)
  const ms = Number(process.hrtime.bigint() - t0) / 1e6
  if (ms > worstFrame) worstFrame = ms
  const t = i * dt
  if (t < 4) continue

  const poses = [[lead.x, lead.y, lead.yaw], ...rigs.map((g) => [g.position.x, g.position.y, g.rotation.z])]
  if (prev) {
    const v = poses.map((p, k) => {
      const step = Math.hypot(p[0] - prev[k][0], p[1] - prev[k][1])
      return step > 6 ? null : step / dt
    })
    const w = poses.map((p, k) => {
      const d = Math.abs(wrap(p[2] - prev[k][2]))
      return d > 1 ? null : d / dt
    })
    if (prevV) {
      v.forEach((s, k) => {
        if (s === null || prevV[k] === null) return
        const a = (s - prevV[k]) / dt
        hist[k].a.push(Math.abs(a))
        if (prevA && prevA[k] !== null) hist[k].j.push(Math.abs((a - prevA[k]) / dt))
      })
      prevA = v.map((s, k) => (s === null || prevV[k] === null ? null : (s - prevV[k]) / dt))
    }
    v.forEach((s, k) => {
      if (s === null) return
      hist[k].v.push(s)
      if (s < 0.05) hist[k].stops++
    })
    w.forEach((s, k) => s !== null && hist[k].w.push(s))
    prevV = v
  }
  prev = poses.map((p) => [p[0], p[1], p[2]])
}

const pct = (arr, q) => {
  if (!arr.length) return 0
  const s = arr.slice().sort((a, b) => a - b)
  return +s[Math.min(s.length - 1, Math.floor(q * s.length))].toFixed(2)
}
const mean = (arr) => +(arr.reduce((a, b) => a + b, 0) / (arr.length || 1)).toFixed(2)

console.log(
  JSON.stringify(
    {
      seconds: SECONDS,
      compact,
      worstFrameMs: +worstFrame.toFixed(1),
      units: hist.map((h) => ({
        vAvg: mean(h.v),
        vMax: pct(h.v, 0.999),
        aMax: pct(h.a, 0.99),
        aP50: pct(h.a, 0.5),
        jMax: pct(h.j, 0.99),
        wMax: pct(h.w, 0.999),
        stopPct: +((h.stops / h.v.length) * 100).toFixed(1),
      })),
    },
    null,
    2,
  ),
)
