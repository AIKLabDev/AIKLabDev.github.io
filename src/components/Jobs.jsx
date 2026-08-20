import { Link } from 'react-router'
import { hiringProcess, jobs } from '../data/jobs'
import { roles } from '../data/roles'
import Icon from './Icon'
import { ArrowLink, Section, SectionHead, SnapRail, Tag } from './ui'

function RoleCard({ role }) {
  const job = jobs.find((j) => j.team === role.team)

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-ink-900/8 bg-white shadow-card">
      <div className="flex flex-1 flex-col p-5">
        <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon name={role.icon} className="size-5.5" />
        </span>

        <p className="mt-4 text-[0.6875rem] font-bold text-brand-600">{role.team}</p>
        <h3 className="mt-1 text-[0.9375rem] leading-snug font-bold tracking-tight text-ink-900 transition-colors duration-200 group-hover:text-brand-600 sm:text-base">
          <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0">
            {role.headline}
          </Link>
        </h3>
        <p className="mt-0.5 text-xs text-ink-900/45">{role.focus}</p>

        <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-900/60">{job.summary[0]}</p>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-ink-900/8 bg-page/70 px-5 py-3.5">
        {role.keywords.map((k) => (
          <Tag key={k}>{k}</Tag>
        ))}
      </div>
    </article>
  )
}

export default function Jobs() {
  return (
    <Section id="positions" tone="white">
      <SectionHead
        eyebrow="What We Do"
        title="AIKOREA RND가 만드는 산업 자동화"
        description="자율주행부터 로봇 시뮬레이션과 매니퓰레이션까지, AIKOREA RND는 실제 산업 현장에서 필요한 기술을 연구하고 개발합니다. 각각의 기술을 현장에 연결해 자동화의 완성도를 높여갑니다."
        action={<ArrowLink as={Link} to="/jobs">하는 일 보기</ArrowLink>}
      />

      <SnapRail
        className="mt-10 lg:mt-12"
        gridClass="md:grid-cols-2 lg:grid-cols-3"
        label="AIKOREA가 하는 일 소개"
      >
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}
      </SnapRail>

      <div className="mt-12 rounded-2xl border border-ink-900/8 bg-white p-6 shadow-card sm:p-8">
        <h3 className="text-base font-bold text-ink-900">합류 과정</h3>
        <ol className="mt-7 grid gap-x-6 gap-y-0 md:grid-cols-2 md:gap-y-7 lg:grid-cols-4">
          {hiringProcess.map((s, i) => {
            const isLast = i === hiringProcess.length - 1
            return (
              <li key={s.step} className="flex gap-3.5 md:block">
                <div className="flex flex-col items-center md:flex-row md:gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 font-mono text-[0.6875rem] font-bold text-white ring-4 ring-brand-50">
                    {i + 1}
                  </span>
                  {!isLast && (
                    <>
                      <span
                        className="mt-1.5 w-px flex-1 bg-gradient-to-b from-brand-200 to-brand-100 md:hidden"
                        aria-hidden="true"
                      />
                      <span
                        className="hidden h-px flex-1 bg-gradient-to-r from-brand-200 to-brand-100 lg:block"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </div>

                <div className={isLast ? '' : 'pb-6 md:pb-0'}>
                  <h4 className="mt-1 text-sm font-bold text-ink-900 md:mt-4">{s.step}</h4>
                  <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-900/60 md:mt-2">
                    {s.body}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </Section>
  )
}
