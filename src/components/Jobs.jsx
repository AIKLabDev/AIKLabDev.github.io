import { Link } from 'react-router'
import { hiringProcess, jobs } from '../data/jobs'
import Icon from './Icon'
import { ArrowLink, Badge, Meta, Section, SectionHead } from './ui'

function JobCard({ job }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-ink-900/8 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-card-lg">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
          <Icon name={job.icon} className="size-6" />
        </span>
        <Badge>{job.type}</Badge>
      </div>

      <p className="mt-5 text-xs font-semibold text-brand-600">{job.team}</p>
      <h3 className="mt-1.5 text-[1.0625rem] leading-snug font-bold text-ink-900">
        <Link to={`/jobs/${job.id}`} className="hover:text-brand-600">
          {job.title}
        </Link>
      </h3>
      <p className="mt-1 text-xs font-medium text-ink-900/45">{job.subtitle}</p>
      <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-900/60">{job.summary[0]}</p>

      <ul className="mt-5 space-y-2 border-t border-ink-900/8 pt-5">
        {job.responsibilities.slice(0, 3).map((r) => (
          <li key={r} className="flex gap-2 text-[0.8125rem] leading-relaxed text-ink-900/70">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-brand-400" aria-hidden="true" />
            <span>{r}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Meta icon="briefcase">{job.experience}</Meta>
          <Meta icon="pin">{job.location}</Meta>
        </div>
        <Link
          to={`/jobs/${job.id}`}
          className="mt-4 flex items-center justify-between border-t border-ink-900/8 pt-4 text-sm font-semibold text-brand-600"
        >
          상세 보기
          <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
      </div>
    </article>
  )
}

export default function Jobs() {
  return (
    <Section id="positions" tone="white">
      <SectionHead
        eyebrow="Open Positions"
        title="로봇이 실제 현장에서 움직이도록 함께 만들 동료를 찾습니다"
        description="현재 에이아이코리아는 로봇 자동화 사업을 확대하고 있습니다. 공고의 모든 조건과 정확히 일치하지 않더라도, 지금까지 해온 경험이 우리가 해결하려는 문제와 연결된다면 지원해 주세요."
        action={<ArrowLink href="#contact">지원 문의하기</ArrowLink>}
      />

      <div className="mt-12 grid gap-6 lg:mt-14 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* 채용 절차 */}
      <div className="mt-14 rounded-2xl border border-ink-900/8 bg-white p-6 shadow-card sm:p-8">
        <h3 className="text-base font-bold text-ink-900">채용 절차</h3>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {hiringProcess.map((s, i) => (
            <li key={s.step} className="relative">
              <div className="flex items-center gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 font-mono text-[0.6875rem] font-bold text-white">
                  {i + 1}
                </span>
                <h4 className="text-sm font-bold text-ink-900">{s.step}</h4>
              </div>
              <p className="mt-2.5 pl-8.5 text-[0.8125rem] leading-relaxed text-ink-900/60">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
