/**
 * 휠 이벤트가 "같은 물리적 동작의 연속" 인지 판정한다.
 *
 * 세기가 커지지 않으면서 gapMs 안에 이어지면 한 번의 동작으로 본다.
 *
 * 이게 필요한 이유:
 * 자유회전(free-spin) 휠은 한 번 튕기면 감쇠하는 이벤트를 몇 초간 쏟아낸다.
 * 트랙패드 관성도 모양이 같다. 낱개 입력으로 세면 섹션을 전부 걸어 올라간다.
 * 브라우저 관성과 달리 이것들은 진짜 입력이라 스크롤을 잠가도 막히지 않는다 —
 * 셈에서 빼는 수밖에 없다.
 *
 * 반대로 새로 미는 동작은 세기가 커지거나(다시 힘을 줬으니) 간격이 벌어지므로
 * 여기서 걸러지지 않는다. 두 조건을 AND 로 묶는 것이 핵심이다:
 * 간격만 보면 빠르게 연타하는 사용자를 막고, 세기만 보면 일정한 세기로
 * 굴러가는 자유회전을 놓친다.
 *
 * @param {number} mag 이번 이벤트의 |deltaY|
 * @param {number} now 이번 이벤트 시각(ms)
 * @param {{mag: number, at: number}} prev 직전 이벤트
 * @param {number} gapMs 연속으로 볼 최대 간격
 */
export function isWheelContinuation(mag, now, prev, gapMs) {
  return mag <= prev.mag && now - prev.at < gapMs
}
