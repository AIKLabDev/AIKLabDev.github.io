/**
 * 가벼운 클라이언트 A/B 배정.
 *
 * 우선순위: URL 쿼리 > 저장된 배정 > 무작위 버킷.
 * URL 로 지정하면 그 값이 저장되므로 페이지를 옮겨 다녀도 같은 변형이 유지된다
 * (링크로 특정 변형을 공유해 리뷰할 때 필요).
 *
 * 분석 도구는 여기서 고르지 않는다 — 노출 시점에 이벤트만 쏘고,
 * 어디로 보낼지는 붙이는 쪽이 정한다.
 */

/**
 * @param {string[]} keys 열어볼 수 있는 전체 변형 키. URL 강제 지정은 여기서 찾는다.
 * @param {object} opts
 * @param {string} opts.param URL 쿼리 이름
 * @param {string} opts.storageKey localStorage 키
 * @param {string} opts.defaultKey 브라우저가 아닐 때 쓸 값 (실질적으로 SSR 전용)
 * @param {string[]} [opts.pool] 무작위 배정에 참여하는 변형.
 *        **원소가 하나면 실험이 꺼지고 그 변형이 전원 기본값이 된다.**
 *        생략하면 keys 전체를 쓴다.
 * @returns {{variant: string, source: 'url'|'stored'|'assigned'|'default'}}
 */
export function resolveVariant(keys, { param, storageKey, defaultKey, pool = keys }) {
  if (typeof window === 'undefined') return { variant: defaultKey, source: 'default' }

  // 1) URL 지정 — 리뷰·디버깅용. 배정 풀에서 빠진 변형도 열어볼 수 있어야 하므로
  //    풀이 아니라 keys 전체에서 찾는다.
  const fromUrl = new URLSearchParams(window.location.search).get(param)
  if (fromUrl && keys.includes(fromUrl)) {
    safeSet(storageKey, fromUrl)
    return { variant: fromUrl, source: 'url' }
  }

  // 2) 이전 배정 유지 — 같은 방문자가 매번 다른 걸 보면 실험이 성립하지 않는다.
  //    단 현재 풀에 없는 값(은퇴한 변형, 지난 실험의 잔재)이면 새로 배정한다.
  //    이 검사가 없으면 한번 flow 를 받은 사람은 전원 배포 후에도 계속 flow 를 본다.
  const stored = safeGet(storageKey)
  if (stored && pool.includes(stored)) return { variant: stored, source: 'stored' }

  // 3) 신규 배정
  const variant = pool[Math.floor(Math.random() * pool.length)]
  safeSet(storageKey, variant)
  return { variant, source: 'assigned' }
}

/**
 * 노출 보고. 실험 대상이 화면에 실제로 렌더된 시점에 한 번만 부른다
 * (폴백으로 빠진 사용자를 실험에 넣으면 결과가 오염된다).
 *
 * - window 에 'experiment:exposure' CustomEvent 를 쏜다
 * - GTM 이 붙어 있으면 dataLayer 에도 넣는다 (없으면 아무 일도 안 한다)
 */
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
    return null // 프라이빗 모드·저장소 차단 환경
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* 저장 못 해도 이번 세션은 그대로 진행한다 */
  }
}
