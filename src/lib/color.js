function parseHex(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// 스크롤마다 호출되므로 파싱 결과를 캐시한다
const cache = new Map()

export function mixHex(from, to, t) {
  const key = from + to
  let pair = cache.get(key)
  if (!pair) {
    pair = [parseHex(from), parseHex(to)]
    cache.set(key, pair)
  }
  const [a, b] = pair
  const k = t < 0 ? 0 : t > 1 ? 1 : t
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)}, ${Math.round(a[1] + (b[1] - a[1]) * k)}, ${Math.round(
    a[2] + (b[2] - a[2]) * k,
  )})`
}
