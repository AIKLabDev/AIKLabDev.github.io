// 차체가 향한 쪽과 실제로 간 쪽이 어긋나는 프레임을 찾는다 (호가 되돌아오는 자리)
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
const plaza = createPlaza(P, { library, compact: process.argv[3] === 'compact' })
const lead = plaza.lead
const rigs = plaza.group.children.filter((c) => c.type === 'Group')

const dt = 1 / 60
const SECONDS = Number(process.argv[2] ?? 400)
const TAU = Math.PI * 2
const wrap = (a) => a - TAU * Math.round(a / TAU)

let prev = null
const slips = []
const spins = []
let frames = 0

for (let i = 0; i < Math.round(SECONDS / dt); i++) {
  plaza.update(dt)
  const t = i * dt
  if (t < 4) continue
  const poses = [[lead.x, lead.y, lead.yaw], ...rigs.map((g) => [g.position.x, g.position.y, g.rotation.z])]
  if (prev) {
    frames++
    poses.forEach((p, k) => {
      const dx = p[0] - prev[k][0]
      const dy = p[1] - prev[k][1]
      const step = Math.hypot(dx, dy)
      if (step > 6) return
      const w = Math.abs(wrap(p[2] - prev[k][2])) / dt
      if (w > 1.2) spins.push({ t: +t.toFixed(1), unit: k, w: +w.toFixed(2), v: +(step / dt).toFixed(2) })
      // 초당 0.3m 아래는 방향이 수치잡음이라 보지 않는다
      if (step / dt < 0.3) return
      const drift = Math.abs(wrap(Math.atan2(dy, dx) - p[2]))
      // 전진도 후진도 아닌 방향으로 미끄러진 프레임
      const off = Math.min(drift, Math.abs(Math.PI - drift))
      if (off > 0.35) slips.push({ t: +t.toFixed(1), unit: k, off: +off.toFixed(2), v: +(step / dt).toFixed(2) })
    })
  }
  prev = poses.map((p) => [p[0], p[1], p[2]])
}

const collapse = (list, key) => {
  const out = []
  for (const e of list) {
    const last = out[out.length - 1]
    if (last && last.unit === e.unit && e.t - last.to <= 0.3) {
      last.to = e.t
      last.peak = Math.max(last.peak, e[key])
    } else out.push({ unit: e.unit, from: e.t, to: e.t, peak: e[key] })
  }
  return out
}

const slipSpans = collapse(slips, 'off')
const spinSpans = collapse(spins, 'w')
console.log(
  JSON.stringify(
    {
      frames,
      slipFrames: slips.length,
      slipEvents: slipSpans.length,
      worstSlip: slips.reduce((a, b) => Math.max(a, b.off), 0).toFixed(2),
      slipSample: slipSpans.slice(0, 8),
      spinEvents: spinSpans.length,
      worstSpin: spins.reduce((a, b) => Math.max(a, b.w), 0).toFixed(2),
      spinSample: spinSpans.slice(0, 8),
    },
    null,
    2,
  ),
)
