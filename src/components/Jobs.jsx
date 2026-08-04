import { Link } from 'react-router'
import { hiringProcess, jobs } from '../data/jobs'
import Icon from './Icon'
import { ArrowLink, Badge, Meta, Section, SectionHead, Tag } from './ui'

const STACK_LIMIT = 3

function JobCard({ job }) {
  const stack = job.stack.slice(0, STACK_LIMIT)
  const rest = job.stack.length - stack.length

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-900/8 bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-500/25 hover:shadow-card-lg">
      {/* hover 시 상단에서 펼쳐지는 강조선 */}
      <span
        className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-brand-600 to-accent-400 transition-transform duration-300 group-hover:scale-x-100"
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors duration-200 group-hover:bg-brand-600 group-hover:text-white">
            <Icon name={job.icon} className="size-5.5" />
          </span>
          <Badge>{job.type}</Badge>
        </div>

        <p className="mt-4 text-[0.6875rem] font-bold text-brand-600">{job.team}</p>
        <h3 className="mt-1 text-[0.9375rem] leading-snug font-bold tracking-tight text-ink-900 transition-colors duration-200 group-hover:text-brand-600 sm:text-base">
          <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0">
            {job.title}
          </Link>
        </h3>
        <p className="mt-0.5 text-xs text-ink-900/45">{job.subtitle}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-1 pt-4">
          <Meta icon="briefcase">{job.experience}</Meta>
          <Meta icon="pin">{job.location}</Meta>
        </div>
      </div>

      {/* 스택은 지원자가 가장 먼저 확인하는 정보라 카드에 남긴다 */}
      <div className="flex items-center gap-3 border-t border-ink-900/8 bg-page/70 px-5 py-3.5">
        <div className="flex flex-1 flex-wrap gap-1.5">
          {stack.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {rest > 0 && (
            <span className="inline-flex items-center px-1 py-1 font-mono text-[0.6875rem] leading-none text-ink-900/35">
              +{rest}
            </span>
          )}
        </div>
        <Icon
          name="arrowRight"
          className="size-4 shrink-0 text-ink-900/25 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-600"
          strokeWidth={2}
        />
      </div>
    </article>
  )
}

export default function Jobs() {
  return (
    <Section id="positions" tone="white">
      <SectionHead
        eyebrow="Open Positions"
        title="AIKOREA와 함께 성장할 동료를 기다립니다"
        description="AIKOREA는 사업 확장과 함께 다양한 직무의 인재를 채용하고 있습니다. 모든 자격 요건을 충족하지 않더라도, 보유한 경험과 역량이 모집 직무와 연결된다면 적극적으로 지원해 주세요."
        action={
          <ArrowLink as={Link} to="/jobs">
            전체 공고 보기
          </ArrowLink>
        }
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* 채용 절차 */}
      <div className="mt-12 rounded-2xl border border-ink-900/8 bg-white p-6 shadow-card sm:p-8">
        <h3 className="text-base font-bold text-ink-900">채용 절차</h3>
        <ol className="mt-7 grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {hiringProcess.map((s, i) => (
            <li key={s.step}>
              <div className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 font-mono text-[0.6875rem] font-bold text-white ring-4 ring-brand-50">
                  {i + 1}
                </span>
                {i < hiringProcess.length - 1 && (
                  <span
                    className="hidden h-px flex-1 bg-gradient-to-r from-brand-200 to-brand-100 lg:block"
                    aria-hidden="true"
                  />
                )}
              </div>
              <h4 className="mt-4 text-sm font-bold text-ink-900">{s.step}</h4>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-900/60">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
