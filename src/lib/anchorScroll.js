/**
 * 같은 페이지 앵커로 이동하되 주소에 해시를 남기지 않는다.
 *
 * 히어로의 "회사 알아보기" 나 "소개 건너뛰기" 는 페이지 안에서 자리를 옮기는
 * 동작이지 어딘가로 이동하는 것이 아닌데, 기본 동작대로 두면 주소가 /#about 이
 * 되어 그대로 남는다. 공유하거나 새로고침할 때 히어로를 건너뛴 주소가 되고,
 * 뒤로가기를 눌러도 페이지가 아니라 해시만 되돌아간다.
 *
 * href 는 그대로 둔다 — 새 탭으로 열기, 주소 복사, 스크린리더에서 목적지를
 * 읽어주는 것이 전부 href 에서 나온다. 왼쪽 클릭만 우리가 가로챈다.
 *
 * 부드럽게 움직일지는 지정하지 않는다. index.css 의 scroll-behavior 가
 * prefers-reduced-motion 을 이미 반영하고 있으므로 그 판단을 그대로 따른다.
 *
 * 요소를 못 찾으면 아무것도 하지 않는다 — 기본 동작이 그대로 일어나서
 * 최소한 브라우저가 알아서 처리한다.
 *
 * 링크가 여럿이라 각 요소에 붙이는 대신 위임으로 받는다.
 */
let lastJumpAt = 0

/**
 * 방금 앵커 클릭으로 스크롤을 옮겼는지.
 *
 * useSectionSnap 의 관성 재포착 휴리스틱은 "히어로 안에서 입력 없이 스크롤이
 * 크게 움직이면 관성"이라고 가정하는데, 이 앵커 점프도 정확히 그렇게 보인다
 * (버튼은 클릭 시점에 이미 떼어졌고, scrollIntoView 는 wheel/touch/key 를
 * 거치지 않는다). 그대로 두면 건너뛰기 도중 히어로 끝 경계로 되잡혀 온다 —
 * 실제로 겪은 문제라 여기서 짧게 신호를 남겨 그 휴리스틱이 양보하게 한다.
 */
export function recentAnchorJump(withinMs = 1200) {
  return performance.now() - lastJumpAt < withinMs
}

export function handleAnchorClick(event) {
  // 새 탭·다운로드 등 사용자가 다른 의도를 표시한 클릭은 건드리지 않는다
  if (event.defaultPrevented) return
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  const link = event.target.closest?.('a[href^="#"]')
  if (!link) return

  const hash = link.getAttribute('href')
  if (!hash || hash === '#') return

  let target
  try {
    target = document.querySelector(hash)
  } catch {
    return // 선택자로 성립하지 않는 해시 — 브라우저에 맡긴다
  }
  if (!target) return

  event.preventDefault()
  lastJumpAt = performance.now()
  target.scrollIntoView({ block: 'start' })
}
