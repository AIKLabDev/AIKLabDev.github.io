import { pipeline } from '../data/pipeline'
import { Section, SectionHead } from './ui'

export default function Pipeline() {
  return (
    <Section id="how-we-work" tone="dark" className="relative isolate overflow-hidden">
      {/* 은은한 배경 글로우 */}
      <div
        className="absolute -top-40 left-1/2 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl"
        aria-hidden="true"
      />

      <SectionHead
        dark
        eyebrow="How We Work"
        title="현장의 요구를 제품으로 구현합니다"
        description="AIKOREA는 현장의 요구를 바탕으로 아이디어를 구체화하고, 반복적인 검증과 개선을 통해 제품의 완성도를 높입니다."
      />

      <ol className="mt-10 grid gap-0 md:gap-4 md:grid-cols-2 lg:mt-14 xl:grid-cols-5">
        {pipeline.map((p, i) => {
          const isLast = i === pipeline.length - 1
          return (
            <li
              key={p.step}
              className={`relative flex gap-4 md:flex-col md:gap-0 md:rounded-2xl md:border md:border-white/10 md:bg-white/[0.04] md:p-6 md:backdrop-blur-sm ${
                isLast ? 'md:col-span-2 xl:col-span-1' : ''
              }`}
            >
              <div className="flex flex-col items-center md:hidden" aria-hidden="true">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-accent-400/35 bg-accent-400/10 font-mono text-[0.6875rem] font-bold text-accent-400">
                  {p.step}
                </span>
                {!isLast && (
                  <span className="mt-1.5 w-px flex-1 bg-gradient-to-b from-white/18 to-white/5" />
                )}
              </div>

              <div className="hidden items-center gap-3 md:flex">
                <span className="font-mono text-sm font-bold text-accent-400">{p.step}</span>
                <span className="h-px flex-1 bg-white/12" aria-hidden="true" />
              </div>

              <div className={`flex flex-col md:flex-1 ${isLast ? '' : 'pb-7 md:pb-0'}`}>
                <h3 className="mt-1.5 text-[0.9375rem] leading-snug font-bold text-balance text-white md:mt-4 xl:min-h-[2.6rem]">
                  {p.title}
                </h3>
                <div className="mt-2 space-y-2 text-[0.8125rem] leading-relaxed text-pretty text-brand-100/65 md:mt-2.5 md:flex-1">
                  {p.body.map((para) => (
                    <p key={para}>{para}</p>
                  ))}
                </div>
              </div>

              {!isLast && (
                <span
                  className="absolute top-[2.375rem] -right-4 hidden h-px w-4 bg-gradient-to-r from-accent-500/60 to-transparent xl:block"
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </Section>
  )
}
