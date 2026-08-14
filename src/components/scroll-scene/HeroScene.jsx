import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { scrollModel, sceneConfig } from '../../data/scrollScene'
import { resetGroundFlow, setGroundFlow } from '../../lib/groundFlow'
import { lerp } from '../../lib/math'
import { buildLibrary, setStageOpacity } from './forklift/model'
import { createJourneyStage } from './stages/journeyStage'

useGLTF.preload(scrollModel.path, scrollModel.draco)

const BUILDERS = {
  journey: createJourneyStage,
}

const F = sceneConfig.lighting.fog

const weights = new Map()
const beats = new Map()

// 가중치는 더한다 — max 를 쓰면 전환 중간에 무대가 반투명해진다
const add = (sections, i, w) => {
  const s = sections[i]
  if (!s || w <= 0) return
  if (s.stage) weights.set(s.stage, (weights.get(s.stage) ?? 0) + w)
  if (s.beat) beats.set(s.beat, (beats.get(s.beat) ?? 0) + w)
}

export default function HeroScene({ progress, blend, sections, compact = false }) {
  const { scene } = useGLTF(scrollModel.path, scrollModel.draco)
  const library = useMemo(() => buildLibrary(scene), [scene])

  const stages = useMemo(() => {
    const names = [...new Set(sections.map((s) => s.stage).filter(Boolean))]
    return names.map((name) => {
      // 펼쳐 담지 않는다 — 무대가 매 프레임 고쳐 쓰는 flowSpeed 가 복사본에서 얼어붙는다
      const stage = BUILDERS[name](library, { compact })
      stage.name = name
      return stage
    })
  }, [library, sections, compact])

  // 안개는 SceneStage 의 것이라 이 컴포넌트가 빠질 때 밀어낸 채로 두면 안 된다
  const root = useThree((s) => s.scene)
  useEffect(
    () => () => {
      for (const stage of stages) disposeStage(stage.group)
      resetGroundFlow()
      if (root.fog) {
        root.fog.near = F.near
        root.fog.far = F.far
      }
    },
    [stages, root],
  )

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const { index, t } = blend(progress.current)

    weights.clear()
    beats.clear()
    add(sections, index, 1 - t)
    add(sections, index + 1, t)

    let flow = 0
    let lift = 0
    for (const stage of stages) {
      const weight = Math.min(1, weights.get(stage.name) ?? 0)
      // 위치를 먼저 갱신하고 불투명도를 입힌다 — 순서를 바꾸면 한 프레임 깜빡인다
      if (weight > 0) stage.update(dt, beats)
      setStageOpacity(stage.group, weight)
      if (weight <= 0) continue

      // 후진하면 바닥도 되돌아와야 한다 — 부호를 지운 최대값은 세계만 멈춰 세운다
      const speed = stage.flowSpeed * weight
      if (Math.abs(speed) > Math.abs(flow)) flow = speed
      if (stage.fogLift > lift) lift = stage.fogLift
    }

    setGroundFlow(flow * dt)

    // 유니폼이라 매 프레임 옮겨도 셰이더가 다시 컴파일되지 않는다
    const fog = state.scene.fog
    if (fog) {
      fog.near = lerp(F.near, F.lift[0], lift)
      fog.far = lerp(F.far, F.lift[1], lift)
    }
  })

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} scale={scrollModel.scale}>
      {stages.map((stage) => (
        <primitive key={stage.name} object={stage.group} dispose={null} />
      ))}
    </group>
  )
}

function disposeStage(group) {
  group.traverse((o) => {
    if (o.isInstancedMesh) o.dispose()
    const material = o.material
    if (Array.isArray(material)) for (const m of material) m.dispose()
    else material?.dispose()
  })
}
