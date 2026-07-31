import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { sceneConfig } from '../../data/scrollScene'
import { site } from '../../data/site'

/**
 * 첫 접속 로딩 화면.
 *
 * 판정 기준이 "에셋 로드 완료" 가 아니라 **첫 프레임이 실제로 그려졌는가** 인 것이
 * 핵심이다. useProgress 만 보면 placeholder 처럼 받을 파일이 없는 경우 처음부터
 * 완료로 나오고, 그러면 셰이더 컴파일·환경맵 굽는 동안 어두운 빈 화면이 그대로
 * 노출된다. 실제 모델을 붙이면 두 조건이 모두 필요해진다.
 *
 * 화면 전체(헤더 포함)를 덮는다. 헤더만 남겨두면 로딩 중에 메뉴를 누를 수 있는데,
 * 그 시점의 페이지는 아직 준비되지 않았다.
 */
export default function SceneLoader({ ready }) {
  const { active, progress } = useProgress()

  // 최소 노출 시간이 지났는가. 준비가 순식간에 끝나도 이만큼은 보여준다 —
  // 바로 사라지면 로딩 화면이 깜빡인 것처럼 보여 오히려 산만하다.
  const [minElapsed, setMinElapsed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), sceneConfig.loading.minMs)
    return () => clearTimeout(t)
  }, [])

  // 안전장치: 무슨 일이 있어도 사용자를 로딩 화면에 가두지 않는다.
  // 첫 프레임 신호가 오지 않는 상황(렌더 루프 정지 등)이 실제로 존재한다.
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), sceneConfig.loading.maxMs)
    return () => clearTimeout(t)
  }, [])

  const hidden = (ready && !active && minElapsed) || timedOut

  // 로딩 중에는 스크롤을 잠근다 — 풀리는 순간 서사 한가운데 서 있으면 곤란하다
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
      className={`fixed inset-0 z-60 grid place-items-center bg-ink-950 transition-opacity duration-500 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-7">
        <img
          src="/brand/aikorea-logo.png"
          alt={`${site.name} 로고`}
          className="h-7 w-auto brightness-0 invert lg:h-8"
        />

        <span className="relative grid size-16 place-items-center">
          {/* 바탕 링 + 도는 호. 받을 파일이 없을 때는 진행률이 없으므로 회전으로 표현한다 */}
          <svg viewBox="0 0 48 48" className="absolute size-full -rotate-90" aria-hidden="true">
            <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/15" />
            <circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="132"
              strokeDashoffset="99"
              className="origin-center animate-spin text-accent-400"
              style={{ animationDuration: '1.1s' }}
            />
          </svg>
          {progress > 0 && (
            <span className="font-mono text-[0.6875rem] font-bold text-white tabular-nums">
              {Math.round(progress)}
            </span>
          )}
        </span>

        <span className="font-mono text-[0.625rem] tracking-[0.3em] text-brand-100/45 uppercase">Loading</span>
      </div>
    </div>
  )
}
