import { useEffect, useRef } from 'react'
import { sceneConfig } from '../../data/scrollScene'
import { mixHex } from '../../lib/color'
import { clamp, rangeProgress } from '../../lib/math'
import Icon from '../Icon'
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
  left: 'items-end pb-24 sm:pb-28 md:items-center md:pt-16 md:pb-0',
  right: 'items-end pb-24 sm:pb-28 md:items-center md:pt-16 md:pb-0',
  center: 'items-end pb-24 sm:pb-28',
}

export default function SceneOverlay({ subscribe, sections, showSectionActions = false }) {
  const items = useRef([])
  /**
   * 마지막 섹션은 아웃트로에서 배경이 흰색으로 바뀌므로 글자색을 함께 뒤집는다.
   * 클래스 교체가 아니라 색을 보간한다 — 임계값에서 툭 바뀌면 전환 도중에 티가 난다.
   */
  const outroEls = useRef({ eyebrow: null, title: [], body: null, cta: null })

  useEffect(
    () =>
      subscribe((p) => {
        const fade = sceneConfig.textFade
        const last = sections.length - 1

        for (let i = 0; i < sections.length; i++) {
          const el = items.current[i]
          if (!el) continue

          const s = sections[i]
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

        // 아웃트로 색 반전
        const o = sceneConfig.outro
        const t = clamp((p - o.from) / (o.to - o.from), 0, 1)
        const els = outroEls.current
        if (els.eyebrow) els.eyebrow.style.color = mixHex(o.eyebrow[0], o.eyebrow[1], t)
        els.title.forEach((el, i) => {
          if (!el) return
          const ramp = i === els.title.length - 1 ? o.accent : o.title
          el.style.color = mixHex(ramp[0], ramp[1], t)
        })
        if (els.body) els.body.style.color = mixHex(o.body[0], o.body[1], t)
        if (els.cta) {
          const c = mixHex(o.cta[0], o.cta[1], t)
          els.cta.style.color = c
          els.cta.style.borderColor = c
        }
      }),
    [subscribe, sections],
  )

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {sections.map((s, i) => (
        <div
          key={s.id}
          ref={(el) => {
            items.current[i] = el
          }}
          className={`absolute inset-0 flex will-change-[opacity,transform] ${placement[s.align] ?? placement.left}`}
          style={{ opacity: 0, pointerEvents: 'none' }}
        >
          <div className={`container-page flex flex-col ${alignment[s.align] ?? alignment.left}`}>
            <p
              className="eyebrow-on-dark"
              ref={(el) => {
                if (s.actions) outroEls.current.eyebrow = el
              }}
            >
              {s.eyebrow}
            </p>

            <h2 className="mt-5 max-w-2xl text-[2rem] leading-[1.2] font-bold tracking-tight text-white sm:text-[2.75rem] lg:text-[3.25rem]">
              {s.title.map((line, li) => (
                <span
                  key={line}
                  className={`block ${li === s.title.length - 1 ? 'text-accent-400' : ''}`}
                  ref={(el) => {
                    if (s.actions) outroEls.current.title[li] = el
                  }}
                >
                  {line}
                </span>
              ))}
            </h2>

            <p
              className="mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-brand-100/80 sm:text-base"
              ref={(el) => {
                if (s.actions) outroEls.current.body = el
              }}
            >
              {s.body}
            </p>

            {/* 마지막 섹션의 주 CTA — 변형과 무관하게 항상 노출 */}
            {s.actions && (
              <div className="mt-9 flex flex-wrap items-center gap-3">
                {s.actions.map((a) =>
                  a.outroTinted ? (
                    /*
                     * 아웃트로에서 색이 뒤집히는 보조 CTA.
                     * Button 대신 색 클래스가 없는 요소를 직접 쓴다 — 색을 클래스로 주면
                     * 인라인으로 덮는 싸움이 되고, 그 싸움은 이길 이유가 없다.
                     * 모양(크기·모서리·테두리 두께)만 클래스로, 색은 전부 인라인으로 준다.
                     */
                    <a
                      key={a.href}
                      href={a.href}
                      ref={(el) => {
                        outroEls.current.cta = el
                      }}
                      style={{ color: sceneConfig.outro.cta[0], borderColor: sceneConfig.outro.cta[0] }}
                      className="inline-flex h-12 items-center justify-center rounded-lg border px-6 text-[0.9375rem] font-semibold"
                    >
                      {a.label}
                    </a>
                  ) : (
                    <Button key={a.href} href={a.href} variant={a.variant} size="lg">
                      {a.label}
                    </Button>
                  ),
                )}
              </div>
            )}

            {/* 섹션별 보조 링크 — 서사 중간에도 빠져나갈 지점을 준다 */}
            {showSectionActions && !s.actions && s.action && (
              <a
                href={s.action.href}
                className="group mt-8 inline-flex items-center gap-2.5 text-sm font-semibold text-white"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-500/15 ring-1 ring-accent-400/40 transition-colors group-hover:bg-accent-500/30">
                  <Icon name="arrowRight" className="size-4 text-accent-400" strokeWidth={2} />
                </span>
                {s.action.label}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
