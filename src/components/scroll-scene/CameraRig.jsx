import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector3 } from 'three'
import { sceneConfig } from '../../data/scrollScene'
import { tune } from '../../lib/devTuning'
import { damp } from '../../lib/math'

// 개발 중 ?camDamp=6 으로 바로 바꿔볼 수 있다 (프로덕션에서는 상수로 접힌다)
const DAMPING = tune('camDamp', sceneConfig.cameraDamping)
// 세로 화면 보정 강도. 실기기에서 ?aspectPow=0.7&maxPull=2.8 로 바로 비교할 수 있다.
const ASPECT_POW = tune('aspectPow', sceneConfig.framing.aspectExponent)
const MAX_PULL = tune('maxPull', sceneConfig.framing.maxPullBack)

/**
 * 스크롤 진행률 → 카메라 위치·시선·화각.
 *
 * 데이터의 키프레임을 smoothstep 으로 보간해 "목표"를 만들고,
 * 실제 카메라는 그 목표를 지수 감쇠로 따라간다. 되감을 때도 대칭적으로 부드럽다.
 *
 * 카메라는 useThree 로 꺼내지 않고 프레임 콜백의 state 에서 읽는다.
 * 초기 위치·화각은 Canvas 의 camera prop 이 firstKeyframe 으로 이미 세팅하므로
 * 첫 프레임부터 제자리에서 시작한다 (기본 카메라에서 날아오는 현상 없음).
 *
 * @param {object} path createCameraPath() 결과 (키프레임 + 보간 함수)
 */
export default function CameraRig({ progress, path, compact = false }) {
  const sample = useRef(path.createSample())
  const lookAt = useRef(new Vector3(...path.firstKeyframe.target))
  /** 첫 프레임은 감쇠 없이 제자리에서 시작한다 (세로 화면 보정이 눈에 띄게 밀려드는 것 방지) */
  const settled = useRef(false)

  useFrame((state, delta) => {
    // 탭 전환 후 복귀 시 delta 가 크게 튀어 카메라가 순간이동하는 것을 막는다
    const dt = Math.min(delta, 0.1)
    const cam = state.camera
    const s = path.sample(progress.current, sample.current)
    const l = DAMPING

    // 스크롤과 무관한 미세 패럴랙스 — 정지 중에도 장면이 죽어 보이지 않게
    const px = state.pointer.x * sceneConfig.parallax
    const py = state.pointer.y * sceneConfig.parallax

    // 세로 화면 보정: 가로 시야가 좁아진 만큼 카메라를 시선 방향 뒤로 물린다.
    // 키프레임의 구도(각도)는 그대로 두고 거리만 늘리므로 왜곡이 없다.
    const { referenceAspect } = sceneConfig.framing
    const aspect = state.size.width / Math.max(1, state.size.height)
    const pull =
      aspect < referenceAspect ? Math.min(Math.pow(referenceAspect / aspect, ASPECT_POW), MAX_PULL) : 1

    const [tx, ty, tz] = s.target
    const wantX = tx + (s.position[0] - tx) * pull + px
    const wantY = ty + (s.position[1] - ty) * pull + py
    const wantZ = tz + (s.position[2] - tz) * pull

    if (settled.current) {
      cam.position.x = damp(cam.position.x, wantX, l, dt)
      cam.position.y = damp(cam.position.y, wantY, l, dt)
      cam.position.z = damp(cam.position.z, wantZ, l, dt)
      lookAt.current.x = damp(lookAt.current.x, tx, l, dt)
      lookAt.current.y = damp(lookAt.current.y, ty, l, dt)
      lookAt.current.z = damp(lookAt.current.z, tz, l, dt)
    } else {
      cam.position.set(wantX, wantY, wantZ)
      lookAt.current.set(tx, ty, tz)
      settled.current = true
    }
    cam.lookAt(lookAt.current)

    if (Math.abs(cam.fov - s.fov) > 0.01) {
      cam.fov = damp(cam.fov, s.fov, l, dt)
      cam.updateProjectionMatrix()
    }

    // 화면 안에서 피사체를 밀어 텍스트와 겹치지 않게 한다.
    // 카메라를 옮기는 대신 투영 창을 어긋내므로(setViewOffset) 구도 자체는 유지된다.
    // 좁은 화면에서는 텍스트가 아래로 가므로 좌우 대신 위로만 민다.
    const { width, height } = state.size
    const [cfx, cfy] = sceneConfig.framing.compact
    const fx = compact ? cfx : s.frame[0]
    const fy = compact ? cfy : s.frame[1]
    cam.setViewOffset(width, height, -fx * width, fy * height, width, height)
  })

  return null
}
