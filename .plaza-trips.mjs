// 집은 자리에서 놓는 자리까지 실제로 얼마나 옮기는지 잰다. 차량마다 실린
// 화물이 붙고 떨어지는 순간을 보므로 어느 차량의 걸음인지 헷갈리지 않는다
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
const pallets = rigs.map((g) => g.children.find((c) => c.type === 'Object3D'))

const cell = compact ? P.compactCell : P.cell
const cols = [...P.text].reduce((a, c, i) => a + { A: 4, I: 3, K: 4, O: 4, R: 4, E: 3 }[c] + (i ? P.space : 0), 0)
const width = (cols - 1) * cell
const originX = P.center[0] - width / 2
const RACKS = [originX - P.buffer.out, originX + width + P.buffer.out]
const staged = (x) => RACKS.some((r) => Math.abs(x - r) < 2.5)
// 어느 통로에서 붙었는지는 차체가 향한 쪽이 정한다 (앞 통로는 +y 를 본다)
const railOf = (yaw) => (Math.sin(yaw) > 0 ? 'front' : 'back')

const dt = 1 / 60
const held = new Array(1 + rigs.length).fill(false)
const from = new Array(1 + rigs.length).fill(null)
const trips = []
let rackToRack = 0
let shortSame = 0
let shortCross = 0

for (let step = 0; step < Math.round(Number(process.argv[2] ?? 900) / dt); step++) {
  plaza.update(dt)
  const now = [
    { on: lead.load > 0.5, x: lead.x, yaw: lead.yaw },
    ...rigs.map((g, i) => ({ on: (pallets[i]?.userData.fade ?? 0) > 0.5, x: g.position.x, yaw: g.rotation.z })),
  ]
  now.forEach((u, k) => {
    if (u.on === held[k]) return
    held[k] = u.on
    if (u.on) {
      from[k] = { x: u.x, rail: railOf(u.yaw), rack: staged(u.x) }
      return
    }
    const a = from[k]
    from[k] = null
    if (!a) return
    const gap = Math.abs(u.x - a.x)
    const rail = railOf(u.yaw)
    trips.push({ gap, cross: rail !== a.rail })
    if (a.rack && staged(u.x)) rackToRack++
    else if (rail === a.rail) {
      if (gap < P.stride - 1) shortSame++
    } else if (gap < P.cross * (cell / P.cell) - 1) shortCross++
  })
}

const gaps = trips.map((t) => t.gap).sort((x, y) => x - y)
const q = (f) => (gaps.length ? +gaps[Math.floor(f * (gaps.length - 1))].toFixed(1) : 0)
console.log(
  JSON.stringify({
    compact,
    trips: trips.length,
    crossPct: +((trips.filter((t) => t.cross).length / (trips.length || 1)) * 100).toFixed(0),
    gap: { min: q(0), p25: q(0.25), median: q(0.5), p75: q(0.75), max: q(1) },
    rackToRack,
    shortSame,
    shortCross,
  }),
)
