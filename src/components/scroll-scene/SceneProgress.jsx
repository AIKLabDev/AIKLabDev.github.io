import { useEffect, useRef } from 'react'
import Icon from '../Icon'
import { sceneConfig } from '../../data/scrollScene'
import { clamp } from '../../lib/math'

export default function SceneProgress({ subscribe, sections, showSkip = true }) {
  const step = useRef(null)
  const bar = useRef(null)
  const skip = useRef(null)
  const hint = useRef(null)

  useEffect(
    () =>
      subscribe((p) => {
        let i = sections.findIndex((s) => p < s.range[1])
        if (i === -1) i = sections.length - 1

        const label = String(i + 1).padStart(2, '0')
        if (step.current && step.current.textContent !== label) step.current.textContent = label
        if (bar.current) bar.current.style.transform = `scaleX(${clamp(p, 0, 1)})`

        // opacity 0 은 클릭을 막지 못하므로 링크 자신을 visibility 로 뗀다
        if (skip.current) skip.current.style.visibility = p > sceneConfig.outro.from ? 'hidden' : ''

        if (hint.current) hint.current.style.opacity = p > sections[0].range[1] ? '0' : '1'
      }),
    [subscribe, sections],
  )

  const total = String(sections.length).padStart(2, '0')

  return (
    <>
      {showSkip && (
        <a
          ref={skip}
          href={sceneConfig.skipTarget}
          // top 은 헤더 높이(h-16 / lg:h-20) 아래여야 헤더가 클릭을 가로채지 않는다
          className="pointer-events-auto absolute top-20 right-4 z-20 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-ink-950/40 py-2 pr-3 pl-4 text-xs font-semibold text-brand-100/85 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-ink-950/60 hover:text-white sm:top-24 lg:right-6"
        >
          소개 건너뛰기
          <Icon name="arrowRight" className="size-3.5" strokeWidth={2} />
        </a>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10">
          <div ref={bar} className="h-full origin-left bg-accent-400/70" style={{ transform: 'scaleX(0)' }} />
        </div>

        <div className="container-page flex items-center gap-5 pb-6 text-xs sm:gap-7">
          <span className="hidden font-mono tracking-[0.2em] text-brand-100/50 uppercase sm:inline">
            Scroll to Explore
          </span>

          <span
            ref={hint}
            className="flex items-center gap-1.5 font-mono tracking-[0.2em] text-brand-100/50 uppercase transition-opacity duration-500 sm:hidden"
          >
            Scroll
            <Icon
              name="arrowRight"
              className="size-3.5 rotate-90 motion-safe:animate-[scroll-hint_1.6s_ease-in-out_infinite]"
              strokeWidth={2}
            />
          </span>

          <span className="ml-auto font-mono tracking-widest text-brand-100/70" aria-live="polite">
            <span ref={step} className="text-accent-400">
              01
            </span>
            <span className="mx-1 text-brand-100/30">/</span>
            {total}
          </span>
        </div>
      </div>
    </>
  )
}
