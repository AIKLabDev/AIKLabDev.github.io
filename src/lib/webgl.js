// 컨텍스트 생성이 비싸므로 결과를 한 번만 캐시한다
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
