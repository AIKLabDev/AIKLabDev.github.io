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
        title="설계부터 현장 검증까지 연결합니다"
        description="로봇 개발은 소프트웨어만으로 완성되지 않습니다. 기계 구조와 센서 배치, 제어 장치, 시뮬레이션, 자율주행과 현장 운영이 함께 맞아야 실제 장비가 안정적으로 움직입니다. 에이아이코리아는 다음 과정을 반복하며 로봇 시스템을 개발합니다."
      />

      <ol className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-5">
        {pipeline.map((p, i) => (
          <li
            key={p.step}
            className="relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm"
          >
            {/* 단계 연결선 (데스크톱) */}
            {i < pipeline.length - 1 && (
              <span
                className="absolute top-9 -right-4 hidden h-px w-4 bg-gradient-to-r from-accent-500/60 to-transparent lg:block"
                aria-hidden="true"
              />
            )}

            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-accent-400">{p.step}</span>
              <span className="h-px flex-1 bg-white/12" aria-hidden="true" />
            </div>

            <h3 className="mt-3.5 text-[0.9375rem] font-bold text-white">{p.title}</h3>
            <div className="mt-2.5 flex-1 space-y-2 text-[0.8125rem] leading-relaxed text-brand-100/65">
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
