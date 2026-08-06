import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector3 } from 'three'
import { sceneConfig } from '../../data/scrollScene'
import { tune } from '../../lib/devTuning'
import { damp } from '../../lib/math'

const DAMPING = tune('camDamp', sceneConfig.cameraDamping)
const ASPECT_POW = tune('aspectPow', sceneConfig.framing.aspectExponent)
const MAX_PULL = tune('maxPull', sceneConfig.framing.maxPullBack)

export default function CameraRig({ progress, path, compact = false }) {
  const sample = useRef(path.createSample())
  const lookAt = useRef(new Vector3(...path.firstKeyframe.target))
  const settled = useRef(false)

  useFrame((state, delta) => {
    // 탭 복귀 시 delta 가 튀어 카메라가 순간이동하는 것을 막는다
    const dt = Math.min(delta, 0.1)
    const cam = state.camera
    const s = path.sample(progress.current, sample.current)
    const l = DAMPING

    const px = state.pointer.x * sceneConfig.parallax
    const py = state.pointer.y * sceneConfig.parallax

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

    const { width, height } = state.size
    const [cfx, cfy] = sceneConfig.framing.compact
    const fx = compact ? cfx : s.frame[0]
    const fy = compact ? cfy : s.frame[1]
    cam.setViewOffset(width, height, -fx * width, fy * height, width, height)
  })

  return null
}
