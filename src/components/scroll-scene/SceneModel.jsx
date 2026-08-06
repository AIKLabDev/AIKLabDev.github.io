import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { scrollModel } from '../../data/scrollScene'
import { clamp, lerp, rangeProgress } from '../../lib/math'

if (scrollModel.path) {
  useGLTF.preload(scrollModel.path, scrollModel.draco, scrollModel.meshopt)
}

function secondsFor(p, sections) {
  const a = scrollModel.animation
  if (!a) return 0

  if (a.mode === 'segments' && a.segments?.length && sections?.length) {
    let i = sections.findIndex((s) => p <= s.range[1])
    if (i === -1) i = sections.length - 1
    const seg = a.segments[Math.min(i, a.segments.length - 1)]
    const s = sections[i]
    return lerp(seg[0], seg[1], rangeProgress(p, s.range[0], s.range[1]))
  }

  const [from, to] = a.range ?? [0, 0]
  return lerp(from, to, clamp(p, 0, 1))
}

export default function SceneModel({ progress, sections }) {
  const group = useRef(null)
  const { scene, animations } = useGLTF(scrollModel.path, scrollModel.draco, scrollModel.meshopt)
  const { actions, mixer, names } = useAnimations(animations, group)
  const clipName = scrollModel.animation?.clip ?? names[0]

  // glTF 는 그림자가 기본적으로 꺼져 있다
  useLayoutEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
  }, [scene])

  useEffect(() => {
    const action = actions[clipName]
    if (!action) return

    // paused = true 로 두면 effectiveTimeScale 이 0 이 되어 mixer.setTime 이 먹지 않는다
    action.reset().play()
    return () => {
      action.stop()
    }
  }, [actions, clipName])

  useFrame(() => {
    if (!mixer || !actions[clipName]) return
    mixer.setTime(secondsFor(progress.current, sections))
  })

  return (
    <group
      ref={group}
      position={scrollModel.position}
      rotation={scrollModel.rotation}
      scale={scrollModel.scale}
      dispose={null}
    >
      <primitive object={scene} />
    </group>
  )
}
