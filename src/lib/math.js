/** 스크롤 연동 장면에서 쓰는 최소 보간 유틸. (외부 의존 없이 유지) */

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v)

export const lerp = (a, b, t) => a + (b - a) * t

/** 0~1 구간을 부드럽게 — 키프레임 사이 카메라 전환에 쓴다. */
export const smoothstep = (t) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

/**
 * 프레임레이트에 독립적인 감쇠 추종.
 * lambda 가 클수록 목표에 빨리 붙는다. (지수 감쇠라 delta 가 튀어도 안정)
 */
export const damp = (current, target, lambda, delta) =>
  lerp(current, target, 1 - Math.exp(-lambda * delta))

/** [0,1] 전체 진행률을 [from,to] 구간 안의 지역 진행률로 환산한다. */
export const rangeProgress = (p, from, to) => (to === from ? 0 : clamp((p - from) / (to - from), 0, 1))
