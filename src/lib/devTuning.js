// 개발 중 URL 로 값을 덮어쓴다. 예) /?snapDuration=1400&camDamp=6
// import.meta.env.DEV 가 상수라 프로덕션 빌드에서는 통째로 제거된다.
export function tune(name, fallback) {
  if (!import.meta.env.DEV || typeof window === 'undefined') return fallback

  const raw = new URLSearchParams(window.location.search).get(name)
  if (raw === null) return fallback

  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}
