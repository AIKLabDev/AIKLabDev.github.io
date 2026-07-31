/** #rrggbb → [r, g, b] */
function parseHex(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * 두 색 사이를 t(0~1) 로 보간해 'rgb(r, g, b)' 를 돌려준다.
 *
 * 스크롤 값에서 매번 계산해 인라인 스타일로 쓴다 — CSS transition 은 스크롤을
 * 따라오지 못하고, 되감을 때 대칭이 깨진다.
 * 파싱 결과는 캐시한다(호출이 스크롤마다 일어난다).
 */
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
