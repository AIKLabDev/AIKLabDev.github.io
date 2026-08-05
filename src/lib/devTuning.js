/**
 * 개발 중에만 동작하는 URL 튜닝 오버라이드.
 *
 * 스크롤 속도·감쇠 같은 "감각"으로 정하는 값은 리빌드를 돌며 맞추면 시간이 녹는다.
 * 주소창에서 바로 바꿔보고, 마음에 드는 값을 data/scrollScene.js 에 적으면 된다.
 *
 * import.meta.env.DEV 가 상수로 치환되므로 프로덕션 빌드에서는 이 분기와
 * 아래 코드가 통째로 제거된다.
 *
 * 예) /?hero=snap&snapDuration=1400&camDamp=6
 */
export function tune(name, fallback) {
  if (!import.meta.env.DEV || typeof window === 'undefined') return fallback

  const raw = new URLSearchParams(window.location.search).get(name)
  if (raw === null) return fallback

  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}
