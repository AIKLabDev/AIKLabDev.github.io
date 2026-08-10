let period = 1
let offset = 0

/**
 * 격자가 자기 자신으로 되돌아오는 주기를 잡는다.
 *
 * 두 인자는 모두 **선 사이의 거리**다 (drei Grid 의 sectionSize 는 칸 수가 아니다).
 * 그래서 주기는 둘의 최소공배수다 — 얇은 선만 맞는 값으로 접으면 굵은 선이 튄다.
 */
export function setGroundPeriod(cellSize, sectionSize) {
  if (!(cellSize > 0) || !(sectionSize > 0)) return
  for (let k = 1; k <= 64; k++) {
    const span = sectionSize * k
    const cells = span / cellSize
    if (Math.abs(cells - Math.round(cells)) < 1e-6) {
      period = span
      return
    }
  }
  period = sectionSize * 64
}

export function setGroundFlow(step) {
  offset = (offset + step) % period
}

export function resetGroundFlow() {
  offset = 0
}

export function getGroundFlow() {
  return offset
}
