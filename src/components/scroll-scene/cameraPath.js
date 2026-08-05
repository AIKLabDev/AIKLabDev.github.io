import { sceneConfig } from '../../data/scrollScene'
import { clamp, lerp, smoothstep } from '../../lib/math'

/**
 * 섹션 목록에서 카메라 경로를 만든다.
 * 각 섹션 구간의 중앙(at)이 키프레임이고, 그 사이는 smoothstep 보간된다.
 * 스냅 변형은 이 at 지점을 이동 목표로 삼는다.
 */
export function createCameraPath(sections) {
  const keyframes = sections.map((s) => ({
    at: s.at,
    position: s.camera.position,
    target: s.camera.target,
    fov: s.camera.fov,
    // 텍스트와 겹치지 않게 피사체를 반대쪽으로 민다.
    // 기본값은 정렬에서 오고, 섹션의 camera.frame 으로 개별 지정하면 그쪽이 이긴다.
    frame: s.camera.frame ?? sceneConfig.framing.byAlign[s.align] ?? [0, 0],
  }))

  const first = keyframes[0]
  const n = keyframes.length

  /** 매 프레임 할당을 피하려고 재사용 객체를 만들어 쓴다. */
  const createSample = () => ({
    position: [...first.position],
    target: [...first.target],
    fov: first.fov,
    frame: [...first.frame],
  })

  /** 진행률 p 에서의 카메라 상태를 out 에 채운다. 키프레임 밖은 양 끝에서 고정된다. */
  const sample = (p, out) => {
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

  return { keyframes, firstKeyframe: first, createSample, sample }
}
