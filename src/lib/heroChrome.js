/**
 * 히어로가 헤더에게 "지금 얼마나 웹페이지처럼 보여야 하는가" 를 알리는 통로.
 *
 * 0 = 3D 서사 한가운데. 헤더는 로고만 남기고 배경도 없앤다.
 * 1 = 평범한 웹페이지. 헤더는 원래대로 메뉴와 흰 배경을 갖는다.
 *
 * 헤더와 히어로는 형제라 props 로 내려줄 수 없고, context 로 올리면 스크롤마다
 * 헤더가 리렌더된다. 그래서 구독으로 값만 흘리고 DOM 은 각자 직접 만진다 —
 * 이 프로젝트가 진행률을 다루는 방식과 같다.
 *
 * 기본값이 1 인 것은 의도다. 히어로가 없는 페이지(공고 상세)에서도 헤더가
 * 정상으로 보여야 한다.
 */
let reveal = 1
const listeners = new Set()

export function setHeroReveal(value) {
  const next = value < 0 ? 0 : value > 1 ? 1 : value
  if (next === reveal) return
  reveal = next
  for (const fn of listeners) fn(reveal)
}

/** 등록 즉시 현재값으로 1회 호출한다. 해제 함수를 돌려준다. */
export function subscribeHeroReveal(fn) {
  listeners.add(fn)
  fn(reveal)
  return () => listeners.delete(fn)
}
