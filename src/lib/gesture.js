// 자유회전 휠·트랙패드 관성이 쏟아내는 감쇠 이벤트를 한 동작으로 묶는다.
// 세기가 커지지 않으면서 gapMs 안에 이어지면 연속으로 본다.
export function isWheelContinuation(mag, now, prev, gapMs) {
  return mag <= prev.mag && now - prev.at < gapMs
}
