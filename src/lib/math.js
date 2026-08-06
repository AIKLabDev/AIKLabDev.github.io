export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v)

export const lerp = (a, b, t) => a + (b - a) * t

export const smoothstep = (t) => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

// 프레임레이트에 독립적인 감쇠 추종
export const damp = (current, target, lambda, delta) =>
  lerp(current, target, 1 - Math.exp(-lambda * delta))

export const rangeProgress = (p, from, to) => (to === from ? 0 : clamp((p - from) / (to - from), 0, 1))
