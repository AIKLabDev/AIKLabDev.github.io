import { CircleGeometry, Group, Mesh, MeshBasicMaterial, RingGeometry } from 'three'
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
import { createPlaza } from './plaza'
import { createPointField } from './pointField'
import { createDockYard, createYard } from './yard'

const SENSOR_X = 0.1

/** [-π, π) 로 접는다 */
const wrapAngle = (a) => a - Math.PI * 2 * Math.round(a / (Math.PI * 2))

/** 주기 안으로 접는다. 결과는 항상 [-period/2, period/2) */
const wrapSigned = (value, period) => {
  const half = period / 2
  return (((value + half) % period) + period) % period - half
}

const ease = (t) => t * t * t * (t * (6 * t - 15) + 10)
const easeSlope = (t) => 30 * t * t * (t - 1) * (t - 1)
const easeBend = (t) => 60 * t * (t - 1) * (2 * t - 1)

/** d=0 에서 1, |d|>=w 에서 0 인 매끈한 종 */
const bell = (d, w) => {
  const t = 1 - Math.abs(d) / w
  return t <= 0 ? 0 : t * t * (3 - 2 * t)
}

const basic = (color, opacity) =>
  new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false })

/** 여섯 장을 도는 하나의 무대. 차량은 원점에 고정되고 세계가 흐른다(트레드밀). */
export function createJourneyStage(library, { compact = false } = {}) {
  const C = heroStages.journey
  const R = C.route
  const D = C.dock
  const T = D.truck
  const group = new Group()

  const truck = createForklift(library)
  const chassis = new Group()
  const body = new Group()
  body.position.z = vehicle.rideHeight
  body.add(truck.root)
  chassis.add(body)
  group.add(chassis)

  const load = createLoadedPallet(library)
  group.add(load)

  const scan = createScan(C.scan)
  scan.group.position.set(SENSOR_X, 0, C.scan.z)
  chassis.add(scan.group)

  const world = createPointField(C.world, { compact })
  group.add(world.points)

  const yard = createYard(library, C.yard, { compact })
  group.add(yard.group)

  const dock = createDockYard(library, D)
  group.add(dock.group)

  const plaza = createPlaza(C.plaza, { library, compact })
  group.add(plaza.group)

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

  // ahead 보다 먼저 추가해야 아래에 깔린다
  const BR = R.branches
  const branchSpan = BR.spacing * BR.count
  const branches = Array.from({ length: BR.count }, (_, i) => {
    const ribbon = createFlowRibbon(BR.samples, BR.style, 0.01, BR.taper)
    group.add(ribbon)
    return {
      ribbon,
      base: BR.base + i * BR.spacing,
      side: i % 2 ? -1 : 1,
      phase: (i * Math.PI * 2) / BR.count,
    }
  })

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

  const laneSpan = R.spacing * R.count
  const obstacleX = new Float64Array(R.count)
  const known = new Float64Array(R.count)
  // 앞에서 다가오는 것을 본 장애물만 피한다
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

  const returnLane = (at) =>
    s.laneFrom * (1 - ease(clamp((at - s.laneAt) / D.laneRun, 0, 1))) +
    (s.parked ? D.pass * bell(at - (s.dockFrom + T.x), D.passRun) : 0)

  const truckLane = T.y - dockOffset.y
  const bedFork = T.bed + forkHeights.entry
  const dockRun = T.x + T.stop
  // station 이 아니라 dockFrom 기준 — station 기준이면 차선이 튄다
  const dockAt = () => s.dockFrom + dockRun
  const haulProgress = () => clamp((s.travelled - s.dockFrom) / dockRun, 0, 1)

  const s = {
    travelled: 0,
    speed: C.speed,
    fork: forkHeights.travel,
    spinFront: 0,
    spinRear: 0,
    time: 0,
    mode: 'run',
    dockLatched: false,
    dockOwned: false,
    step: 'approach',
    stepTime: 0,
    station: 0,
    dockFrom: 0,
    /** `dockFrom` 자리의 트럭에 한 장을 넘겨 준 적이 있는가 */
    parked: false,
    lane: 0,
    laneFrom: 0,
    laneAt: 0,
    steer: 0,
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
    /** 안개를 밀어내는 정도 (0~1) */
    fogLift: 0,

    update(dt, beats) {
      const w = (name) => beats?.get(name) ?? 0
      const openW = w('opening')
      const mapW = w('mapping')
      const routeW = w('routing')
      const dockW = w('docking')
      const fleetW = w('fleet')
      const joinW = w('join')

      s.time += dt
      laneWeight = routeW

      const wantDock = dockW >= Math.max(openW, mapW, routeW, fleetW, joinW)
      const wantRoute = routeW >= Math.max(openW, mapW, dockW, fleetW, joinW)
      const wantCarry = fleetW + joinW >= 0.5
      const above = clamp(fleetW + joinW, 0, 1)

      if (dockW <= 0.02) s.dockLatched = false

      if (s.mode === 'dock') {
        if (wantDock) s.dockOwned = true
        const release = dockW <= 0.02 || (s.dockOwned && !wantDock)
        if (release && (!wantCarry || !s.carried)) {
          s.mode = 'run'
          s.dockLatched = dockW > 0.02
        }
      } else if (dockW > 0.02 && !s.dockLatched) {
        s.mode = 'dock'
        s.dockOwned = false
        s.stepTime = 0
        s.step = 'approach'
        s.carried = false
        s.station = dock.stationAfter(s.travelled)
        s.dockFrom = s.station
        dock.clear(s.station)
      }

      let targetSpeed = C.speed * (1 - above)
      let targetFork = s.carried ? forkHeights.carry : forkHeights.travel
      let holdSpeed = false
      let holdFork = false
      let wantBay = 0
      let hauling = false
      let backing = false
      let laneSlope
      let laneCurve

      if (s.mode === 'dock') {
        s.stepTime += dt

        if (s.step === 'approach') {
          targetFork = forkHeights.entry
          wantBay = 1
          holdSpeed = true

          const remaining = s.station - s.travelled
          if (remaining <= 0.015) {
            s.travelled = s.station
            s.speed = 0
            s.step = 'pick'
            s.stepTime = 0
            dock.take(s.station)
            s.loadFade = 1
          } else {
            const want = Math.max(C.speed * Math.sqrt(clamp(remaining / D.decel, 0, 1)), 0.1)
            s.speed = want > s.speed ? Math.min(want, s.speed + D.accel * dt) : want
          }
        } else if (s.step === 'pick') {
          wantBay = 1
          holdSpeed = true
          s.speed = 0
          targetFork = forkHeights.entry
          if (s.stepTime >= D.pick) {
            s.carried = true
            s.step = 'lift'
            s.stepTime = 0
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
            s.step = 'haul'
            s.stepTime = 0
            s.dockFrom = s.station
          }
        } else if (s.step === 'haul') {
          hauling = true
          targetFork = bedFork + D.clear
          holdSpeed = true

          const remaining = dockAt() - s.travelled
          if (remaining <= 0.015) {
            s.travelled = dockAt()
            s.speed = 0
            s.step = 'place'
            s.stepTime = 0
          } else {
            const cruise = D.haul * Math.sqrt(clamp(remaining / D.decel, 0, 1))
            s.speed = Math.min(cruise, s.speed + D.accel * dt)
          }
        } else if (s.step === 'place') {
          hauling = true
          holdSpeed = true
          holdFork = true
          s.speed = 0
          s.fork = lerp(bedFork + D.clear, bedFork, smoothstep(s.stepTime / D.settle))
          if (s.stepTime >= D.settle) {
            dock.handoff(s.dockFrom)
            s.parked = true
            s.loadFade = 0
            s.carried = false
            s.step = 'back'
            s.stepTime = 0
          }
        } else {
          hauling = true
          backing = true
          const out = dockAt() - s.travelled
          holdSpeed = true
          holdFork = true
          s.fork = lerp(bedFork, forkHeights.entry, smoothstep((out - D.tineOut) / D.lower))

          const remaining = D.backRun - out
          if (remaining <= 0.015) {
            s.speed = 0
            s.station = s.dockFrom + D.stride
            s.step = 'approach'
            s.stepTime = 0
          } else {
            const cruise = D.back * Math.sqrt(clamp(remaining / D.decel, 0, 1))
            s.speed = -Math.min(Math.max(cruise, 0.25), -s.speed + D.accel * dt)
          }
        }
      } else if (wantCarry !== s.carried && s.loadFade < 0.02) {
        s.carried = wantCarry
      }

      const loadTarget =
        s.mode === 'dock'
          ? s.carried || s.step === 'pick'
            ? 1
            : 0
          : s.carried && wantCarry
            ? 1
            : 0

      s.loadFade = damp(s.loadFade, loadTarget, D.fadeRate, dt)
      if (!holdSpeed) s.speed = damp(s.speed, targetSpeed, C.accel, dt)
      if (!holdFork) s.fork = damp(s.fork, targetFork, C.forkRate, dt)

      if (hauling) {
        if (backing) {
          const b = clamp((dockAt() - s.travelled) / D.backRun, 0, 1)
          const swing = D.backLane - truckLane
          s.lane = truckLane + swing * ease(b)
          laneSlope = (-swing * easeSlope(b)) / D.backRun
          laneCurve = (swing * easeBend(b)) / (D.backRun * D.backRun)
        } else {
          const p = haulProgress()
          s.lane = truckLane * ease(p)
          laneSlope = (truckLane * easeSlope(p)) / dockRun
          laneCurve = (truckLane * easeBend(p)) / (dockRun * dockRun)
        }
        s.laneFrom = s.lane
        s.laneAt = s.travelled
      } else {
        const d = 0.3
        const l0 = returnLane(s.travelled)
        const lPlus = returnLane(s.travelled + d)
        const lMinus = returnLane(s.travelled - d)
        s.lane = l0
        laneSlope = (lPlus - lMinus) / (2 * d)
        laneCurve = (lPlus - 2 * l0 + lMinus) / (d * d)
      }

      s.travelled += s.speed * dt

      const travelled = s.travelled

      for (let i = 0; i < R.count; i++) {
        const x = wrapSigned(R.spacing * i - travelled, laneSpan)
        obstacleX[i] = x
        if (routeW <= 0.02) armed[i] = 0
        else if (wantRoute && x > R.detect + 2) armed[i] = 1
        known[i] = armed[i] ? smoothstep((R.detect - x) / R.ramp) : 0
      }

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

      const onPlaza = smoothstep(above / 0.5)
      const lead = plaza.lead
      const laneYaw = Math.atan(slope) + Math.atan(laneSlope)
      const yaw = laneYaw + wrapAngle(lead.yaw - laneYaw) * onPlaza

      chassis.position.set(lerp(s.depart, lead.x, onPlaza), lerp(y0 + s.lane, lead.y, onPlaza), 0)
      chassis.rotation.z = yaw

      const rolled = (s.speed + departRate) * dt * (1 - onPlaza) + lead.moved * onPlaza
      s.spinFront += rolled / vehicle.frontWheelRadius
      s.spinRear += rolled / vehicle.rearWheelRadius
      s.steer = damp(
        s.steer,
        Math.atan(-(curvature + laneCurve) * vehicle.wheelbase) / STEERING_MIMIC * (1 - onPlaza),
        D.steerRate,
        dt,
      )
      const fork = lerp(s.fork, lead.fork, onPlaza)
      truck.setJoints({
        fork_lift_joint: fork,
        steering_handle_joint: s.steer,
        front_left_wheel_joint: s.spinFront,
        rear_left_wheel_joint: s.spinRear,
      })

      load.userData.fade = lerp(s.loadFade, lead.load, onPlaza)
      if (s.carried) {
        const cos = Math.cos(yaw)
        const sin = Math.sin(yaw)
        load.position.set(
          chassis.position.x + cos * dockOffset.x - sin * dockOffset.y,
          chassis.position.y + sin * dockOffset.x + cos * dockOffset.y,
          palletRise(fork),
        )
        load.rotation.z = yaw
      } else {
        load.position.set(s.station - travelled + dockOffset.x, dockOffset.y, 0)
        load.rotation.z = 0
      }

      s.bayFade = damp(s.bayFade, wantBay, 5, dt)
      bay.userData.fade = s.bayFade * dockW
      bay.position.x = dockOffset.x + (s.station - travelled)

      world.points.userData.fade = clamp(mapW + routeW, 0, 1)

      const written = smoothstep((above - 0.2) / 0.6)
      stage.fogLift = written

      const standing = clamp(dockW + above, 0, 1)
      yard.group.userData.fade = standing * (1 - written)
      yard.update(travelled, dt, s.time)

      dock.group.userData.fade = standing * (1 - written)
      if (standing > 0.003) dock.update(travelled, 1 - above)

      plaza.group.userData.fade = written
      if (above > 0.002) plaza.update(dt)
      const curveTarget = clamp(1 - openW - mapW, 0, 1)
      s.curve = s.settled ? damp(s.curve, curveTarget, C.world.curveRate, dt) : curveTarget
      s.settled = true
      world.update(travelled, s.curve)

      scan.group.userData.fade = mapW
      if (mapW > 0.003) scan.setPhase(s.time * C.scan.rate * Math.PI * 2)

      for (let i = 0; i < R.count; i++) {
        const x = obstacleX[i]
        const side = i % 2 ? -1 : 1
        const near = 1 - smoothstep((x - R.appear[1]) / (R.appear[0] - R.appear[1]))
        const fade = routeW * armed[i] * near * smoothstep((x - R.tail) / R.tailFade)
        obstacles[i].userData.fade = fade
        obstacles[i].position.set(x, -side * R.offset, 0)
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

        for (const branch of branches) {
          const at = wrapSigned(branch.base - travelled, branchSpan)
          const lane = laneAt(at)
          const points = branch.ribbon.userData.points
          const last = points.length - 1
          const bend = last >> 1
          for (let i = 0; i <= last; i++) {
            if (i <= bend) {
              const a = ((i / bend) * Math.PI) / 2
              points[i][0] = at + BR.radius * Math.sin(a)
              points[i][1] = lane + branch.side * BR.radius * (1 - Math.cos(a))
            } else {
              points[i][0] = at + BR.radius
              points[i][1] =
                lane + branch.side * (BR.radius + (BR.reach * (i - bend)) / (last - bend))
            }
          }
          branch.ribbon.userData.commit()
          const near = 1 - smoothstep((at - BR.appear[1]) / (BR.appear[0] - BR.appear[1]))
          const past = smoothstep((at - BR.leave[1]) / (BR.leave[0] - BR.leave[1]))
          const wave = 0.5 + 0.5 * Math.sin(s.time * BR.pulse.rate * Math.PI * 2 + branch.phase)
          branch.ribbon.userData.fade = routeW * near * past * (1 - BR.pulse.depth * wave)
        }
      } else {
        for (const branch of branches) branch.ribbon.userData.fade = 0
      }

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
