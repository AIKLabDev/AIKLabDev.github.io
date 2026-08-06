import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { sceneConfig } from '../../data/scrollScene'

// fixed 가 아니라 absolute 여야 한다. 히어로 sticky 박스 안에 갇혀야
// 스크롤이 복원된 사용자의 화면까지 덮지 않는다.
export default function SceneLoader({ ready }) {
  const { active, progress } = useProgress()

  const [minElapsed, setMinElapsed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), sceneConfig.loading.minMs)
    return () => clearTimeout(t)
  }, [])

  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), sceneConfig.loading.maxMs)
    return () => clearTimeout(t)
  }, [])

  const hidden = (ready && !active && minElapsed) || timedOut

  useEffect(() => {
    if (hidden) return
    const el = document.documentElement
    el.style.overflow = 'hidden'
    return () => {
      el.style.overflow = ''
    }
  }, [hidden])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!hidden}
      className={`absolute inset-0 z-40 bg-ink-950 transition-opacity duration-500 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-x-0 bottom-0 h-px overflow-hidden bg-white/10">
        {progress > 0 ? (
          <div
            className="h-full bg-accent-400/70 transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        ) : (
          <div
            className="h-full w-1/5 bg-accent-400/70"
            style={{ animation: 'loading-sweep 1.4s ease-in-out infinite' }}
          />
        )}
      </div>

      <div className="container-page absolute inset-x-0 bottom-0 flex items-center gap-3 pb-6">
        <span className="font-mono text-[0.625rem] tracking-[0.3em] text-brand-100/45 uppercase">Loading</span>
        {progress > 0 && (
          <span className="font-mono text-[0.625rem] text-accent-400 tabular-nums">{Math.round(progress)}%</span>
        )}
      </div>
    </div>
  )
}
