import { benefits, benefitsHeading, benefitsNote, coreValues, cultureReasons, idealTalent } from '../data/culture'
import Icon from './Icon'
import { Section, SectionHead } from './ui'

export default function Culture() {
  return (
    <Section id="culture">
      <SectionHead
        eyebrow="Working at AIKOREA"
        title="로봇이 실제로 움직이는 곳에서 일합니다"
        description="복지 제도에 앞서, 이곳에서 어떤 문제를 어떤 환경에서 해결하게 되는지 소개합니다."
      />

      {/* 인재상 */}
      <div className="mt-12 lg:mt-14">
        <h3 className="text-sm font-bold text-ink-900">인재상</h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {coreValues.map((v) => (
            <div key={v.key} className="rounded-2xl border border-ink-900/8 bg-white p-5 shadow-card">
              <span className="font-mono text-xs font-bold tracking-wide text-brand-600 uppercase">{v.key}</span>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-900/65">{v.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {idealTalent.map((t) => (
            <div key={t.title} className="flex gap-4 rounded-2xl border border-ink-900/8 bg-white p-5 shadow-card">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon name={t.icon} className="size-5" />
              </span>
              <div>
                <h4 className="text-[0.8125rem] font-bold text-ink-900">{t.title}</h4>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-900/60">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 여기서 일하는 이유 */}
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cultureReasons.map((r) => (
          <article key={r.title} className="rounded-2xl border border-ink-900/8 bg-white p-6 shadow-card">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon name={r.icon} className="size-6" />
            </span>
            <h3 className="mt-5 text-[0.9375rem] font-bold text-ink-900">{r.title}</h3>
            <div className="mt-2.5 space-y-2 text-[0.8125rem] leading-relaxed text-ink-900/60">
              {r.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* 복리후생 */}
      <div className="mt-6 rounded-2xl bg-gradient-to-br from-ink-900 to-ink-800 p-6 sm:p-8">
        <h3 className="text-sm font-bold text-white">{benefitsHeading}</h3>
        <dl className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="border-l border-white/15 pl-4">
              <dt className="text-[0.8125rem] font-bold text-white">{b.title}</dt>
              <dd className="mt-2 space-y-1">
                {b.items.map((item) => (
                  <p key={item} className="text-xs leading-relaxed text-brand-100/60">
                    · {item}
                  </p>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-brand-100/45">
          ※ {benefitsNote}
        </p>
      </div>
    </Section>
  )
}
