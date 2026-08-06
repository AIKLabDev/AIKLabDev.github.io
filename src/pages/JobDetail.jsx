import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import Icon from '../components/Icon'
import { ArrowLink, Badge, Button, Meta, Tag } from '../components/ui'
import { hiringProcess, jobs } from '../data/jobs'
import { site } from '../data/site'

function Requirements({ title, items, accent = false }) {
  return (
    <div>
      <h2 className="text-base font-bold text-ink-900">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-900/75">
            <Icon
              name="check"
              className={`mt-1 size-4 shrink-0 ${accent ? 'text-accent-500' : 'text-brand-500'}`}
              strokeWidth={2.2}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function JobDetail() {
  const { jobId } = useParams()
  const job = jobs.find((j) => j.id === jobId)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [jobId])

  if (!job) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-xl font-bold text-ink-900">요청하신 채용 공고를 찾을 수 없습니다.</h1>
        <p className="mt-3 text-sm text-ink-900/60">공고가 마감됐거나 주소가 변경되었을 수 있습니다.</p>
        <Button as={Link} to="/" className="mt-8">
          채용 홈으로 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="border-b border-ink-900/8 bg-white">
        <div className="container-page py-10 sm:py-14">
          <nav className="flex items-center gap-2 text-sm font-medium text-ink-900/55" aria-label="현재 위치">
            <Link to="/" className="hover:text-brand-600">
              채용 홈
            </Link>
            <span className="text-ink-900/25" aria-hidden="true">
              /
            </span>
            <Link to="/jobs" className="hover:text-brand-600">
              채용 공고
            </Link>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge>{job.type}</Badge>
            <span className="text-xs font-semibold text-brand-600">{job.team}</span>
          </div>

          <h1 className="mt-4 max-w-3xl text-2xl leading-snug font-bold tracking-tight text-ink-900 sm:text-[2rem]">
            {job.title}
          </h1>
          <p className="mt-2 text-sm font-medium text-ink-900/50">{job.subtitle}</p>
          <div className="mt-5 max-w-2xl space-y-2.5">
            {job.summary.map((p) => (
              <p key={p} className="text-[0.9375rem] leading-relaxed text-ink-900/65">
                {p}
              </p>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <Meta icon="briefcase">
              {job.employment} · {job.experience}
            </Meta>
            <Meta icon="pin">{job.location}</Meta>
            <Meta icon="clock">{job.deadline}</Meta>
          </div>
        </div>
      </div>

      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="space-y-10">
            <Requirements title="담당 업무" items={job.responsibilities} />
            <Requirements title="자격 요건" items={job.requirements} />
            <Requirements title="우대 사항" items={job.preferred} accent />

            <div>
              <h2 className="text-base font-bold text-ink-900">채용 절차</h2>
              <ol className="mt-4 space-y-4">
                {hiringProcess.map((s, i) => (
                  <li key={s.step} className="flex gap-3.5">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 font-mono text-[0.6875rem] font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-[0.9375rem] font-bold text-ink-900">{s.step}</h3>
                      <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-900/60">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-ink-900/8 bg-white p-6 shadow-card">
              <h2 className="text-sm font-bold text-ink-900">지원하기</h2>
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-900/60">
                이력서와 포트폴리오를 채용 담당자 이메일로 보내주세요.
              </p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-900/60">
                메일 제목에 지원하는 포지션을 적어주시면 확인에 도움이 됩니다.
              </p>
              <Button
                href={`mailto:${site.email}?subject=${encodeURIComponent(`[지원] ${job.title}`)}`}
                className="mt-5 w-full"
              >
                <Icon name="mail" className="size-4.5" strokeWidth={1.8} />
                이 포지션에 지원하기
              </Button>
              <p className="mt-3 text-center font-mono text-xs text-ink-900/45">{site.email}</p>
            </div>

            <div className="mt-5 rounded-2xl border border-ink-900/8 bg-white p-6 shadow-card">
              <h2 className="text-sm font-bold text-ink-900">다른 포지션 보기</h2>
              <ul className="mt-4 space-y-3.5">
                {jobs
                  .filter((j) => j.id !== job.id)
                  .map((j) => (
                    <li key={j.id}>
                      <Link to={`/jobs/${j.id}`} className="group block">
                        <p className="text-[0.8125rem] font-semibold text-ink-900 group-hover:text-brand-600">
                          {j.title}
                        </p>
                        <p className="mt-1 text-xs text-ink-900/50">
                          {j.experience} · {j.location}
                        </p>
                      </Link>
                    </li>
                  ))}
              </ul>
              <ArrowLink as={Link} to="/jobs" className="mt-5">
                전체 공고 보기
              </ArrowLink>
            </div>
          </aside>
        </div>

        <div className="mt-14 border-t border-ink-900/8 pt-8">
          <h2 className="text-sm font-bold text-ink-900">이 포지션에서 사용하는 기술</h2>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.stack.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
