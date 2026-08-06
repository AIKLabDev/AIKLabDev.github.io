import { readLastScroll } from './lastScroll'

// 히어로 진행률(0 = 3D 한가운데, 1 = 평범한 웹페이지)을 헤더에 흘린다.
// 첫 페인트부터 값이 정해져 있어야 해서 초기값을 경로·스크롤 위치로 판단한다.
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

export function getHeroReveal() {
  return reveal
}

export function subscribeHeroReveal(fn) {
  listeners.add(fn)
  fn(reveal)
  return () => listeners.delete(fn)
}
