import { useEffect, useRef } from 'react'
import Icon from '../Icon'
import { sceneConfig } from '../../data/scrollScene'
import { clamp } from '../../lib/math'

/**
 * 진행 표시 + 건너뛰기 — 두 변형 공통.
 *
 * 히어로가 7화면을 넘어가면 "얼마나 남았는지"와 "빠져나갈 길"이 없는 게
 * 실제 이탈 요인이 된다. 건너뛰기는 진행 막대와 같은 하단이 아니라
 * 화면에 들어오자마자 눈에 띄도록 우상단에 고정한다 — 8장을 다 훑어야
 * 찾아지는 자리에 있으면 있으나 마나다.
 *
 * 숫자는 리렌더 없이 textContent 로 갈아끼운다 — 스크롤 한 번에 리렌더가
 * 수십 번 도는 것을 피하려는 것으로, 오버레이 텍스트와 같은 방식이다.
 */
export default function SceneProgress({ subscribe, sections, showSkip = true }) {
  const step = useRef(null)
  const bar = useRef(null)
  const skip = useRef(null)
  const hint = useRef(null)

  useEffect(
    () =>
      subscribe((p) => {
        // 현재 섹션 = 진행률이 속한 구간
        let i = sections.findIndex((s) => p < s.range[1])
        if (i === -1) i = sections.length - 1

        const label = String(i + 1).padStart(2, '0')
        if (step.current && step.current.textContent !== label) step.current.textContent = label
        if (bar.current) bar.current.style.transform = `scaleX(${clamp(p, 0, 1)})`

        // 마지막 전환이 시작되면 건너뛰기 링크를 아예 뗀다.
        // 이 층은 opacity 로 걷히는데 opacity 0 은 클릭을 막지 못한다. 그대로 두면
        // 3D 가 사라진 뒤에도 우상단에 보이지 않는 링크가 남아, 그 자리를 누르면
        // 주소가 #about 으로 바뀐다. 상위에서 pointer-events 를 꺼도 이 링크는
        // pointer-events-auto 를 명시하고 있어 덮어쓴다 — 링크 자신을 꺼야 한다.
        // visibility 면 탭 순서와 접근성 트리에서도 함께 빠진다.
        if (skip.current) skip.current.style.visibility = p > sceneConfig.outro.from ? 'hidden' : ''

        // 첫 섹션을 넘겼으면 넘기는 법을 아는 것이니 안내를 거둔다
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
          /*
           * 헤더(z-50, h-16 / lg:h-20)와 같은 위치에 겹치면 헤더가 클릭을
           * 가로챈다 — 헤더 크롬은 히어로 위에서 opacity 로만 숨겨질 뿐
           * pointer-events 는 자기 영역 전부에서 살아 있다. 그래서 헤더 높이
           * 바로 아래에 둔다. 우측 정렬은 진행 막대의 우측 끝과 맞춘다.
           */
          className="pointer-events-auto absolute top-20 right-4 z-20 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-ink-950/40 py-2 pr-3 pl-4 text-xs font-semibold text-brand-100/85 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-ink-950/60 hover:text-white sm:top-24 lg:right-6"
        >
          소개 건너뛰기
          <Icon name="arrowRight" className="size-3.5" strokeWidth={2} />
        </a>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20">
        {/* 전체 진행 막대 — 남은 양을 한눈에 */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10">
          <div ref={bar} className="h-full origin-left bg-accent-400/70" style={{ transform: 'scaleX(0)' }} />
        </div>

        <div className="container-page flex items-center gap-5 pb-6 text-xs sm:gap-7">
          <span className="hidden font-mono tracking-[0.2em] text-brand-100/50 uppercase sm:inline">
            Scroll to Explore
          </span>

          {/* 좁은 화면 전용 — 위 문구가 숨겨지는 자리를 대신한다.
              화살표가 아래로 움직여야 세로 스크롤임이 전달된다(정지해 있으면
              가로 스와이프와 구분되지 않는다). 모션 저감 사용자에겐 멈춰 있다. */}
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
