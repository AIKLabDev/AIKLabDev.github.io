import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { scrollModel } from '../../data/scrollScene'
import { clamp, lerp, rangeProgress } from '../../lib/math'

/**
 * 실제 glTF(.glb) 모델 + 스크롤 스크럽 재생.
 * scrollModel.path 가 채워졌을 때만 ScrollScene 이 이 컴포넌트를 쓴다.
 * 압축은 useGLTF 인자로 처리한다 — 기본은 meshopt(디코더 번들 내장),
 * Draco 를 쓰면 scrollModel.draco 에 '/draco/' 를 넣는다.
 */

// 라우팅 진입 전에 미리 받아 두면 히어로가 늦게 뜨는 것을 줄일 수 있다
if (scrollModel.path) {
  useGLTF.preload(scrollModel.path, scrollModel.draco, scrollModel.meshopt)
}

/**
 * 진행률 → 클립 재생 시각(초). data/scrollScene.js 의 animation 설정을 해석한다.
 * segments 모드는 섹션 경계에 맞춰야 하므로 계산된 섹션 목록을 받는다
 * (변형마다 섹션 길이가 달라 구간이 달라진다).
 */
function secondsFor(p, sections) {
  const a = scrollModel.animation
  if (!a) return 0

  if (a.mode === 'segments' && a.segments?.length && sections?.length) {
    // 현재 진행률이 속한 섹션을 찾아 그 섹션에 배정된 시간 구간을 재생한다
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

  // 로드된 메시에 그림자 설정 (glTF 는 기본적으로 꺼져 있다)
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

    // 스크럽 방식: 액션은 재생 상태로 두고 시각만 우리가 지정한다.
    // action.paused = true 로 두면 effectiveTimeScale 이 0 이 되어
    // mixer.setTime() 이 아무 효과도 내지 못한다 — 일시정지로 막으면 안 된다.
    action.reset().play()
    return () => {
      action.stop()
    }
  }, [actions, clipName])

  useFrame(() => {
    if (!mixer || !actions[clipName]) return
    // useAnimations 내부에도 mixer.update(delta) 가 있지만,
    // 이 useFrame 이 나중에 등록되어 뒤에 실행되므로 절대 시각인 이쪽이 최종 결과가 된다.
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
