import { useEffect, useRef } from 'react'
import { sceneConfig, scrollSections } from '../../data/scrollScene'
import { clamp, rangeProgress } from '../../lib/math'
import { Button } from '../ui'

/**
 * 섹션 텍스트 오버레이 — 3D 가 아니라 평범한 DOM 이다.
 * (캔버스 안에 텍스트를 넣으면 선택·검색·스크린리더가 전부 죽는다)
 *
 * 진행률이 바뀔 때마다 style 을 직접 쓴다. state 로 올리면 스크롤 한 번에
 * 리렌더가 수십 번 발생한다. 숨은 섹션도 DOM 에 남겨 두므로(opacity 0)
 * 스크린리더는 8개 서사를 순서대로 그대로 읽는다.
 */

const alignment = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
}

/**
 * 텍스트를 화면 어디에 놓을지.
 * 좁은 화면에서는 좌우로 피할 자리가 없으므로 항상 아래에 깔고 피사체를 위로 올린다
 * (CameraRig 의 compact 분기와 짝이다). 가운데 정렬 섹션도 같은 이유로 아래에 둔다.
 */
const placement = {
  left: 'items-end pb-16 sm:pb-20 md:items-center md:pt-16 md:pb-0',
  right: 'items-end pb-16 sm:pb-20 md:items-center md:pt-16 md:pb-0',
  center: 'items-end pb-16 sm:pb-20',
}

export default function SceneOverlay({ subscribe }) {
  const items = useRef([])
  const hint = useRef(null)

  useEffect(
    () =>
      subscribe((p) => {
        const fade = sceneConfig.textFade
        const last = scrollSections.length - 1

        for (let i = 0; i < scrollSections.length; i++) {
          const el = items.current[i]
          if (!el) continue

          const s = scrollSections[i]
          const local = rangeProgress(p, s.range[0], s.range[1])
          // 첫 섹션은 들어오는 페이드 없이, 마지막 섹션은 나가는 페이드 없이 — 양 끝이 비지 않게
          const fadeIn = i === 0 ? 1 : local / fade
          const fadeOut = i === last ? 1 : (1 - local) / fade
          const o = clamp(Math.min(fadeIn, fadeOut), 0, 1)

          el.style.opacity = o
          el.style.transform = `translate3d(0, ${(local < 0.5 ? 1 : -1) * (1 - o) * 22}px, 0)`
          // 투명한 섹션이 CTA 클릭을 가로채지 않도록
          el.style.pointerEvents = o > 0.9 ? 'auto' : 'none'
        }

        if (hint.current) hint.current.style.opacity = clamp(1 - p * 22, 0, 1)
      }),
    [subscribe],
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {scrollSections.map((s, i) => (
        <div
          key={s.id}
          ref={(el) => {
            items.current[i] = el
          }}
          className={`absolute inset-0 flex will-change-[opacity,transform] ${placement[s.align] ?? placement.left}`}
          style={{ opacity: 0, pointerEvents: 'none' }}
        >
          <div className={`container-page flex flex-col ${alignment[s.align] ?? alignment.left}`}>
            <p className="eyebrow-on-dark">{s.eyebrow}</p>

            <h2 className="mt-5 max-w-2xl text-[2rem] leading-[1.2] font-bold tracking-tight text-white sm:text-[2.75rem] lg:text-[3.25rem]">
              {s.title.map((line, li) => (
                <span key={line} className="block">
                  {li === s.title.length - 1 ? <span className="text-accent-400">{line}</span> : line}
                </span>
              ))}
            </h2>

            <p className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-brand-100/80 sm:text-base">{s.body}</p>

            {s.actions && (
              <div className="mt-9 flex flex-wrap items-center gap-3">
                {s.actions.map((a) => (
                  <Button key={a.href} href={a.href} variant={a.variant} size="lg">
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* 스크롤 유도 — 첫 화면에서만 보인다 */}
      <div
        ref={hint}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-brand-100/60"
      >
        <span className="font-mono text-[0.625rem] tracking-[0.3em] uppercase">Scroll</span>
        <span className="h-9 w-px animate-pulse bg-gradient-to-b from-accent-400/80 to-transparent" />
      </div>
    </div>
  )
}
