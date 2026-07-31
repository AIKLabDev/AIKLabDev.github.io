import { useCallback, useEffect, useMemo, useRef } from 'react'
import { clamp } from '../lib/math'

/**
 * 문서 스크롤을 기준으로 대상 섹션의 진행률(0~1)을 계산한다.
 *
 * drei 의 ScrollControls 를 쓰지 않는 이유:
 * ScrollControls 는 자체 overflow 컨테이너를 만들어 페이지 스크롤을 가져간다.
 * 그러면 sticky 헤더(Header.jsx 의 scrollY 감지)와 해시 앵커(/#about)가 죽는다.
 * 여기서는 문서 스크롤을 그대로 쓰고 sticky 캔버스만 얹는다.
 *
 * 진행률을 state 로 올리지 않는 것은 의도다 — 매 프레임 리렌더를 피하려고
 * ref 로 흘리고, 소비자는 useFrame(3D) 이나 subscribe(DOM) 로 읽는다.
 *
 * @param {import('react').RefObject<HTMLElement>} outerRef 스크롤 높이를 가진 바깥 섹션
 * @param {import('react').RefObject<HTMLElement>} stickyRef 화면에 고정되는 안쪽 요소
 */
export function useScrollProgress(outerRef, stickyRef) {
  const progress = useRef(0)
  const listeners = useRef(new Set())

  const measure = useCallback(() => {
    const outer = outerRef.current
    if (!outer) return

    const rect = outer.getBoundingClientRect()
    // sticky 요소의 실제 높이로 계산한다 — svh/vh 차이나 URL 바 변화에 영향받지 않는다.
    const viewport = stickyRef.current?.offsetHeight || window.innerHeight
    const travel = rect.height - viewport

    const next = travel <= 0 ? 0 : clamp(-rect.top / travel, 0, 1)
    if (next === progress.current) return

    progress.current = next
    for (const fn of listeners.current) fn(next)
  }, [outerRef, stickyRef])

  useEffect(() => {
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)

    // 폰트 로딩·이미지 등으로 레이아웃이 밀리면 travel 이 달라진다.
    const observer = new ResizeObserver(measure)
    if (outerRef.current) observer.observe(outerRef.current)

    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [measure, outerRef])

  /** DOM 오버레이용 — 진행률이 바뀔 때만 호출된다. 등록 즉시 현재값으로 1회 실행. */
  const subscribe = useCallback((fn) => {
    listeners.current.add(fn)
    fn(progress.current)
    return () => listeners.current.delete(fn)
  }, [])

  return useMemo(() => ({ progress, subscribe }), [subscribe])
}
