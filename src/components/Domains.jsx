import { domains } from '../data/domains'
import Icon from './Icon'
import { Badge, Section, SectionHead } from './ui'

export default function Domains() {
  return (
    <Section id="what-we-do">
      <SectionHead
        eyebrow="What We Do"
        title="실제 산업 현장에 필요한 로봇 기술을 개발합니다"
        description="현재 로봇 연구개발 조직은 자율주행, 로봇 매니퓰레이션, 시뮬레이션과 관제 시스템을 함께 개발하고 있습니다. 각 분야는 별개로 끝나지 않습니다. 로봇의 인식과 판단, 이동과 작업, 현장 운영까지 하나의 흐름으로 연결됩니다."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
        {domains.map((d) => (
          <article
            key={d.title}
            className={`group relative flex flex-col rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg ${
              d.primary
                ? 'border-brand-500/25 bg-gradient-to-b from-brand-50/70 to-white shadow-card'
                : 'border-ink-900/8 bg-white shadow-card'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                  d.primary ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
                }`}
              >
                <Icon name={d.icon} className="size-6" />
              </span>
              {d.primary && <Badge variant="accent">주력</Badge>}
            </div>

            <span className="mt-5 font-mono text-xs font-bold text-brand-500">{d.no}</span>
            <h3 className="mt-1 text-base font-bold text-ink-900">{d.title}</h3>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-900/60">{d.summary}</p>

            <ul className="mt-5 space-y-2.5 border-t border-ink-900/8 pt-5">
              {d.points.map((p) => (
                <li key={p} className="flex gap-2 text-[0.8125rem] leading-relaxed text-ink-900/70">
                  <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-brand-500" strokeWidth={2.2} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  )
}
