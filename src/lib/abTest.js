// 우선순위: URL 쿼리 > 저장된 배정 > 무작위 버킷
export function resolveVariant(keys, { param, storageKey, defaultKey, pool = keys }) {
  if (typeof window === 'undefined') return { variant: defaultKey, source: 'default' }

  // 배정 풀에서 빠진 변형도 URL 로는 열 수 있어야 하므로 keys 전체에서 찾는다
  const fromUrl = new URLSearchParams(window.location.search).get(param)
  if (fromUrl && keys.includes(fromUrl)) {
    safeSet(storageKey, fromUrl)
    return { variant: fromUrl, source: 'url' }
  }

  // 현재 풀에 없는 값(은퇴한 변형)이면 새로 배정한다
  const stored = safeGet(storageKey)
  if (stored && pool.includes(stored)) return { variant: stored, source: 'stored' }

  const variant = pool[Math.floor(Math.random() * pool.length)]
  safeSet(storageKey, variant)
  return { variant, source: 'assigned' }
}

export function reportExposure(experiment, variant, extra = {}) {
  if (typeof window === 'undefined') return
  const detail = { experiment, variant, ...extra }

  window.dispatchEvent(new CustomEvent('experiment:exposure', { detail }))

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: 'experiment_exposure', ...detail })
  }
}

function safeGet(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* empty */
  }
}
