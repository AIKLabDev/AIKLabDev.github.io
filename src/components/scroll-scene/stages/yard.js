import { BoxGeometry, Group, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { forkHeights } from '../../../data/heroStages'
import { clamp, lerp, smoothstep } from '../../../lib/math'
import { cloneProp, createForklift, createLoadedPallet, dockOffset, palletRise } from '../forklift/model'
import { boxProp, palletProp, rackProp, vehicle } from '../forklift/rig.generated'

const RACK_YAW = Math.PI / 2
// 두 켜 × 두 줄이 칸(기둥 사이 1.45 × 깊이 1.10m)에 들어가는 한계다
const STACK = { columns: 2, rows: 2, layers: [2, 3] }

/** 원본 메시를 `size` 로 늘린 값들 */
function rackMetrics(R, compact) {
  const scale = new Vector3(...R.size.map((v, i) => v / rackProp.size[i]))
  return {
    scale,
    slots: R.slots.map((y) => y * scale.y),
    decks: R.decks.slice(0, compact ? 2 : R.decks.length - 1).map((z) => z * scale.z),
  }
}

const mulberry = (seed) => () => {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = Math.imul(seed ^ (seed >>> 15), seed | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const wrapSigned = (value, period) => {
  const half = period / 2
  return (((value + half) % period) + period) % period - half
}

const reveal = (x, appear, leave) =>
  (1 - smoothstep((x - appear[1]) / (appear[0] - appear[1]))) *
  smoothstep((x - leave[1]) / (leave[0] - leave[1]))

function createRackPallet(color) {
  const [depth, width, height] = palletProp.size
  const board = 0.03
  const parts = [new BoxGeometry(width, depth, board).translate(0, 0, height - board / 2)]
  for (const side of [-1, 0, 1]) {
    parts.push(
      new BoxGeometry(0.16, depth, height - board).translate(
        side * (width / 2 - 0.08),
        0,
        (height - board) / 2,
      ),
    )
  }
  return {
    geometry: mergeGeometries(parts),
    material: new MeshStandardMaterial({ color, metalness: 0.5, roughness: 1 }),
  }
}

/** 무대 좌표에 그대로 놓이는 차량 한 대. 바퀴는 굴린 거리로 돈다 */
export function createUnit(library, { load = false } = {}) {
  const group = new Group()
  const body = new Group()
  body.position.z = vehicle.rideHeight
  const forklift = createForklift(library)
  body.add(forklift.root)
  group.add(body)

  const pallet = load ? createLoadedPallet(library) : null
  if (pallet) {
    pallet.position.set(dockOffset.x, dockOffset.y, 0)
    group.add(pallet)
  }

  let spin = 0
  return {
    group,
    pallet,
    roll: (distance) => {
      spin += distance / vehicle.frontWheelRadius
    },
    setPose(x, y, yaw, fork) {
      group.position.set(x, y, 0)
      group.rotation.z = yaw
      forklift.setJoints({
        fork_lift_joint: fork,
        front_left_wheel_joint: spin,
        rear_left_wheel_joint: (spin * vehicle.frontWheelRadius) / vehicle.rearWheelRadius,
      })
      if (pallet) pallet.position.z = palletRise(fork)
    },
  }
}

export function createYard(library, Y, { compact = false } = {}) {
  const R = Y.rack
  const group = new Group()
  const span = compact ? R.compactSpan : R.span
  const rows = compact ? R.rows.slice(0, 1) : R.rows
  const units = Math.round(span / R.spacing)
  const metrics = rackMetrics(R, compact)
  const { decks, slots } = metrics
  const rnd = mulberry(R.seed)

  const held = compact ? null : { every: Y.loader.every, slot: Y.loader.slot, deck: 0 }
  const heldSpan = held ? R.spacing * held.every : 0
  const heldX = held ? slots[held.slot] : 0

  const matrix = new Matrix4()
  const position = new Vector3()
  const plain = new Vector3(1, 1, 1)
  const upright = new Quaternion()
  const turned = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), RACK_YAW)

  const seats = []
  for (let u = 0; u < units; u++) {
    for (let deck = 0; deck < decks.length; deck++) {
      for (let slot = 0; slot < slots.length; slot++) {
        if (rnd() > R.fill) continue
        if (held && u % held.every === 0 && deck === held.deck && slot === held.slot) continue
        seats.push({
          x: u * R.spacing + slots[slot],
          z: decks[deck],
          layers: STACK.layers[Math.floor(rnd() * STACK.layers.length)],
        })
      }
    }
  }

  const deckPallet = createRackPallet(R.palletColor)
  const laps = [-1, 0, 1]

  const lanes = rows.map((y) => {
    const lane = new Group()
    lane.position.y = y

    const shelves = new InstancedMesh(library.rackGeometry, library.rackMaterial.clone(), units * 3)
    shelves.frustumCulled = false
    for (let i = -units; i < units * 2; i++) {
      shelves.setMatrixAt(
        i + units,
        matrix.compose(position.set(i * R.spacing, 0, 0), turned, metrics.scale),
      )
    }
    shelves.instanceMatrix.needsUpdate = true
    lane.add(shelves)

    const pallets = new InstancedMesh(
      deckPallet.geometry,
      deckPallet.material,
      seats.length * laps.length,
    )
    pallets.frustumCulled = false
    let seated = 0

    const cargo = []
    for (const lap of laps) {
      for (const seat of seats) {
        const sx = seat.x + lap * span
        pallets.setMatrixAt(seated++, matrix.compose(position.set(sx, 0, seat.z), upright, plain))
        for (let layer = 0; layer < seat.layers; layer++) {
          for (let cx = 0; cx < STACK.columns; cx++) {
            for (let cy = 0; cy < STACK.rows; cy++) {
              cargo.push(
                sx + (cx - (STACK.columns - 1) / 2) * boxProp.size[0],
                (cy - (STACK.rows - 1) / 2) * boxProp.size[1],
                // 두 메시 다 원점이 바닥면이다 — 절반을 더하면 공중에 뜬다
                seat.z + palletProp.size[2] + boxProp.size[2] * layer,
              )
            }
          }
        }
      }
    }
    pallets.instanceMatrix.needsUpdate = true
    lane.add(pallets)

    const count = cargo.length / 3
    const boxes = new InstancedMesh(library.boxGeometry, library.boxMaterial.clone(), count)
    boxes.frustumCulled = false
    for (let i = 0; i < count; i++) {
      position.set(cargo[i * 3], cargo[i * 3 + 1], cargo[i * 3 + 2])
      boxes.setMatrixAt(i, matrix.compose(position, upright, plain))
    }
    boxes.instanceMatrix.needsUpdate = true
    lane.add(boxes)

    group.add(lane)
    return lane
  })

  const floor = new Group()
  for (const [x, y, levels, yaw = 0, layers] of Y.floor) {
    if (compact && Math.abs(y) > 8) continue
    for (const lap of laps) {
      const stack = createLoadedPallet(library, { levels, layers })
      stack.position.set((x % span) + lap * span, y, 0)
      stack.rotation.z = yaw
      floor.add(stack)
    }
  }
  group.add(floor)

  const fleet = (compact ? Y.fleet.slice(0, 1) : Y.fleet).map((spec) => ({
    spec,
    unit: createUnit(library, { load: spec.load }),
  }))
  for (const { unit } of fleet) group.add(unit.group)

  const L = Y.loader
  const loader = held ? createRackLoader(library, L, R, R.rows[L.lane], decks[held.deck]) : null
  if (loader) group.add(loader.group)
  let reached = null
  let working = 0
  let flowed = null

  return {
    group,
    floor,
    update(travelled, dt, time) {
      const shift = -(((travelled % span) + span) % span)
      for (const lane of lanes) lane.position.x = shift
      floor.position.x = shift

      for (const { spec, unit } of fleet) {
        const x = wrapSigned(spec.base + spec.speed * time - travelled, Y.fleetSpan)
        unit.roll(Math.abs(spec.speed) * dt)
        unit.setPose(x, spec.y, spec.speed < 0 ? Math.PI : 0, forkHeights.travel)
        unit.group.userData.fade = reveal(x, Y.appear, Y.leave)
      }

      if (loader) {
        const x = wrapSigned(heldX - travelled, heldSpan)
        loader.group.position.x = x

        if (reached === null || Math.abs(x - reached) > heldSpan / 2) {
          reached = x
          working = 0
        } else {
          reached = Math.min(reached, x)
        }

        const flow = flowed === null ? 0 : Math.abs(travelled - flowed)
        flowed = travelled
        working = Math.min(1, working + Math.max(flow, L.pace * dt) / heldSpan)
        loader.update(working, reached)
      }
    },
  }
}

/** 좌표는 세계(주행 거리) 기준이다 — 호출부가 `-travelled` 로 민다 */
export function createDockYard(library, D) {
  const T = D.truck
  const Q = D.queue
  const group = new Group()

  const bedX = T.stop + dockOffset.x
  const rnd = mulberry(D.seed)

  const trucks = T.stocked.map((count) => {
    const bay = new Group()
    bay.position.y = T.y
    const body = cloneProp(library.truck)
    body.rotation.z = -Math.PI / 2
    bay.add(body)

    for (let i = 1; i <= count; i++) {
      const stack = createLoadedPallet(library)
      stack.position.set(bedX + i * T.pitch, (rnd() - 0.5) * T.jitter[1], T.bed)
      stack.rotation.z = (rnd() - 0.5) * T.jitter[0]
      bay.add(stack)
    }

    const taken = createLoadedPallet(library)
    taken.position.set(bedX, 0, T.bed)
    taken.userData.fade = 0
    bay.add(taken)

    group.add(bay)
    return { bay, taken, index: 0 }
  })

  trucks.forEach((truck, i) => {
    truck.index = i - (trucks.length - 2)
    truck.taken.userData.fade = truck.index < 0 ? 1 : 0
  })

  const queue = Array.from({ length: Q.count }, (_, i) => {
    const pallet = createLoadedPallet(library)
    group.add(pallet)
    return { pallet, index: i, taken: false }
  })

  const slotOf = (station) => Math.round(station / D.stride)

  /** 뒤로 충분히 빠진 것을 한 바퀴 앞으로 되돌린다 */
  const rewind = (x, at, lap) => (x < at ? Math.ceil((at - x) / lap) : 0)

  return {
    group,

    stationAfter: (travelled) => Math.ceil((travelled + D.run) / D.stride) * D.stride,

    clear(station) {
      const slot = slotOf(station)
      for (const q of queue) if (q.index < slot) q.taken = true
    },

    handoff(station) {
      const truck = trucks.find((t) => t.index === slotOf(station))
      if (truck) truck.taken.userData.fade = 1
    },

    take(station) {
      const q = queue.find((item) => item.index === slotOf(station))
      if (q) q.taken = true
    },

    update(travelled, ahead = 1) {
      // 물러남은 자리가 아니라 흐른 거리로 잰다
      const retire = (item, x) => {
        if (ahead > 0.98 && x > D.linger.truck) item.retiredAt = null
        else if (item.retiredAt == null && ahead < 0.5 && x > D.linger.truck)
          item.retiredAt = travelled
        return item.retiredAt == null
          ? 1
          : 1 - smoothstep((travelled - item.retiredAt) / D.linger.run)
      }

      const queueLap = queue.length * D.stride
      for (const q of queue) {
        let x = q.index * D.stride - travelled
        const laps = rewind(x, Q.reset, queueLap)
        if (laps) {
          q.index += laps * queue.length
          q.taken = false
          x += laps * queueLap
        }
        q.pallet.position.set(x + dockOffset.x, dockOffset.y, 0)
        q.pallet.userData.fade = q.taken ? 0 : reveal(x, Q.appear, Q.leave) * ahead
      }

      const truckLap = trucks.length * D.stride
      for (const truck of trucks) {
        let x = truck.index * D.stride + T.x - travelled
        const laps = rewind(x, T.reset, truckLap)
        if (laps) {
          truck.index += laps * trucks.length
          truck.taken.userData.fade = 0
          x += laps * truckLap
        }
        truck.bay.position.x = x
        truck.bay.userData.fade = reveal(x, T.appear, T.leave) * retire(truck, x)
      }
    },
  }
}

function createRackLoader(library, L, R, laneY, deck) {
  const group = new Group()

  const unit = createUnit(library, { load: true })
  group.add(unit.group)

  // 팔레트는 앞 빔에 맞춰 놓는다 — 안쪽으로 들이밀면 마스트가 랙 안으로 들어간다
  const seat = laneY - R.size[0] / 2 + palletProp.size[0] / 2

  const shelved = createLoadedPallet(library)
  shelved.rotation.z = RACK_YAW
  shelved.position.set(0, seat, deck)
  group.add(shelved)

  const deckFork = deck + forkHeights.entry
  const QUARTER = Math.PI / 2
  /** 호 끝난 뒤 칸까지 곧게 남은 거리 — 팔레트 깊이(1.02m)보다 길어야 한다 */
  const lead = seat - L.aisle - L.radius

  const RUN = 0.34
  const TURN_IN = 0.41
  const PUSH = 0.45
  const PLACE = 0.55
  const BACK = 0.59
  const TURN_OUT = 0.66

  let lastAlong = null
  let lastAcross = 0

  return {
    group,
    update(p, reached) {
      const run = smoothstep(p / RUN)
      const push = smoothstep((p - TURN_IN) / (PUSH - TURN_IN))
      const lowering = smoothstep((p - PUSH) / 0.05)
      const handed = smoothstep((p - PUSH - 0.05) / 0.05)
      const back = smoothstep((p - PLACE) / (BACK - PLACE))
      const depart = smoothstep((p - TURN_OUT) / (1 - TURN_OUT))
      const turnIn = QUARTER * smoothstep((p - RUN) / (TURN_IN - RUN))
      const turnOut = QUARTER * smoothstep((p - BACK) / (TURN_OUT - BACK))

      const along =
        (L.approach - L.radius) * (1 - run) +
        L.radius * (1 - Math.sin(turnIn)) +
        L.radius * (1 - Math.cos(turnOut)) -
        L.exit * depart
      const across =
        L.aisle + L.radius * (1 - Math.cos(turnIn)) + lead * (push - back) - L.radius * Math.sin(turnOut)
      const yaw = Math.PI - turnIn + turnOut

      const cos = Math.cos(yaw)
      const sin = Math.sin(yaw)
      const x = along - (cos * dockOffset.x - sin * dockOffset.y)
      const y = across - (sin * dockOffset.x + cos * dockOffset.y)

      const moved = lastAlong === null ? 0 : Math.hypot(along - lastAlong, across - lastAcross)
      // 한 바퀴가 접히는 프레임은 건너뛴다 — 통로 전체 길이가 한 번에 굴러 들어온다
      if (moved < 5) unit.roll(moved)
      lastAlong = along
      lastAcross = across

      const fork = lerp(
        lerp(lerp(forkHeights.carry, deckFork + L.clear, push), deckFork, lowering),
        forkHeights.travel,
        turnOut / QUARTER,
      )
      unit.setPose(x, y, yaw, fork)
      unit.pallet.userData.fade = clamp(1 - handed, 0, 1)
      unit.group.userData.fade = reveal(reached + along, L.appear, L.leave)
      shelved.userData.fade = handed * reveal(reached, L.shelf.appear, L.shelf.leave)
    },
  }
}
