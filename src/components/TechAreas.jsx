import { useMediaQuery } from '../hooks/useMediaQuery'
import { techAreas } from '../data/techAreas'
import Icon from './Icon'
import { Badge, Section, SectionHead } from './ui'

function PointList({ points, className = '' }) {
  return (
    <ul className={`grid gap-2 border-t border-ink-900/8 ${className}`}>
      {points.map((p) => (
        <li key={p} className="flex gap-1.5 text-xs leading-relaxed text-ink-900/70">
          <Icon name="check" className="mt-0.5 size-3 shrink-0 text-brand-500" strokeWidth={2.4} />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  )
}

function AreaCard({ area }) {
  return (
    <article className="flex flex-col rounded-2xl border border-ink-900/8 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-card-lg">
      <div className="flex flex-1 flex-col pb-5">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${
              area.primary ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
            }`}
          >
            <Icon name={area.icon} className="size-5.5" />
          </span>
          {area.primary && <Badge variant="accent">주력</Badge>}
        </div>

        <span className="mt-4 font-mono text-[0.6875rem] font-bold tracking-wider text-brand-500/75">
          {area.no}
        </span>
        <h3 className="mt-1 text-[0.9375rem] leading-snug font-bold tracking-tight text-balance text-ink-900">
          {area.title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-ink-900/60">{area.summary}</p>
      </div>

      <PointList points={area.points} className="pt-4" />
    </article>
  )
}

function AreaAccordion({ area, defaultOpen }) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl ${
            area.primary ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
          }`}
        >
          <Icon name={area.icon} className="size-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-mono text-[0.625rem] font-bold tracking-wider text-brand-500/75">
              {area.no}
            </span>
            {area.primary && <Badge variant="accent">주력</Badge>}
          </span>
          <span className="mt-0.5 block text-sm leading-snug font-bold tracking-tight text-ink-900">
            {area.title}
          </span>
        </span>

        <Icon
          name="chevronDown"
          className="size-4 shrink-0 text-ink-900/30 transition-transform duration-200 group-open:rotate-180"
          strokeWidth={2}
        />
      </summary>

      <div className="px-4 pb-4">
        <p className="text-xs leading-relaxed text-ink-900/60">{area.summary}</p>
        <PointList points={area.points} className="mt-3 pt-3" />
      </div>
    </details>
  )
}

export default function TechAreas() {
  const isCompact = useMediaQuery('(max-width: 767px)')

  return (
    <Section id="what-we-do" tone="white">
      <SectionHead
        eyebrow="What We Do"
        title="산업 현장을 위한 로봇 기술을 개발합니다"
        description="AIKOREA는 자율주행 로봇과 팔레타이징 시스템을 중심으로, 현장 운영에 필요한 기능을 개발합니다. 기술을 유기적으로 연결해 로봇의 이동과 작업부터 현장 운영까지 하나의 시스템으로 구현합니다."
      />

      {isCompact ? (
        <div className="mt-10 divide-y divide-ink-900/8 overflow-hidden rounded-2xl border border-ink-900/8 bg-white shadow-card">
          {techAreas.map((area, i) => (
            <AreaAccordion key={area.no} area={area} defaultOpen={i === 0} />
          ))}
        </div>
      ) : (
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:mt-14 xl:grid-cols-4">
          {techAreas.map((area) => (
            <AreaCard key={area.no} area={area} />
          ))}
        </div>
      )}
    </Section>
  )
}
