/**
 * WebGL 지원 감지. 컨텍스트 생성은 비싸므로 결과를 한 번만 캐시한다.
 * (SSR 이 없는 프로젝트지만 window 가드는 남겨 둔다)
 */
let cached = null

export function isWebGLAvailable() {
  if (cached !== null) return cached
  if (typeof window === 'undefined') return (cached = false)

  try {
    const canvas = document.createElement('canvas')
    cached = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    cached = false
  }
  return cached
}
