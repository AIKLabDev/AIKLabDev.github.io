import { scrollSections } from '../../data/scrollScene'
import { createCameraPath } from './cameraPath'

// vh 는 다음 섹션까지의 거리다. 섹션이 n 개면 간격은 n-1 개.
const gaps = scrollSections.slice(0, -1).map((s) => s.vh)
export const totalVh = gaps.reduce((a, b) => a + b, 0)

// at[0] = 0, at[n-1] = 1
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
  range: [
    i === 0 ? 0 : (ats[i - 1] + ats[i]) / 2,
    i === lastIndex ? 1 : (ats[i] + ats[i + 1]) / 2,
  ],
}))

export const cameraPath = createCameraPath(sections)
