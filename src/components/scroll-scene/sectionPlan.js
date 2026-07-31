import { heroVariants, sceneConfig, scrollSections } from '../../data/scrollScene'
import { createCameraPath } from './cameraPath'

/**
 * 변형별 섹션 배치 계산.
 *
 * 진행률 구간(range)은 섹션 길이에서 유도한다. 길이와 구간을 데이터에 따로
 * 적어두면 한쪽만 고쳤을 때 카메라와 텍스트가 조용히 어긋난다.
 * 변형 A 는 모든 섹션이 sceneConfig.vhPerSection 로 균일하고,
 * 변형 B 는 섹션마다 정의된 vh 를 쓴다.
 *
 * 결과는 변형당 한 번만 계산해 캐시한다 (카메라 키프레임 생성까지 포함).
 */
const cache = new Map()

export function getSectionPlan(variantKey) {
  const cached = cache.get(variantKey)
  if (cached) return cached

  const variant = heroVariants[variantKey] ?? heroVariants[Object.keys(heroVariants)[0]]

  const lengths = scrollSections.map((s) =>
    variant.perSectionLength ? (s.vh ?? sceneConfig.vhPerSection) : sceneConfig.vhPerSection,
  )
  const totalVh = lengths.reduce((a, b) => a + b, 0)

  let cursor = 0
  const sections = scrollSections.map((s, i) => {
    const from = cursor / totalVh
    cursor += lengths[i]
    const to = cursor / totalVh
    return { ...s, range: [from, to], at: (from + to) / 2 }
  })

  const plan = { variant, variantKey, sections, totalVh, cameraPath: createCameraPath(sections) }
  cache.set(variantKey, plan)
  return plan
}
