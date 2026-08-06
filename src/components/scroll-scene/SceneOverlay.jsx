import { useEffect, useRef } from 'react'
import { sceneConfig } from '../../data/scrollScene'
import { mixHex } from '../../lib/color'
import { clamp, rangeProgress } from '../../lib/math'
import Icon from '../Icon'
import { Button } from '../ui'

const alignment = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
}

const placement = {
  left: 'items-end pb-24 sm:pb-28 md:items-center md:pt-16 md:pb-0',
  right: 'items-end pb-24 sm:pb-28 md:items-center md:pt-16 md:pb-0',
  center: 'items-end pb-24 sm:pb-28',
}

export default function SceneOverlay({ subscribe, sections, showSectionActions = false }) {
  const items = useRef([])
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
          const fadeIn = i === 0 ? 1 : local / fade
          const fadeOut = i === last ? 1 : (1 - local) / fade
          const o = clamp(Math.min(fadeIn, fadeOut), 0, 1)

          el.style.opacity = o
          el.style.transform = `translate3d(0, ${(local < 0.5 ? 1 : -1) * (1 - o) * 22}px, 0)`
          el.style.pointerEvents = o > 0.9 ? 'auto' : 'none'
        }

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

            {s.actions && (
              <div className="mt-9 flex flex-wrap items-center gap-3">
                {s.actions.map((a) =>
                  a.outroTinted ? (
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
