import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
} from 'three'
import { forkHeights, heroStages } from '../../../data/heroStages'
import { clamp, damp, lerp, smoothstep } from '../../../lib/math'
import {
  STEERING_MIMIC,
  createForklift,
  createLoadedPallet,
  dockOffset,
  palletRise,
} from '../forklift/model'
import { palletProp, vehicle } from '../forklift/rig.generated'
import { createFlowRibbon, createOutline } from '../forklift/ribbon'
import { createPointField } from './pointField'

const SENSOR_X = 0.1

/** 주기 안으로 접는다. 결과는 항상 [-period/2, period/2) */
const wrapSigned = (value, period) => {
  const half = period / 2
  return (((value + half) % period) + period) % period - half
}

/** d=0 에서 1, |d|>=w 에서 0 인 매끈한 종 */
const bell = (d, w) => {
  const t = 1 - Math.abs(d) / w
  return t <= 0 ? 0 : t * t * (3 - 2 * t)
}

const basic = (color, opacity) =>
  new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false })

/**
 * 여섯 장을 통째로 도는 하나의 무대.
 *
 * 차량은 원점에 서 있고 세계가 뒤로 흐른다(트레드밀). 그래서 "계속 주행한다"와
 * "장을 오갈 수 있다"가 동시에 성립한다 — 스크롤은 어느 연출을 얼마나 보여줄지만
 * 정하고, 차량은 자기 시간축으로 계속 움직인다.
 */
export function createJourneyStage(library, { compact = false } = {}) {
  const C = heroStages.journey
  const R = C.route
  const D = C.dock
  const group = new Group()

  const truck = createForklift(library)
  const chassis = new Group()
  const body = new Group()
  body.position.z = vehicle.rideHeight
  body.add(truck.root)
  chassis.add(body)
  group.add(chassis)

  // 팔레트 하나가 접근 → 적재 → 운반을 모두 맡는다. 실렸을 때만 차량을 따라간다.
  const load = createLoadedPallet(library)
  load.position.set(dockOffset.x, dockOffset.y, 0)
  chassis.add(load)

  const scan = createScan(C.scan)
  scan.group.position.set(SENSOR_X, 0, C.scan.z)
  chassis.add(scan.group)

  const world = createPointField(C.world, { compact })
  group.add(world.points)

  const obstacles = []
  const marks = []
  for (let i = 0; i < R.count; i++) {
    const prop = createLoadedPallet(library)
    prop.rotation.z = R.yaws[i % R.yaws.length]
    group.add(prop)
    obstacles.push(prop)

    const mark = createOutline({
      width: palletProp.size[0] + R.detection.margin * 2,
      height: palletProp.size[1] + R.detection.margin * 2,
      thickness: R.detection.thickness,
      color: R.detection.color,
      opacity: R.detection.opacity,
    })
    mark.rotation.z = prop.rotation.z
    group.add(mark)
    marks.push(mark)
  }

  const ahead = createFlowRibbon(R.samples, R.plan, 0.014)
  const behind = createFlowRibbon(R.trailSamples, R.laid, 0.012)
  group.add(ahead, behind)

  const bay = createOutline({
    width: palletProp.size[0] + D.marker.margin * 2,
    height: palletProp.size[1] + D.marker.margin * 2,
    thickness: D.marker.thickness,
    color: D.marker.color,
    opacity: D.marker.opacity,
  })
  bay.position.y = dockOffset.y
  group.add(bay)

  const lab = createLab(C.lab)
  group.add(lab.group)

  const laneSpan = R.spacing * R.count
  const obstacleX = new Float64Array(R.count)
  const known = new Float64Array(R.count)
  // 앞에서 다가오는 것을 본 장애물만 피한다. 이 빗장이 없으면 ③ 이 시작되는
  // 순간 마침 차량 옆에 있던 장애물이 차량을 조향 없이 옆으로 밀어낸다
  const armed = new Uint8Array(R.count)
  let laneWeight = 0

  const laneAt = (x) => {
    if (laneWeight <= 0.002) return 0
    let y = 0
    for (let i = 0; i < R.count; i++) {
      const side = i % 2 ? -1 : 1
      y += side * R.amplitude * known[i] * bell(x - obstacleX[i], R.width)
    }
    return y * laneWeight
  }

  const s = {
    travelled: 0,
    speed: C.speed,
    fork: forkHeights.travel,
    spinFront: 0,
    spinRear: 0,
    time: 0,
    mode: 'run',
    step: 'approach',
    stepTime: 0,
    dockTarget: 0,
    carried: false,
    loadFade: 0,
    bayFade: 0,
    depart: 0,
    curve: 0,
    settled: false,
  }

  const stage = {
    group,
    flowSpeed: C.speed,

    update(dt, beats) {
      const w = (name) => beats?.get(name) ?? 0
      const openW = w('opening')
      const mapW = w('mapping')
      const routeW = w('routing')
      const dockW = w('docking')
      const labW = w('lab')
      const joinW = w('join')

      s.time += dt
      laneWeight = routeW

      const wantDock = dockW >= Math.max(openW, mapW, routeW, labW, joinW)
      const wantCarry = labW + joinW >= 0.5

      // 모드는 도킹 연출이 화면의 주인이 되는 순간에만 갈아탄다
      if (wantDock && s.mode === 'run') {
        s.mode = 'dock'
        s.stepTime = 0
        if (s.carried) {
          s.step = 'carry'
        } else {
          s.step = 'approach'
          s.dockTarget = s.travelled + D.run
        }
      } else if (!wantDock && s.mode === 'dock') {
        // 앞으로 넘어가는 길이라면 집어 든 뒤에 놓아준다. 접근 도중에 끊으면
        // 앞에 있던 팔레트가 사라졌다가 포크 위에 다시 나타난다
        if (!wantCarry || s.carried) s.mode = 'run'
      }

      let targetSpeed = C.speed
      let targetFork = s.carried ? forkHeights.carry : forkHeights.travel
      let holdSpeed = false
      let holdFork = false
      let wantBay = 0

      if (s.mode === 'dock') {
        s.stepTime += dt

        if (s.step === 'approach') {
          targetFork = forkHeights.entry
          wantBay = 1
          holdSpeed = true

          const remaining = s.dockTarget - s.travelled
          if (remaining <= 0.015) {
            // 감속을 다 쓰고 정확히 도킹 지점에 선다. 포크가 팔레트 밑에 들어간
            // 이 순간부터 적재로 친다 — 이후 높이는 포크를 그대로 따라간다
            s.travelled = s.dockTarget
            s.speed = 0
            s.carried = true
            s.step = 'lift'
            s.stepTime = 0
          } else {
            // v = sqrt(2ar) — 등감속이라 유한한 시간에 정확히 멈춘다
            s.speed = Math.max(C.speed * Math.sqrt(clamp(remaining / D.decel, 0, 1)), 0.1)
          }
        } else if (s.step === 'lift') {
          wantBay = 1
          holdSpeed = true
          holdFork = true
          s.speed = 0
          s.fork = lerp(forkHeights.entry, forkHeights.carry, smoothstep(s.stepTime / D.lift))
          if (s.stepTime >= D.lift) {
            s.step = 'hold'
            s.stepTime = 0
          }
        } else if (s.step === 'hold') {
          wantBay = 1
          holdSpeed = true
          s.speed = 0
          targetFork = forkHeights.carry
          if (s.stepTime >= D.hold) {
            s.step = 'carry'
            s.stepTime = 0
          }
        } else if (s.step === 'carry') {
          s.carried = true
          targetFork = forkHeights.carry
          if (s.stepTime >= D.carry) {
            s.step = 'handoff'
            s.stepTime = 0
          }
        } else if (s.step === 'handoff') {
          targetFork = forkHeights.carry
          if (s.stepTime >= D.handoff) {
            s.step = 'gap'
            s.stepTime = 0
            s.carried = false
          }
        } else {
          targetFork = forkHeights.entry
          if (s.stepTime >= D.gap) {
            s.step = 'approach'
            s.stepTime = 0
            s.dockTarget = s.travelled + D.run
          }
        }
      } else if (wantCarry !== s.carried && s.loadFade < 0.02) {
        // 도킹을 건너뛰고 장을 오간 경우. 보이지 않을 때만 적재 상태를 맞춘다
        s.carried = wantCarry
      }

      const loadTarget =
        s.mode === 'dock'
          ? s.step === 'handoff' || s.step === 'gap'
            ? 0
            : 1
          : s.carried && wantCarry
            ? 1
            : 0

      s.loadFade = damp(s.loadFade, loadTarget, D.fadeRate, dt)
      if (!holdSpeed) s.speed = damp(s.speed, targetSpeed, C.accel, dt)
      if (!holdFork) s.fork = damp(s.fork, targetFork, C.forkRate, dt)
      s.travelled += s.speed * dt

      const travelled = s.travelled

      for (let i = 0; i < R.count; i++) {
        const x = wrapSigned(R.spacing * i - travelled, laneSpan)
        obstacleX[i] = x
        if (x > R.detect + 2) armed[i] = 1
        known[i] = armed[i] ? smoothstep((R.detect - x) / R.ramp) : 0
      }

      // 경로는 y=lane(x) 곡선이고 차량은 그 위의 한 점이다.
      // 앞으로 나아갈수록 장애물이 다가오므로 dy/ds = dlane/dx 가 그대로 진행 방향이 된다.
      const h = 0.3
      const y0 = laneAt(0)
      const yPlus = laneAt(h)
      const yMinus = laneAt(-h)
      const slope = (yPlus - yMinus) / (2 * h)
      const second = (yPlus - 2 * y0 + yMinus) / (h * h)
      const curvature = second / Math.pow(1 + slope * slope, 1.5)

      const departTarget = C.join.depart * smoothstep(clamp(joinW / C.join.ease, 0, 1))
      const departRate = dt > 0 ? clamp((departTarget - s.depart) / dt, -C.speed, C.speed * 3) : 0
      s.depart = departTarget

      chassis.position.set(s.depart, y0, 0)
      chassis.rotation.z = Math.atan(slope)

      const rolled = (s.speed + departRate) * dt
      s.spinFront += rolled / vehicle.frontWheelRadius
      s.spinRear += rolled / vehicle.rearWheelRadius
      truck.setJoints({
        fork_lift_joint: s.fork,
        steering_handle_joint: Math.atan(-curvature * vehicle.wheelbase) / STEERING_MIMIC,
        front_left_wheel_joint: s.spinFront,
        rear_left_wheel_joint: s.spinRear,
      })

      load.userData.fade = s.loadFade
      // 실리기 전에는 세계에 놓여 다가오고, 실린 뒤에는 포크를 따라간다.
      // 멈춰 선 순간 두 식이 같은 자리를 가리키므로 이어 붙는 곳이 없다
      load.position.x = s.carried ? dockOffset.x : dockOffset.x + (s.dockTarget - travelled)
      load.position.z = s.carried ? palletRise(s.fork) : 0

      s.bayFade = damp(s.bayFade, wantBay, 5, dt)
      bay.userData.fade = s.bayFade * dockW
      bay.position.x = dockOffset.x + (s.dockTarget - travelled)

      // 공간은 ② 가 그려 놓고 ③~⑥ 내내 서 있는다. ① 에서만 비어 있다.
      // 옅어지는 순간 "같은 공간을 계속 달린다"가 무너진다
      world.points.userData.fade = clamp(1 - openW, 0, 1)
      // ② 는 센서 앞에서 돋아나고 ③ 부터는 다 그려진 공간이 통째로 선다.
      // 이 전환 자체가 ②→③ 에서 공간이 열리는 연출이다
      const curveTarget = clamp(1 - openW - mapW, 0, 1)
      s.curve = s.settled ? damp(s.curve, curveTarget, C.world.curveRate, dt) : curveTarget
      s.settled = true
      world.update(travelled, s.curve)

      scan.group.userData.fade = mapW
      if (mapW > 0.003) scan.setPhase(s.time * C.scan.rate * Math.PI * 2)

      for (let i = 0; i < R.count; i++) {
        const x = obstacleX[i]
        const side = i % 2 ? -1 : 1
        // 보이는 것과 피하는 것은 거리가 다르다. 멀리서 이미 보이고, 가까워져야 경로가 휜다.
        // 다만 빗장이 걸리지 않은 것은 끝까지 감춘다 — 보이는데 뚫고 지나가면 안 된다
        const near = 1 - smoothstep((x - R.appear[1]) / (R.appear[0] - R.appear[1]))
        const fade = routeW * armed[i] * near * smoothstep((x - R.tail) / R.tailFade)
        obstacles[i].userData.fade = fade
        obstacles[i].position.set(x, -side * R.offset, 0)
        // 인식 표시는 경로가 실제로 휘기 시작할 때 함께 켜진다
        marks[i].userData.fade = fade * known[i]
        marks[i].position.set(x, -side * R.offset, 0)
      }

      ahead.userData.fade = routeW
      behind.userData.fade = routeW
      if (routeW > 0.003) {
        fillLane(ahead.userData.points, 0, R.ahead, laneAt)
        ahead.userData.commit()
        fillLane(behind.userData.points, -R.behind, 0, laneAt)
        behind.userData.commit()
      }

      lab.update(travelled, labW)

      stage.flowSpeed = s.speed
    },
  }

  return stage
}

function fillLane(points, from, to, laneAt) {
  const last = points.length - 1
  for (let i = 0; i <= last; i++) {
    const x = from + ((to - from) * i) / last
    points[i][0] = x
    points[i][1] = laneAt(x)
  }
}

function createScan({ color, radius, rings, ringOpacity, sector, sectorOpacity }) {
  const group = new Group()

  for (let i = 1; i <= rings; i++) {
    const r = (radius * i) / rings
    const mark = new Mesh(new RingGeometry(r - 0.014, r, 96), basic(color, ringOpacity))
    mark.renderOrder = 1
    group.add(mark)
  }

  const beam = new Mesh(new CircleGeometry(radius, 48, -sector, sector), basic(color, sectorOpacity))
  beam.renderOrder = 2
  group.add(beam)

  return {
    group,
    setPhase(angle) {
      beam.rotation.z = angle
    },
  }
}

/** ⑤ 연구 영역. 로봇을 더 놓지 않고 공간에 이름만 띄운다 */
function createLab(L) {
  const group = new Group()
  const span = L.spacing * L.labels.length

  const items = L.labels.map((text, i) => {
    const item = new Group()
    item.position.y = L.sides[i % L.sides.length] * L.y

    const height = L.z[i % L.z.length]

    const sprite = new Sprite(
      new SpriteMaterial({
        map: labelTexture(text, L.color),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    )
    sprite.scale.set(L.size[0], L.size[1], 1)
    sprite.position.z = height
    item.add(sprite)

    const stem = new Mesh(new BoxGeometry(0.025, 0.025, height), basic(L.color, 0.3))
    stem.position.z = height / 2
    item.add(stem)

    const ring = new Mesh(new RingGeometry(0.34, 0.4, 40), basic(L.color, 0.45))
    ring.position.z = 0.01
    ring.renderOrder = 1
    item.add(ring)

    group.add(item)
    return { group: item, base: L.spacing * i }
  })

  return {
    group,
    update(travelled, weight) {
      for (const item of items) {
        const x = wrapSigned(item.base - travelled, span)
        item.group.position.x = x
        const near = 1 - smoothstep((x - L.appear[1]) / (L.appear[0] - L.appear[1]))
        const past = smoothstep((x - L.leave[1]) / (L.leave[0] - L.leave[1]))
        item.group.userData.fade = weight * near * past
      }
    },
  }
}

function labelTexture(text, color) {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 160

  const ctx = canvas.getContext('2d')
  ctx.font = '600 52px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  if ('letterSpacing' in ctx) ctx.letterSpacing = '5px'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(text, 320, 74)
  ctx.fillRect(230, 112, 180, 3)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}
