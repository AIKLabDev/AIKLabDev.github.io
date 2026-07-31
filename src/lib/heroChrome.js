import { readLastScroll } from './lastScroll'

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
 * 초기값을 경로에서 정하는 것이 중요하다. 기본을 1(보임)로 두면 히어로 페이지에서
 * 헤더가 완전한 모습으로 한 번 그려진 뒤 감춰져서, 새로고침할 때마다 상단 메뉴가
 * 번쩍인다. effect 로 감추는 것은 이미 늦다 — 첫 페인트부터 감춰져 있어야 한다.
 *
 * 스크롤 위치도 같이 본다. 새로고침하면 브라우저가 위치를 복원하는데, 히어로를
 * 이미 지나 실제 콘텐츠를 읽던 사람에게는 평범한 헤더가 정답이다. 경로만 보면
 * 그 사람의 첫 페인트에서 메뉴가 사라졌다가 스크롤 구독이 붙은 뒤에야 돌아온다.
 *
 * 여기서 경로를 아는 것은 결합이다. 히어로가 '/' 외의 경로로 옮겨가면 같이 고쳐야 한다.
 */
const HERO_PATH = '/'
const atHeroStart = () => window.location.pathname === HERO_PATH && readLastScroll() < window.innerHeight * 0.5
let reveal = typeof window !== 'undefined' && atHeroStart() ? 0 : 1
const listeners = new Set()

export function setHeroReveal(value) {
  const next = value < 0 ? 0 : value > 1 ? 1 : value
  if (next === reveal) return
  reveal = next
  for (const fn of listeners) fn(reveal)
}

/** 첫 렌더에서 인라인 스타일을 정할 때 쓴다 — 구독은 페인트 뒤라 늦다. */
export function getHeroReveal() {
  return reveal
}

/** 등록 즉시 현재값으로 1회 호출한다. 해제 함수를 돌려준다. */
export function subscribeHeroReveal(fn) {
  listeners.add(fn)
  fn(reveal)
  return () => listeners.delete(fn)
}
