import { BoxGeometry, Group, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { forkHeights } from '../../../data/heroStages'
import { clamp, lerp, smoothstep } from '../../../lib/math'
import { dockOffset } from '../forklift/model'
import { boxProp, palletProp, vehicle } from '../forklift/rig.generated'
import { createUnit } from './yard'

/** 행은 위에서 아래로, 열은 왼쪽에서 오른쪽으로 */
const GLYPHS = {
  A: ['.##.', '#..#', '#..#', '####', '#..#', '#..#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '###'],
  K: ['#..#', '#.#.', '##..', '##..', '#.#.', '#..#'],
  O: ['.##.', '#..#', '#..#', '#..#', '#..#', '.##.'],
  R: ['###.', '#..#', '#..#', '###.', '#.#.', '#..#'],
  E: ['###', '#..', '###', '#..', '#..', '###'],
}

const LAYOUT = { columns: 2, rows: 3, layers: 3 }

const FACING = Math.PI / 2

const CRUISE = 3.8
const ACCEL = 2
const LATERAL = 4.2
const CREEP = 1.25
const CREEP_ACCEL = 1.2
const PIVOT = 2.4
const HANDLE = 2.8
const LINGER = 2.6

const BODY = (vehicle.extent.min[0] + vehicle.extent.max[0]) / 2
const PROBE = 0.1
const WAITS = [0, 1.2, 2.6, 4.4]

const TAU = Math.PI * 2
const wrap = (a) => a - TAU * Math.round(a / TAU)
const off = (p, h, r) => ({ x: p.x + Math.cos(h) * r, y: p.y + Math.sin(h) * r })

const mulberry = (seed) => () => {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = Math.imul(seed ^ (seed >>> 15), seed | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** 거리와 마디별 진행 방향. 양 끝은 접선(`h0`·`h1`)을 그대로 쓴다 */
function measure(pts, h0, h1) {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  }
  const dirs = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    return Math.atan2(b.y - a.y, b.x - a.x)
  })
  if (h0 !== undefined) dirs[0] = h0
  if (h1 !== undefined) dirs[dirs.length - 1] = h1
  // 이웃끼리 반 바퀴를 넘지 않게 풀어 둔다
  for (let i = 1; i < dirs.length; i++) dirs[i] = dirs[i - 1] + wrap(dirs[i] - dirs[i - 1])
  return { pts, cum, dirs, length: cum[cum.length - 1] }
}

const straight = (a, b) => {
  const h = Math.atan2(b.y - a.y, b.x - a.x)
  return measure([{ x: a.x, y: a.y }, { x: b.x, y: b.y }], h, h)
}

function bend(p0, h0, p1, h1, r0, r1) {
  const c0 = off(p0, h0, r0)
  const c1 = off(p1, h1 + Math.PI, r1)
  const pts = []
  for (let i = 0; i <= 32; i++) {
    const t = i / 32
    const u = 1 - t
    const a = u * u * u
    const b = 3 * u * u * t
    const c = 3 * u * t * t
    const d = t * t * t
    pts.push({
      x: a * p0.x + b * c0.x + c * c1.x + d * p1.x,
      y: a * p0.y + b * c0.y + c * c1.y + d * p1.y,
    })
  }
  return measure(pts, h0, h1)
}

/** 이 길에서 가장 좁게 도는 자리의 반지름 */
function tightest(path) {
  const { cum, dirs } = path
  let r = Infinity
  for (let i = 1; i < dirs.length; i++) {
    const turn = Math.abs(dirs[i] - dirs[i - 1])
    if (turn > 1e-6) r = Math.min(r, (cum[i] - cum[i - 1]) / turn)
  }
  return r
}

const MIN_RADIUS = 1.8
const SCALES = [1, 1.25, 1.5, 0.72, 0.5]
const TURNAROUND = 4

/** 양 끝의 방향(`h0`, `h1`)이 그대로 접선인 3차 곡선. `MIN_RADIUS` 를 지키는 가장 긴 팔을 쓴다 */
function arc(p0, h0, p1, h1, r0, r1 = r0) {
  let best = null
  let widest = -Infinity
  for (const k of SCALES) {
    const path = bend(p0, h0, p1, h1, r0 * k, r1 * k)
    const r = tightest(path)
    if (r >= MIN_RADIUS) return path
    if (r > widest) {
      widest = r
      best = path
    }
  }
  return best
}

const join = (...parts) => {
  const last = parts[parts.length - 1]
  return measure(
    parts.flatMap((p, i) => (i === 0 ? p.pts : p.pts.slice(1))),
    parts[0].dirs[0],
    last.dirs[last.dirs.length - 1],
  )
}

/** 매 프레임 도는 자리라 새 객체를 만들지 않는다 */
const sample = { x: 0, y: 0, yaw: 0 }

/** 길 위에서 `s` 만큼 간 자리와 그때의 진행 방향 */
function sampleAt(path, s) {
  const { pts, cum, dirs } = path
  const d = clamp(s, 0, path.length)
  let i = 1
  while (i < cum.length - 1 && cum[i] < d) i++
  const span = cum[i] - cum[i - 1]
  const t = span > 0 ? (d - cum[i - 1]) / span : 0
  sample.x = lerp(pts[i - 1].x, pts[i].x, t)
  sample.y = lerp(pts[i - 1].y, pts[i].y, t)
  sample.yaw = lerp(dirs[i - 1], dirs[i], t)
  return sample
}

/** 등가속 → 순항 → 등감속 */
function profile(len, vc, acc, v0 = 0, v1 = 0) {
  const span = Math.max(len, 1e-4)
  const lid = Math.sqrt(2 * acc * span)
  const a = Math.min(v0, vc, lid)
  const b = Math.min(v1, vc, lid)
  const peak = Math.min(vc, Math.sqrt((2 * acc * span + a * a + b * b) / 2))
  const up = (peak - a) / acc
  const down = (peak - b) / acc
  const flat = Math.max(0, span - (2 * peak * peak - a * a - b * b) / (2 * acc)) / peak
  return { len: span, acc, v0: a, v1: b, peak, up, flat, dur: up + flat + down }
}

/** 이 궤적이 `t` 초에 지나온 거리 */
function ranAt(p, t) {
  if (t <= 0) return 0
  if (t >= p.dur) return p.len
  if (t < p.up) return p.v0 * t + 0.5 * p.acc * t * t
  const rise = (p.peak * p.peak - p.v0 * p.v0) / (2 * p.acc)
  if (t < p.up + p.flat) return rise + p.peak * (t - p.up)
  const d = t - p.up - p.flat
  return rise + p.peak * (p.flat + d) - 0.5 * p.acc * d * d
}

function glyphCells(text, space) {
  const cells = []
  const gaps = []
  let col = 0
  ;[...text].forEach((ch, g) => {
    const glyph = GLYPHS[ch]
    if (!glyph) throw new Error(`글리프가 없습니다: ${ch}`)
    for (let r = 0; r < glyph.length; r++) {
      for (let c = 0; c < glyph[r].length; c++) {
        if (glyph[r][c] === '#') cells.push({ col: col + c, row: r, glyph: g })
      }
    }
    col += glyph[0].length
    if (g < text.length - 1) {
      gaps.push(col + (space - 1) / 2)
      col += space
    }
  })
  return { cells, columns: col, rows: GLYPHS[text[0]].length, gaps }
}

/** 팔레트 실물 메시는 4,390 삼각형이라 인스턴싱에 그대로 쓰지 못한다 */
function createDeck(color) {
  const [depth, width, height] = palletProp.size
  const board = 0.03
  const parts = [new BoxGeometry(depth, width, board).translate(0, 0, height - board / 2)]
  for (const side of [-1, 0, 1]) {
    parts.push(
      new BoxGeometry(depth, 0.16, height - board).translate(0, side * (width / 2 - 0.08), (height - board) / 2),
    )
  }
  return {
    geometry: mergeGeometries(parts),
    material: new MeshStandardMaterial({ color, metalness: 0.5, roughness: 1 }),
  }
}

export function createPlaza(P, { library, compact = false } = {}) {
  const group = new Group()
  const { cells, columns: colCount, rows, gaps } = glyphCells(P.text, P.space)
  const cell = compact ? P.compactCell : P.cell

  const width = (colCount - 1) * cell
  const height = (rows - 1) * cell
  const originX = P.center[0] - width / 2
  const originY = P.center[1] + height / 2

  const rnd = mulberry(P.seed)
  const seats = cells.map((c) => ({
    col: c.col,
    row: c.row,
    glyph: c.glyph,
    x: originX + c.col * cell + (rnd() - 0.5) * P.jitter.offset,
    y: originY - c.row * cell + (rnd() - 0.5) * P.jitter.offset,
    yaw: FACING + (rnd() - 0.5) * P.jitter.yaw,
  }))

  const B = P.buffer
  const stacked = []
  const firstRow = Math.floor((rows - B.rows) / 2)
  for (const [col, x] of [
    [-1, originX - B.out],
    [colCount, originX + width + B.out],
  ]) {
    for (let k = 0; k < B.rows; k++) {
      seats.push({
        col,
        row: firstRow + k,
        glyph: -1,
        x: x + (rnd() - 0.5) * P.jitter.offset,
        y: originY - (firstRow + k) * cell + (rnd() - 0.5) * P.jitter.offset,
        yaw: FACING + (rnd() - 0.5) * P.jitter.yaw,
      })
      stacked.push(k >= (B.rows - B.stock) / 2 && k < (B.rows + B.stock) / 2)
    }
  }
  const glyphCount = seats.length - stacked.length

  const front = { key: 'front', gateY: originY - height - P.gate, flip: 0, away: -1, swing: 0.72 }
  const back = { key: 'back', gateY: originY + P.gate, flip: Math.PI, away: 1, swing: 1.15 }
  const rails = { front, back }
  const railList = [front, back]

  const corridors = gaps.map((g) => originX + g * cell)
  const corridorFor = (from, to, rank) => {
    const mid = (from + to) / 2
    const clear = (c) => Math.abs(c - from) > TURNAROUND && Math.abs(c - to) > TURNAROUND
    const pool = corridors.filter(clear)
    const usable = (pool.length ? pool : corridors)
      .slice()
      .sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))
    return usable[Math.min(usable.length - 1, rank)]
  }

  const lanes = []
  const byColumn = new Map()
  seats.forEach((seat, i) => {
    let lane = byColumn.get(seat.col)
    if (!lane) {
      lane = { col: seat.col, glyph: seat.glyph, x: seat.x, front: [], back: [] }
      byColumn.set(seat.col, lane)
      lanes.push(lane)
    }
    lane.front.push(i)
  })
  for (const lane of lanes) {
    lane.front.sort((a, b) => seats[b].row - seats[a].row)
    lane.back = lane.front.slice().reverse()
    lane.x = seats[lane.front[0]].x
  }

  const dockOf = (seat, rail) => {
    const yaw = seat.yaw + rail.flip
    const cos = Math.cos(yaw)
    const sin = Math.sin(yaw)
    return {
      x: seat.x - (cos * dockOffset.x - sin * dockOffset.y),
      y: seat.y - (sin * dockOffset.x + cos * dockOffset.y),
      yaw,
      rail,
    }
  }

  const gateOf = (seat, rail) => {
    const dock = dockOf(seat, rail)
    const run = (dock.y - rail.gateY) / Math.sin(dock.yaw)
    return { x: dock.x - Math.cos(dock.yaw) * run, y: rail.gateY, yaw: dock.yaw, rail }
  }

  const wingOf = (rail, side, facing) => ({
    x: side === 'left' ? originX - P.wing.out : originX + width + P.wing.out,
    y: rail.gateY + rail.away * P.wing.drop,
    yaw: (side === 'left') === (facing === 'out') ? Math.PI : 0,
    rail,
    turn: false,
  })

  // fog 를 끄면 실린 화물과 놓인 화물의 밝기가 달라진다
  const crate = library.boxMaterial.clone()
  const perCell = LAYOUT.columns * LAYOUT.rows * LAYOUT.layers
  const boxes = new InstancedMesh(library.boxGeometry, crate, seats.length * perCell)
  boxes.frustumCulled = false
  group.add(boxes)

  const deck = createDeck(P.palletColor)
  const decks = new InstancedMesh(deck.geometry, deck.material, seats.length)
  decks.frustumCulled = false
  group.add(decks)

  const local = []
  for (let layer = 0; layer < LAYOUT.layers; layer++) {
    for (let row = 0; row < LAYOUT.rows; row++) {
      for (let column = 0; column < LAYOUT.columns; column++) {
        local.push(
          new Matrix4().makeTranslation(
            (column - (LAYOUT.columns - 1) / 2) * boxProp.size[0],
            (row - (LAYOUT.rows - 1) / 2) * boxProp.size[1],
            palletProp.size[2] + boxProp.size[2] * layer,
          ),
        )
      }
    }
  }

  const spin = new Quaternion()
  const axis = new Vector3(0, 0, 1)
  const one = new Vector3(1, 1, 1)
  const gone = new Matrix4().makeScale(0, 0, 0)
  const scratch = new Matrix4()
  const base = seats.map((seat) =>
    new Matrix4().compose(new Vector3(seat.x, seat.y, 0), spin.setFromAxisAngle(axis, seat.yaw), one),
  )

  let dirty = false
  const occupied = new Uint8Array(seats.length).fill(1)
  const glyphHoles = new Int32Array(P.text.length)
  let holes = 0

  const setSeat = (i, value) => {
    if (occupied[i] === value) return
    occupied[i] = value
    dirty = true
    const g = seats[i].glyph
    if (g < 0) return
    const step = value === 0 ? 1 : -1
    glyphHoles[g] += step
    holes += step
  }

  const writeSeat = (i) => {
    const on = occupied[i] === 1
    decks.setMatrixAt(i, on ? base[i] : gone)
    for (let b = 0; b < perCell; b++) {
      boxes.setMatrixAt(i * perCell + b, on ? scratch.multiplyMatrices(base[i], local[b]) : gone)
    }
  }

  const letterLanes = lanes.filter((l) => l.glyph >= 0)
  const shuffled = letterLanes.slice()
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const seeded = shuffled[0]
  setSeat(seeded.front[0], 0)
  setSeat(shuffled.find((l) => l.glyph !== seeded.glyph).back[0], 0)
  stacked.forEach((on, k) => {
    if (!on) setSeat(glyphCount + k, 0)
  })
  for (let i = 0; i < seats.length; i++) writeSeat(i)
  boxes.instanceMatrix.needsUpdate = true
  decks.instanceMatrix.needsUpdate = true

  const busy = new Set()
  /** 아직 구멍이 나지는 않았지만 이번에 집기로 한 글자 */
  const claimed = new Set()

  /** 드나드는 쪽이 다 빈 열에서 맨 앞의 화물과, 채울 수 있는 가장 안쪽 빈 자리 */
  const reach = (lane, rail) => {
    const o = lane[rail.key]
    let e = 0
    while (e < o.length && !occupied[o[e]]) e++
    return { take: e < o.length ? o[e] : -1, give: e > 0 ? o[e - 1] : -1 }
  }

  /** 적치대에 지금 쌓여 있는 장수 */
  const stackOf = (lane) => lane.front.reduce((n, i) => n + occupied[i], 0)

  const order = (list, from, bias) => {
    const pool = list.slice().sort((a, b) => Math.abs(a.x - from) - Math.abs(b.x - from))
    const out = []
    while (pool.length) {
      out.push(pool.splice(Math.min(pool.length - 1, Math.floor(Math.pow(rnd(), bias) * pool.length)), 1)[0])
    }
    return out
  }

  const cross = P.cross * (cell / P.cell)
  const spread = (lane, rail, from, far = 0) =>
    Math.abs(lane.x - from.x) >= (rail === from.rail ? P.stride : far)

  const takeFrom = (from) => {
    const spare = holes + claimed.size < P.damage
    const options = []
    for (const lane of lanes) {
      if (busy.has(lane.col)) continue
      if (lane.glyph >= 0 ? !spare || glyphHoles[lane.glyph] > 0 || claimed.has(lane.glyph) : holes === 0) continue
      for (const rail of railList) {
        if (reach(lane, rail).take >= 0 && spread(lane, rail, from)) {
          options.push({ lane, rail, x: lane.x })
        }
      }
    }
    return order(options, from.x, 1.7)
  }

  const giveTo = (from, exclude, staged, pick) => {
    const options = []
    for (const lane of lanes) {
      if (busy.has(lane.col) || (lane.glyph >= 0 && lane.glyph === exclude)) continue
      if (lane.glyph < 0 && (staged || stackOf(lane) >= B.cap)) continue
      for (const rail of railList) {
        if (reach(lane, rail).give >= 0 && spread(lane, rail, pick ?? from, cross)) {
          options.push({ lane, rail, x: lane.x })
        }
      }
    }
    return order(options, from.x, 1.3)
  }

  const travelFork = (carry) => (carry ? forkHeights.carry : forkHeights.travel)

  const units = (compact ? P.units.slice(0, P.compactUnits) : P.units).map((spec, i) => ({
    spec,
    bow: spec.bow,
    lean: spec.lean,
    solo: i === 0,
    unit: i === 0 ? null : createUnit(library, { load: true }),
    at: null,
    carry: false,
    off: false,
    takes: 0,
    source: -1,
    staged: false,
    picked: null,
    gone: 'left',
    start: null,
    job: null,
    plan: null,
    last: null,
  }))
  for (const u of units) if (u.unit) group.add(u.unit.group)

  units.forEach((u, i) => {
    const lane = shuffled[(i * 5 + 3) % shuffled.length]
    const rail = rails[u.spec.side]
    u.at = { ...gateOf(seats[lane[rail.key][0]], rail), turn: true }
  })

  const awayEvery = compact ? 0 : P.away

  /** commit 이 호출되기 전까지는 아무것도 잡지 않는다 */
  function composeJob(u, spot, wait, holdFor = 0) {
    const j = {
      segs: [],
      acts: [],
      frees: [],
      dur: 0,
      cols: [],
      claim: -1,
      gone: null,
      end: u.at,
      endCarry: u.carry,
      endOff: u.off,
      source: u.source,
      staged: u.staged,
      picked: u.picked,
      took: false,
    }
    let pose = u.at
    let carry = u.carry

    const push = (seg) => {
      seg.t0 = j.dur
      j.dur += seg.dur
      j.segs.push(seg)
    }

    const stand = (dur) => {
      const a1 = pose.yaw + (rnd() - 0.5) * 0.6
      push({ kind: 'turn', p: pose, a0: pose.yaw, a1, dur, f: travelFork(carry), carry })
      pose = { ...pose, yaw: a1, turn: true }
    }

    /** `exit` 은 다음 구간에 넘겨줄 속도다. 0 이면 도착한 자리에서 선다 */
    const drive = (to, endFork, exit = 0) => {
      const f = travelFork(carry)
      const crossing = pose.rail !== to.rail
      const lane = crossing ? corridorFor(pose.x, to.x, u.spec.gap) : to.x
      const first = crossing ? { x: lane, y: pose.rail.gateY } : to
      let h = pose.yaw
      if (pose.turn) {
        const straightAt = Math.atan2(first.y - pose.y, first.x - pose.x)
        const aim =
          Math.hypot(first.x - pose.x, first.y - pose.y) < 0.6
            ? pose.yaw + Math.PI
            : straightAt + pose.rail.away * Math.sign(Math.cos(straightAt)) * u.lean
        h = pose.yaw + wrap(aim - pose.yaw)
        push({
          kind: 'turn',
          p: pose,
          a0: pose.yaw,
          a1: h,
          dur: PIVOT * clamp(Math.abs(h - pose.yaw) / Math.PI, 0.32, 1),
          f,
          carry,
        })
      }
      const reachOf = (a, b, rail) =>
        (clamp(Math.hypot(b.x - a.x, b.y - a.y) * 0.42, 2.4, 10) + u.bow) * rail.swing

      let path
      if (crossing) {
        const inlet = { x: lane, y: pose.rail.gateY, yaw: pose.rail.flip ? -FACING : FACING }
        const outlet = { x: lane, y: to.rail.gateY, yaw: inlet.yaw }
        path = join(
          arc(pose, h, inlet, inlet.yaw, reachOf(pose, inlet, pose.rail)),
          straight(inlet, outlet),
          arc(outlet, outlet.yaw, to, to.yaw, reachOf(outlet, to, to.rail)),
        )
      } else {
        path = arc(pose, h, to, to.yaw, reachOf(pose, to, to.rail))
      }
      const prof = profile(path.length, Math.min(CRUISE, Math.sqrt(LATERAL * tightest(path))), ACCEL, 0, exit)
      push({ kind: 'move', path, prof, dur: prof.dur, dir: 1, f0: f, f1: endFork, carry })
      pose = { x: to.x, y: to.y, yaw: to.yaw, rail: to.rail, turn: false }
      return prof.v1
    }

    /** 화물 하나를 집거나(`fill` 이 0) 내려놓는다(1) */
    const visit = (index, fill, col, rail) => {
      const seat = seats[index]
      const dock = dockOf(seat, rail)
      const gate = gateOf(seat, rail)
      const held = fill === 1 ? forkHeights.carry : forkHeights.entry
      const rest = fill === 1 ? forkHeights.entry : forkHeights.carry
      // 화물이 자리를 바꾸는 순간은 갈래가 바닥 높이(entry)를 지날 때다
      const swap = fill === 0 ? 0.03 : 0.97

      const inbound = straight(gate, dock)
      const entry = drive(gate, held, Math.min(CREEP, Math.sqrt(2 * CREEP_ACCEL * inbound.length)))
      const into = profile(inbound.length, CREEP, CREEP_ACCEL, entry, 0)
      push({ kind: 'move', path: inbound, prof: into, dur: into.dur, dir: 1, f0: held, f1: held, carry })
      push({ kind: 'hold', p: dock, a: dock.yaw, dur: HANDLE, f0: held, f1: rest, carry, next: fill === 0, swap })
      j.acts.push({ at: j.dur - HANDLE * (1 - swap), seat: index, fill, glyph: seat.glyph, done: false })
      carry = fill === 0
      const outbound = straight(dock, gate)
      const out = profile(outbound.length, CREEP, CREEP_ACCEL)
      push({ kind: 'move', path: outbound, prof: out, dur: out.dur, dir: -1, f0: rest, f1: rest, carry })
      j.frees.push({ at: j.dur, col, done: false })
      pose = { x: gate.x, y: gate.y, yaw: gate.yaw, rail, turn: true }
    }

    if (wait > 0) stand(wait)

    if (holdFor > 0) {
      stand(holdFor)
    } else if (carry) {
      if (spot) {
        if (u.off) pose = wingOf(spot.rail, u.gone === 'left' ? 'right' : 'left', 'in')
        j.cols.push(spot.lane.col)
        visit(reach(spot.lane, spot.rail).give, 1, spot.lane.col, spot.rail)
        j.endOff = false
      } else if (u.off) {
        pose = wingOf(pose.rail ?? front, u.gone === 'left' ? 'right' : 'left', 'in')
        push({ kind: 'turn', p: pose, a0: pose.yaw, a1: pose.yaw, dur: 4, f: forkHeights.carry, carry })
      } else if (u.solo) {
        stand(P.wait)
      } else {
        j.gone = pose.x < P.center[0] ? 'left' : 'right'
        drive(wingOf(pose.rail, j.gone, 'out'), forkHeights.carry)
        push({
          kind: 'hold',
          p: pose,
          a: pose.yaw,
          dur: LINGER,
          f0: forkHeights.carry,
          f1: forkHeights.carry,
          carry,
          next: carry,
        })
        j.endOff = true
      }
    } else if (spot) {
      j.cols.push(spot.lane.col)
      j.claim = spot.lane.glyph
      j.source = spot.lane.glyph
      j.staged = spot.lane.glyph < 0
      j.picked = { x: spot.lane.x, rail: spot.rail }
      j.took = true
      visit(reach(spot.lane, spot.rail).take, 0, spot.lane.col, spot.rail)
    } else {
      stand(P.wait)
    }

    j.end = pose
    j.endCarry = carry
    return j
  }

  /** 차체 중심의 자취를 `PROBE` 마다 찍어 둔다 */
  function trace(job, t0) {
    const n = Math.max(2, Math.ceil(job.dur / PROBE) + 1)
    const step = job.dur / (n - 1)
    const xs = new Float64Array(n)
    const ys = new Float64Array(n)
    for (let i = 0; i < n; i++) {
      const p = poseOf(job, i * step)
      xs[i] = p.x + Math.cos(p.yaw) * BODY
      ys[i] = p.y + Math.sin(p.yaw) * BODY
    }
    let still = true
    for (let i = 1; i < n && still; i++) {
      if (Math.hypot(xs[i] - xs[0], ys[i] - ys[0]) > 0.5) still = false
    }
    return { t0, dur: job.dur, step, xs, ys, still }
  }

  const traceAt = (plan, t, out) => {
    const i = plan.step > 0 ? clamp((t - plan.t0) / plan.step, 0, plan.xs.length - 1) : 0
    const a = Math.floor(i)
    const b = Math.min(a + 1, plan.xs.length - 1)
    const f = i - a
    out[0] = lerp(plan.xs[a], plan.xs[b], f)
    out[1] = lerp(plan.ys[a], plan.ys[b], f)
  }

  const mine = [0, 0]
  const yours = [0, 0]
  const probe = (self, plan) => {
    let near = Infinity
    let ok = true
    for (const o of units) {
      if (o === self || !o.plan) continue
      const from = Math.max(plan.t0, o.plan.t0)
      const held = o.plan.still ? Infinity : o.plan.t0 + o.plan.dur + P.park
      const to = Math.min(plan.t0 + plan.dur, held)
      traceAt(plan, from, mine)
      traceAt(o.plan, from, yours)
      const d0 = Math.hypot(mine[0] - yours[0], mine[1] - yours[1])
      for (let t = from; t <= to; t += PROBE) {
        traceAt(plan, t, mine)
        traceAt(o.plan, t, yours)
        const d = Math.hypot(mine[0] - yours[0], mine[1] - yours[1])
        if (d < near) near = d
        if (d < Math.min(P.clear, d0 + P.recover * (t - from))) ok = false
      }
    }
    return { ok, near }
  }

  function buildJob(u, startAbs) {
    const forced = !u.off && !u.solo && awayEvery > 0 && u.takes % awayEvery === 0
    const spots = (
      forced ? [] : u.carry ? giveTo(u.at, u.off ? -1 : u.source, u.staged, u.picked) : takeFrom(u.at)
    ).slice(0, 40)
    let best = null

    const consider = (job) => {
      const plan = trace(job, startAbs)
      const { ok, near } = probe(u, plan)
      if (ok) return { job, plan }
      if (!best || near > best.near) best = { job, plan, near }
      return null
    }

    for (const wait of WAITS) {
      for (const spot of spots) {
        const found = consider(composeJob(u, spot, wait))
        if (found) return found
      }
      const found = consider(composeJob(u, null, wait))
      if (found) return found
    }
    return consider(composeJob(u, null, 0, P.wait)) ?? best
  }
  if (P.wait > P.park) throw new Error('plaza: wait 는 park 를 넘을 수 없습니다')

  function commit(u, { job, plan }) {
    u.job = job
    u.plan = plan
    for (const col of job.cols) busy.add(col)
    if (job.claim >= 0) claimed.add(job.claim)
  }

  function closeJob(u) {
    for (const a of u.job.acts) {
      if (a.done) continue
      setSeat(a.seat, a.fill)
      if (a.fill === 0) claimed.delete(a.glyph)
      a.done = true
    }
    for (const col of u.job.cols) busy.delete(col)
    u.at = u.job.end
    u.carry = u.job.endCarry
    u.off = u.job.endOff
    u.source = u.job.source
    u.staged = u.job.staged
    u.picked = u.job.picked
    if (u.job.gone) u.gone = u.job.gone
    if (u.job.took) u.takes += 1
  }

  function poseOf(job, t) {
    const segs = job.segs
    let seg = segs[segs.length - 1]
    for (const s of segs) {
      if (t < s.t0 + s.dur) {
        seg = s
        break
      }
    }
    if (seg.kind === 'move') {
      const s = ranAt(seg.prof, t - seg.t0)
      const at = sampleAt(seg.path, s)
      return {
        x: at.x,
        y: at.y,
        yaw: at.yaw + (seg.dir > 0 ? 0 : Math.PI),
        fork: lerp(seg.f0, seg.f1, s / seg.prof.len),
        carry: seg.carry,
        dir: seg.dir,
      }
    }
    const p = clamp((t - seg.t0) / seg.dur, 0, 1)
    const e = smoothstep(p)
    if (seg.kind === 'turn') {
      return { x: seg.p.x, y: seg.p.y, yaw: lerp(seg.a0, seg.a1, e), fork: seg.f, carry: seg.carry, dir: 0 }
    }
    return {
      x: seg.p.x,
      y: seg.p.y,
      yaw: seg.a,
      fork: lerp(seg.f0, seg.f1, e),
      carry: p < (seg.swap ?? 1) ? seg.carry : seg.next,
      dir: 0,
    }
  }

  /** 주인공이 대신 모는 차. journeyStage 가 이 자세를 받아 쓴다 */
  const lead = { x: 0, y: 0, yaw: FACING, fork: forkHeights.travel, load: 0, moved: 0 }

  let clock = 0

  return {
    group,
    lead,

    update(dt) {
      clock += Math.min(dt, 0.1)

      for (const u of units) {
        if (u.start === null) {
          u.start = clock - u.spec.delay
          commit(u, buildJob(u, u.start))
        }
        let guard = 0
        while (clock >= u.start + u.job.dur && guard++ < 8) {
          closeJob(u)
          u.start += u.job.dur
          commit(u, buildJob(u, u.start))
        }

        const t = clamp(clock - u.start, 0, u.job.dur)
        for (const a of u.job.acts) {
          if (a.done || t < a.at) continue
          setSeat(a.seat, a.fill)
          if (a.fill === 0) claimed.delete(a.glyph)
          a.done = true
        }
        for (const f of u.job.frees) {
          if (f.done || t < f.at) continue
          busy.delete(f.col)
          f.done = true
        }

        const pose = poseOf(u.job, t)
        const step = u.last === null ? 0 : Math.hypot(pose.x - u.last[0], pose.y - u.last[1])
        const moved = step > 6 ? 0 : step * (pose.dir < 0 ? -1 : 1)
        u.last = [pose.x, pose.y]

        if (u.unit) {
          u.unit.roll(moved)
          u.unit.setPose(pose.x, pose.y, pose.yaw, pose.fork)
          u.unit.pallet.userData.fade = pose.carry ? 1 : 0
        } else {
          lead.x = pose.x
          lead.y = pose.y
          lead.yaw = wrap(pose.yaw)
          lead.fork = pose.fork
          lead.load = pose.carry ? 1 : 0
          lead.moved = moved
        }
      }

      if (!dirty) return
      dirty = false
      for (let i = 0; i < seats.length; i++) writeSeat(i)
      boxes.instanceMatrix.needsUpdate = true
      decks.instanceMatrix.needsUpdate = true
    },
  }
}
