// 브라우저의 스크롤 복원은 React 마운트보다 늦게 일어나서 첫 렌더의
// window.scrollY 를 믿을 수 없다. 떠날 때 값을 적어두고 그걸 읽는다.
const KEY = 'aikorea:lastScroll'

export function readLastScroll() {
  try {
    return Number(sessionStorage.getItem(KEY)) || 0
  } catch {
    return 0
  }
}

export function writeLastScroll(value) {
  try {
    sessionStorage.setItem(KEY, String(Math.round(value)))
  } catch {
    /* empty */
  }
}
