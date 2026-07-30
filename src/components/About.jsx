import { company } from '../data/company'
import { Section, SectionHead } from './ui'

function Fact({ label, value }) {
  return (
    <div className="border-t border-ink-900/8 py-4 first:border-t-0 first:pt-0">
      <dt className="text-xs font-semibold text-ink-900/45">{label}</dt>
      <dd className="mt-1.5 text-[0.9375rem] leading-snug font-bold text-ink-900">{value}</dd>
    </div>
  )
}

export default function About() {
  return (
    <Section id="about" tone="white">
      <SectionHead eyebrow="About AIKOREA" title={company.headline} />

      <div className="mt-12 grid gap-10 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <div className="space-y-5">
          {company.intro.map((p) => (
            <p key={p} className="text-[0.9375rem] leading-relaxed text-ink-900/70 sm:text-base">
              {p}
            </p>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-ink-900/8 bg-page p-6 lg:sticky lg:top-28">
          <h3 className="pb-4 text-sm font-bold text-ink-900">{company.factsHeading}</h3>
          <dl>
            {company.facts.map((f) => (
              <Fact key={f.label} {...f} />
            ))}
          </dl>
        </div>
      </div>
    </Section>
  )
}
