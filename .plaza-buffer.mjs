// 글자 양옆 적치대가 실제로 몇 장까지 쌓이는지, 그동안 차량이 어디 있는지 잰다
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

// 적치대 칸은 seats 의 꼬리다. 인스턴스 행렬이 0 스케일이면 비어 있다
const decks = plaza.group.children.find((c) => c.isInstancedMesh && c.count < 200)
const total = decks.count
const glyphCells = [...P.text].reduce((a, c) => a + { A: 14, I: 10, K: 12, O: 12, R: 14, E: 12 }[c], 0)
const bufferCount = total - glyphCells
const perSide = bufferCount / 2

const cols = [...P.text].reduce((a, c, i) => a + { A: 4, I: 3, K: 4, O: 4, R: 4, E: 3 }[c] + (i ? P.space : 0), 0)
const cell = compact ? P.compactCell : P.cell
const x0 = P.center[0] - ((cols - 1) * cell) / 2
const x1 = P.center[0] + ((cols - 1) * cell) / 2

const dt = 1 / 60
const hist = new Array(perSide + 1).fill(0)
let maxLeft = 0
let maxRight = 0
let frames = 0
let offstage = 0
const m = new (await import('three')).Matrix4()
const filled = (i) => {
  decks.getMatrixAt(i, m)
  return m.elements[0] !== 0
}

for (let i = 0; i < Math.round(Number(process.argv[2] ?? 600) / dt); i++) {
  plaza.update(dt)
  if (i % 6) continue
  frames++
  let l = 0
  let r = 0
  for (let k = 0; k < perSide; k++) if (filled(glyphCells + k)) l++
  for (let k = perSide; k < bufferCount; k++) if (filled(glyphCells + k)) r++
  maxLeft = Math.max(maxLeft, l)
  maxRight = Math.max(maxRight, r)
  hist[l]++
  hist[r]++
  for (const [x] of [[lead.x], ...rigs.map((g) => [g.position.x])]) {
    if (x < x0 - 12 || x > x1 + 12) offstage++
  }
}

console.log(
  JSON.stringify({
    compact,
    perSideSlots: perSide,
    maxStack: [maxLeft, maxRight],
    stackHistogram: hist.map((n, k) => `${k}장:${((n / (frames * 2)) * 100).toFixed(0)}%`),
    offstagePct: +((offstage / (frames * (rigs.length + 1))) * 100).toFixed(1),
  }),
)
