import { scrollSections } from '../../data/scrollScene'
import { clamp, lerp, smoothstep } from '../../lib/math'

/**
 * 텍스트 정렬에 따라 피사체를 화면에서 반대쪽으로 밀어낸다.
 * 값은 뷰포트 비율 [오른쪽으로, 위로] — 카메라를 옮기는 대신 투영을 어긋내므로
 * 화각·거리와 무관하게 항상 같은 화면 비율만큼 이동한다.
 */
const FRAME_BY_ALIGN = {
  left: [0.17, 0],
  right: [-0.17, 0],
  center: [0, 0.14], // 텍스트가 아래로 가므로 피사체를 위로
}

/**
 * 각 섹션 구간의 중앙을 카메라 키프레임으로 삼는다.
 * 섹션 텍스트가 완전히 떠 있는 순간에 카메라도 그 구도에 도달한다.
 */
const keyframes = scrollSections.map((s) => ({
  at: (s.range[0] + s.range[1]) / 2,
  position: s.camera.position,
  target: s.camera.target,
  fov: s.camera.fov,
  // camera.frame 으로 섹션별 직접 지정도 가능하다
  frame: s.camera.frame ?? FRAME_BY_ALIGN[s.align] ?? [0, 0],
}))

export const firstKeyframe = keyframes[0]

/** 매 프레임 할당을 피하려고 재사용 객체를 만들어 쓴다. */
export const createCameraSample = () => ({
  position: [...firstKeyframe.position],
  target: [...firstKeyframe.target],
  fov: firstKeyframe.fov,
  frame: [...firstKeyframe.frame],
})

/** 진행률 p 에서의 카메라 상태를 out 에 채운다. 키프레임 밖은 양 끝에서 고정된다. */
export function sampleCamera(p, out) {
  const n = keyframes.length
  let i = 0
  while (i < n - 2 && p > keyframes[i + 1].at) i++

  const a = keyframes[i]
  const b = keyframes[Math.min(i + 1, n - 1)]
  const span = b.at - a.at
  const t = smoothstep(span <= 0 ? 0 : clamp((p - a.at) / span, 0, 1))

  for (let k = 0; k < 3; k++) {
    out.position[k] = lerp(a.position[k], b.position[k], t)
    out.target[k] = lerp(a.target[k], b.target[k], t)
  }
  out.frame[0] = lerp(a.frame[0], b.frame[0], t)
  out.frame[1] = lerp(a.frame[1], b.frame[1], t)
  out.fov = lerp(a.fov, b.fov, t)
  return out
}
