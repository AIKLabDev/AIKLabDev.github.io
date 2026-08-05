/**
 * 이 페이지를 떠날 때의 스크롤 위치를 기억한다.
 *
 * 새로고침하면 브라우저가 스크롤 위치를 복원해 준다. 문제는 그 복원이 React
 * 마운트보다 **늦게** 일어난다는 것이다. 그래서 첫 렌더에서 window.scrollY 를
 * 읽으면 페이지 한참 아래에서 새로고침했어도 0 이 나온다.
 *
 * "지금 히어로를 보고 있는가" 를 첫 페인트에 정해야 하는 곳이 두 군데 있다
 * (로딩 화면을 띄울지, 헤더를 감출지). 둘 다 한 프레임 늦으면 화면이 번쩍이므로
 * effect 로 미룰 수 없다. 그래서 떠날 때 값을 적어두고 그걸 본다.
 *
 * sessionStorage 는 탭 단위라 다른 탭에 영향을 주지 않고, 탭을 닫으면 사라진다.
 * 차단된 환경(프라이버시 설정)에서는 그냥 0 으로 떨어지는데, 그때는 "맨 위에서
 * 시작" 으로 동작하므로 첫 방문과 같아 안전한 쪽이다.
 */
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
    // 저장이 막혀 있으면 그냥 포기한다 — 첫 방문처럼 동작하면 된다
  }
}
