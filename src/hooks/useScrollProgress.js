import { useCallback, useEffect, useMemo, useRef } from 'react'
import { clamp } from '../lib/math'

// 진행률은 state 로 올리지 않는다. ref 로 흘리고 useFrame / subscribe 로 읽는다.
export function useScrollProgress(outerRef, stickyRef) {
  const progress = useRef(0)
  const listeners = useRef(new Set())

  const measure = useCallback(() => {
    const outer = outerRef.current
    if (!outer) return

    const rect = outer.getBoundingClientRect()
    // svh/vh 차이와 URL 바 변화를 피하려고 sticky 요소의 실제 높이를 쓴다
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

    const observer = new ResizeObserver(measure)
    if (outerRef.current) observer.observe(outerRef.current)

    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [measure, outerRef])

  const subscribe = useCallback((fn) => {
    listeners.current.add(fn)
    fn(progress.current)
    return () => listeners.current.delete(fn)
  }, [])

  return useMemo(() => ({ progress, subscribe }), [subscribe])
}
