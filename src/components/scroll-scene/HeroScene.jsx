import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { scrollModel } from '../../data/scrollScene'
import { resetGroundFlow, setGroundFlow } from '../../lib/groundFlow'
import { buildLibrary, setStageOpacity } from './forklift/model'
import { createJourneyStage } from './stages/journeyStage'

useGLTF.preload(scrollModel.path, scrollModel.draco)

const BUILDERS = {
  journey: createJourneyStage,
}

const weights = new Map()
const beats = new Map()

// 두 장이 같은 무대·같은 연출을 가리키면 가중치는 **더한다**. 큰 쪽만 쓰면
// 전환 한가운데에서 0.5 가 되어, 계속 보여야 할 무대가 반투명해진다.
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

  useEffect(
    () => () => {
      for (const stage of stages) disposeStage(stage.group)
      resetGroundFlow()
    },
    [stages],
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const { index, t } = blend(progress.current)

    weights.clear()
    beats.clear()
    add(sections, index, 1 - t)
    add(sections, index + 1, t)

    let flow = 0
    for (const stage of stages) {
      const weight = Math.min(1, weights.get(stage.name) ?? 0)
      setStageOpacity(stage.group, weight)
      if (weight <= 0) continue

      stage.update(dt, beats)
      flow = Math.max(flow, stage.flowSpeed * weight)
    }

    setGroundFlow(flow * dt)
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
