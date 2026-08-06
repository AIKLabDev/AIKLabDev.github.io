// 같은 페이지 앵커로 이동하되 주소에 해시를 남기지 않는다.
let lastJumpAt = 0

// useSectionSnap 의 관성 재포착이 앵커 점프를 관성으로 오판하지 않게 하는 신호
export function recentAnchorJump(withinMs = 1200) {
  return performance.now() - lastJumpAt < withinMs
}

export function handleAnchorClick(event) {
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
    return
  }
  if (!target) return

  event.preventDefault()
  lastJumpAt = performance.now()
  target.scrollIntoView({ block: 'start' })
}
