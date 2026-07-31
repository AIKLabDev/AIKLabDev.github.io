import { useEffect, useRef } from 'react'
import { clamp } from '../../lib/math'

/**
 * 첫 화면에서만 보이는 스크롤 유도 (변형 A).
 * 변형 B 는 이 자리에 SceneProgress 가 들어가므로 둘은 배타적이다.
 */
export default function ScrollHint({ subscribe }) {
  const el = useRef(null)

  useEffect(
    () =>
      subscribe((p) => {
        if (el.current) el.current.style.opacity = clamp(1 - p * 22, 0, 1)
      }),
    [subscribe],
  )

  return (
    <div
      ref={el}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex flex-col items-center gap-2 text-brand-100/60"
    >
      <span className="font-mono text-[0.625rem] tracking-[0.3em] uppercase">Scroll</span>
      <span className="h-9 w-px animate-pulse bg-gradient-to-b from-accent-400/80 to-transparent" />
    </div>
  )
}
