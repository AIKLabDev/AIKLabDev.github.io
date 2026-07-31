import { useEffect } from 'react'

/**
 * 주소에 해시를 달고 들어온 첫 진입에서 그 위치로 옮긴다.
 *
 * 브라우저의 앵커 이동은 이미 실패한 뒤다 — 처음 받는 HTML 에는 #root 가 비어
 * 있어 대상 요소가 없고, 못 찾으면 그대로 포기한다. React 가 렌더한 뒤에는
 * 아무도 다시 시도하지 않으므로, 주소만 /#about 이고 화면은 맨 위에 있는
 * 상태가 된다(히어로가 8화면이라 특히 티가 난다).
 *
 * 첫 마운트에서만 동작한다. 페이지 안에서 앵커를 누르는 것은 브라우저가 이미
 * 부드럽게 처리하므로, 해시가 바뀔 때마다 끼어들면 그 동작을 끊어먹는다.
 *
 * 늦게 한 번 더 시도하는 것은 웹폰트나 이미지로 레이아웃이 밀리는 경우 때문이다.
 * 헤더 높이만큼의 여백은 CSS 의 scroll-padding-top 이 알아서 처리한다.
 */
export default function HashScroll() {
  useEffect(() => {
    const { hash } = window.location
    if (!hash || hash === '#') return

    let cancelled = false
    const go = () => {
      if (cancelled) return
      // 해시는 사용자가 주소창에 아무거나 넣을 수 있으므로 선택자로 쓰기 전에 감싼다
      try {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'instant', block: 'start' })
      } catch {
        // 선택자로 성립하지 않는 해시 — 무시한다
      }
    }

    go()
    const retry = setTimeout(go, 300)
    return () => {
      cancelled = true
      clearTimeout(retry)
    }
  }, [])

  return null
}
