import { useEffect, useRef } from 'react'
import { sceneConfig } from '../../data/scrollScene'
import { clamp } from '../../lib/math'

/**
 * 진행 표시 + 건너뛰기 — 두 변형 공통.
 *
 * 히어로가 7화면을 넘어가면 "얼마나 남았는지"와 "빠져나갈 길"이 없는 게
 * 실제 이탈 요인이 된다.
 *
 * 숫자는 리렌더 없이 textContent 로 갈아끼운다 — 스크롤 한 번에 리렌더가
 * 수십 번 도는 것을 피하려는 것으로, 오버레이 텍스트와 같은 방식이다.
 */
export default function SceneProgress({ subscribe, sections, showSkip = true }) {
  const step = useRef(null)
  const bar = useRef(null)

  useEffect(
    () =>
      subscribe((p) => {
        // 현재 섹션 = 진행률이 속한 구간
        let i = sections.findIndex((s) => p < s.range[1])
        if (i === -1) i = sections.length - 1

        const label = String(i + 1).padStart(2, '0')
        if (step.current && step.current.textContent !== label) step.current.textContent = label
        if (bar.current) bar.current.style.transform = `scaleX(${clamp(p, 0, 1)})`
      }),
    [subscribe, sections],
  )

  const total = String(sections.length).padStart(2, '0')

  return (
    <div className="absolute inset-x-0 bottom-0 z-20">
      {/* 전체 진행 막대 — 남은 양을 한눈에 */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/10">
        <div ref={bar} className="h-full origin-left bg-accent-400/70" style={{ transform: 'scaleX(0)' }} />
      </div>

      <div className="container-page flex items-center gap-5 pb-6 text-xs sm:gap-7">
        <span className="hidden font-mono tracking-[0.2em] text-brand-100/50 uppercase sm:inline">
          Scroll to Explore
        </span>

        <span className="font-mono tracking-widest text-brand-100/70" aria-live="polite">
          <span ref={step} className="text-accent-400">
            01
          </span>
          <span className="mx-1 text-brand-100/30">/</span>
          {total}
        </span>

        {showSkip && (
          <a
            href={sceneConfig.skipTarget}
            className="pointer-events-auto ml-auto font-semibold text-brand-100/70 underline underline-offset-4 transition-colors hover:text-white"
          >
            소개 건너뛰기
          </a>
        )}
      </div>
    </div>
  )
}
