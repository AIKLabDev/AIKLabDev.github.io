import { scrollSections } from '../../data/scrollScene'
import { createCameraPath } from './cameraPath'

/**
 * 섹션 배치 계산.
 *
 * 핵심: **첫 섹션의 키프레임이 진행률 0, 마지막이 1 에 정확히 놓인다.**
 *
 * 예전에는 키프레임을 섹션 구간의 중앙에 두었다. 그러면 페이지 최상단(p=0)이
 * 어느 키프레임도 아닌 위치가 되어 "0번 섹션"이 있는 것처럼 굴었다 —
 * 첫 입력 한 번이 01번으로 가는 데 쓰이고, 그동안 진행 막대만 움직였다.
 * 끝에도 같은 유령 단계가 있었다(마지막 키프레임 이후 남는 구간).
 *
 * 그래서 vh 는 "섹션의 폭"이 아니라 **다음 섹션까지의 거리**다.
 * 섹션이 n 개면 간격은 n-1 개이고, 마지막 섹션의 vh 는 쓰이지 않는다.
 *
 * 텍스트 구간(range)은 이웃 키프레임과의 중간점까지로 계산한다 — 손으로 적지
 * 않는다. 거리와 구간을 따로 관리하면 한쪽만 고쳤을 때 조용히 어긋난다.
 */
const gaps = scrollSections.slice(0, -1).map((s) => s.vh)
export const totalVh = gaps.reduce((a, b) => a + b, 0)

/** 각 섹션의 키프레임 위치. at[0] = 0, at[n-1] = 1 이 보장된다. */
let cursor = 0
const ats = scrollSections.map((_, i) => {
  if (i === 0) return 0
  cursor += gaps[i - 1]
  return cursor / totalVh
})

const lastIndex = scrollSections.length - 1

export const sections = scrollSections.map((s, i) => ({
  ...s,
  at: ats[i],
  // 이웃 키프레임과의 중간점에서 다음 섹션에 자리를 넘긴다
  range: [
    i === 0 ? 0 : (ats[i - 1] + ats[i]) / 2,
    i === lastIndex ? 1 : (ats[i] + ats[i + 1]) / 2,
  ],
}))

export const cameraPath = createCameraPath(sections)
