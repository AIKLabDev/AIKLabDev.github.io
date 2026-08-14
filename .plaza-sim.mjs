// plaza.js 를 헤드리스로 돌려 ⑤ 의 동선을 잰다 (차체는 OBB 로 정확히 겹침 판정)
import { BoxGeometry, MeshStandardMaterial, Object3D } from 'three'

const ROOT = new URL('./src', import.meta.url).pathname
const { heroStages } = await import(`${ROOT}/data/heroStages.js`)
const { createPlaza } = await import(`${ROOT}/components/scroll-scene/stages/plaza.js`)
const { vehicle } = await import(`${ROOT}/components/scroll-scene/forklift/rig.generated.js`)

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

const HALF_L = (vehicle.extent.max[0] - vehicle.extent.min[0]) / 2
const HALF_W = (vehicle.extent.max[1] - vehicle.extent.min[1]) / 2
const MID = (vehicle.extent.max[0] + vehicle.extent.min[0]) / 2

const corners = ([x, y, yaw]) => {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  const cx = x + c * MID
  const cy = y + s * MID
  return [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) => [
    cx + c * a * HALF_L - s * b * HALF_W,
    cy + s * a * HALF_L + c * b * HALF_W,
  ])
}
const axes = ([x, y, yaw]) => [[Math.cos(yaw), Math.sin(yaw)], [-Math.sin(yaw), Math.cos(yaw)]]
const project = (pts, [ax, ay]) => {
  let lo = Infinity, hi = -Infinity
  for (const [x, y] of pts) { const d = x * ax + y * ay; if (d < lo) lo = d; if (d > hi) hi = d }
  return [lo, hi]
}
// 겹침 깊이 (음수면 떨어져 있고, 그 절댓값이 최소 간격)
const overlap = (pa, pb) => {
  const A = corners(pa), B = corners(pb)
  let best = Infinity
  for (const ax of [...axes(pa), ...axes(pb)]) {
    const [a0, a1] = project(A, ax)
    const [b0, b1] = project(B, ax)
    const d = Math.min(a1 - b0, b1 - a0)
    if (d < best) best = d
  }
  return best
}

const dt = 1 / 30
const SECONDS = Number(process.argv[2] ?? 900)
const STEPS = Math.round(SECONDS / dt)

let frames = 0, hitFrames = 0, worst = -Infinity
const hits = []
const dist = []
const stalled = []
let prev = null

for (let i = 0; i < STEPS; i++) {
  const t = i * dt
  plaza.update(dt)
  if (t < 4) continue

  const poses = [[lead.x, lead.y, lead.yaw], ...rigs.map((g) => [g.position.x, g.position.y, g.rotation.z])]
  if (prev) poses.forEach((p, k) => {
    const step = Math.hypot(p[0] - prev[k][0], p[1] - prev[k][1])
    dist[k] = (dist[k] ?? 0) + (step > 6 ? 0 : step)
    if (step / dt < 0.12) stalled[k] = (stalled[k] ?? 0) + 1
  })
  prev = poses.map((p) => [p[0], p[1]])

  frames++
  let hit = false
  for (let a = 0; a < poses.length; a++) {
    for (let b = a + 1; b < poses.length; b++) {
      const d = overlap(poses[a], poses[b])
      if (d > worst) worst = d
      if (d > 0) {
        hit = true
        hits.push({ t: +t.toFixed(1), pair: `${a}-${b}`, depth: +d.toFixed(2) })
      }
    }
  }
  if (hit) hitFrames++
}

const byPair = new Map()
const spans = []
for (const h of hits) {
  const last = byPair.get(h.pair)
  if (last && h.t - last.to <= 0.5) { last.to = h.t; last.depth = Math.max(last.depth, h.depth) }
  else { const s = { pair: h.pair, from: h.t, to: h.t, depth: h.depth }; byPair.set(h.pair, s); spans.push(s) }
}
const seconds_in_collision = spans.reduce((a, s) => a + (s.to - s.from), 0)

console.log(JSON.stringify({
  seconds: SECONDS,
  compact,
  collisionFrames: hitFrames,
  collisionPct: +((hitFrames / frames) * 100).toFixed(2),
  deepestOverlap: +worst.toFixed(3),
  events: spans.length,
  secondsInCollision: +seconds_in_collision.toFixed(1),
  first: spans.slice(0, 10),
  avgSpeed: dist.map((s) => +(s / (frames * dt)).toFixed(2)),
  stalledPct: stalled.map((s) => +((s / frames) * 100).toFixed(1)),
}, null, 2))
