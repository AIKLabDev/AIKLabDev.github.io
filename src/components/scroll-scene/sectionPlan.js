import { scrollSections } from '../../data/scrollScene'
import { clamp, smoothstep } from '../../lib/math'
import { createCameraPath } from './cameraPath'

const gaps = scrollSections.slice(0, -1).map((s) => s.vh)
export const totalVh = gaps.reduce((a, b) => a + b, 0)

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

export function sectionBlend(p) {
  let index = 0
  while (index < sections.length - 2 && p > sections[index + 1].at) index++

  const a = sections[index].at
  const b = sections[Math.min(index + 1, sections.length - 1)].at
  const span = b - a
  return { index, t: smoothstep(span <= 0 ? 0 : clamp((p - a) / span, 0, 1)) }
}
