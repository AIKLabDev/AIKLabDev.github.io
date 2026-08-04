import { useEffect } from 'react'
import { Link } from 'react-router'
import Icon from '../components/Icon'
import { jobs } from '../data/jobs'

/** 데이터에 등장하는 순서대로 팀별로 묶는다. */
const groups = [...new Set(jobs.map((j) => j.team))].map((team) => ({
  team,
  items: jobs.filter((j) => j.team === team),
}))

/** 제목의 ::after 로 행 전체를 덮어(stretched link) 어디를 눌러도 상세로 간다. */
function JobRow({ job }) {
  return (
    <li className="group relative border-b border-ink-900/8">
      <div className="flex flex-col gap-1.5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-5">
        <div className="min-w-0">
          <h3 className="text-[0.9375rem] leading-snug font-bold text-ink-900 transition-colors duration-150 group-hover:text-brand-600 sm:text-base">
            <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0">
              {job.title}
            </Link>
          </h3>
          <p className="mt-1 text-[0.8125rem] text-ink-900/45">{job.subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <p className="text-[0.8125rem] text-ink-900/55">
            {job.employment} · {job.experience} · {job.location}
          </p>
          <Icon
            name="arrowRight"
            className="size-4 shrink-0 text-ink-900/25 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-brand-600"
            strokeWidth={2}
          />
        </div>
      </div>
    </li>
  )
}

export default function JobList() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <div className="border-b border-ink-900/8 bg-white">
        <div className="container-page py-8 sm:py-10">
          <nav className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-900/55" aria-label="현재 위치">
            <Link to="/" className="hover:text-brand-600">
              채용 홈
            </Link>
            <span className="text-ink-900/25" aria-hidden="true">
              /
            </span>
            <span className="text-ink-900/80">채용 공고</span>
          </nav>

          <h1 className="mt-4 text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
            채용 공고 <span className="font-mono text-base text-brand-600 sm:text-lg">{jobs.length}</span>
          </h1>
          <p className="mt-2 max-w-2xl text-[0.8125rem] leading-relaxed text-ink-900/55 sm:text-sm">
            모든 자격 요건을 충족하지 않더라도, 보유한 경험과 역량이 모집 직무와 연결된다면 적극적으로 지원해
            주세요.
          </p>
        </div>
      </div>

      <div className="container-page py-10 sm:py-12">
        {groups.map((g) => (
          <section key={g.team} className="mt-10 first:mt-0">
            <h2 className="border-b border-ink-900/12 pb-3 text-xs font-bold tracking-[0.08em] text-brand-600">
              {g.team}
            </h2>
            <ul>
              {g.items.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
