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

      <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-5">
        {pipeline.map((p, i) => (
          <li
            key={p.step}
            className={`relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm sm:p-6 ${
              /* 홀수 개를 2열로 놓으면 마지막 한 장이 홀로 남는다 — 태블릿에서는 폭을 채운다. */
              pipeline.length % 2 === 1 && i === pipeline.length - 1
                ? 'sm:col-span-2 lg:col-span-1'
                : ''
            }`}
          >
            {/* 단계 연결선 (데스크톱) — 카드 안 가로선과 같은 높이에서 이어진다. */}
            {i < pipeline.length - 1 && (
              <span
                className="absolute top-[2.125rem] -right-4 hidden h-px w-4 bg-gradient-to-r from-accent-500/60 to-transparent lg:block"
                aria-hidden="true"
              />
            )}

            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-accent-400">{p.step}</span>
              <span className="h-px flex-1 bg-white/12" aria-hidden="true" />
            </div>

            {/*
              5열에서는 제목이 1줄과 2줄로 갈려 본문 시작 높이가 어긋난다.
              두 줄 높이를 미리 잡아 카드끼리 본문 첫 줄을 맞춘다.
            */}
            <h3 className="mt-4 text-[0.9375rem] leading-snug font-bold text-balance text-white lg:min-h-[2.6rem]">
              {p.title}
            </h3>
            <div className="mt-2.5 flex-1 space-y-2 text-[0.8125rem] leading-relaxed text-pretty text-brand-100/65">
              {p.body.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
