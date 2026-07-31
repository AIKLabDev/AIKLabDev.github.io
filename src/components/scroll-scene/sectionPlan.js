import { scrollSections } from '../../data/scrollScene'
import { createCameraPath } from './cameraPath'

/**
 * 섹션 배치 계산.
 *
 * 진행률 구간(range)은 섹션 길이(vh)에서 유도한다. 길이와 구간을 데이터에 따로
 * 적어두면 한쪽만 고쳤을 때 카메라와 텍스트가 조용히 어긋난다.
 *
 * at 은 구간의 중앙 = 그 섹션의 카메라 키프레임이 완성되는 지점이고,
 * 스냅 변형이 이동 목표로 삼는 위치이기도 하다.
 */
const lengths = scrollSections.map((s) => s.vh)
export const totalVh = lengths.reduce((a, b) => a + b, 0)

let cursor = 0
export const sections = scrollSections.map((s, i) => {
  const from = cursor / totalVh
  cursor += lengths[i]
  const to = cursor / totalVh
  return { ...s, range: [from, to], at: (from + to) / 2 }
})

export const cameraPath = createCameraPath(sections)
