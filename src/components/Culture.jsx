import { benefits, benefitsNote, coreValues, workExperiences } from '../data/culture'
import Icon from './Icon'
import { Section, SectionHead, SnapRail } from './ui'

function Block({ title, children }) {
  return (
    <div className="rounded-2xl border border-ink-900/6 bg-white p-5 shadow-card sm:p-6 lg:px-7 lg:py-7">
      <div className="grid gap-4 lg:grid-cols-12 lg:items-start lg:gap-7">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold tracking-tight text-ink-900 sm:text-xl">{title}</h3>
        </div>

        <div className="min-w-0 lg:col-span-10 lg:border-l lg:border-ink-900/8 lg:pl-7">
          {children}
        </div>
      </div>
    </div>
  )
}

const valueTones = [
  { card: 'bg-[#e2f4fd]', badge: 'bg-[#c6e8f8] text-[#0e7fb4]', num: 'text-[#3aa8db]' },
  { card: 'bg-[#faf1ea]', badge: 'bg-[#f6e1d1] text-[#ca5823]', num: 'text-[#d98a64]' },
  { card: 'bg-[#ecf1fc]', badge: 'bg-[#d9e4f9] text-[#26529d]', num: 'text-[#7597eb]' },
]

const step = (index) => String(index + 1).padStart(2, '0')

export default function Culture() {
  return (
    <Section id="culture">
      <SectionHead
        size="md"
        eyebrow="RND at AIKOREA"
        title="함께 성장하며 새로운 가능성을 만들어갑니다."
      />

      <div className="mt-7 space-y-4 lg:mt-8">
        <Block title="인재상">
          <SnapRail
            gridClass="lg:grid-cols-3"
            gapClass="md:gap-3"
            itemWidth="w-[70vw]"
            label="인재상 세 가지"
          >
            {coreValues.map((value, index) => {
              const tone = valueTones[index % valueTones.length]
              return (
                <article
                  key={value.key}
                  className={`flex h-full flex-wrap items-start gap-x-3.5 rounded-xl p-4 lg:block lg:px-4 lg:pt-3.5 lg:pb-4 lg:text-center ${tone.card}`}
                >
                  <span
                    className={`w-full text-left font-mono text-[0.6875rem] font-bold lg:block lg:w-auto ${tone.num}`}
                  >
                    {step(index)}
                  </span>

                  <span
                    className={`mt-2 grid size-11 shrink-0 place-items-center rounded-full lg:mx-auto lg:mt-1 ${tone.badge}`}
                  >
                    <Icon name={value.icon} className="size-5.5" strokeWidth={1.5} />
                  </span>

                  <div className="mt-2 min-w-0 flex-1 lg:contents">
                    <h4 className="text-base font-bold tracking-tight text-ink-900 lg:mt-2.5">
                      {value.key}
                    </h4>
                    <p className="mt-0.5 text-[0.8125rem] font-semibold text-ink-900/75 lg:mt-1">
                      {value.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-900/55 lg:mt-1.5">
                      {value.body}
                    </p>
                  </div>
                </article>
              )
            })}
          </SnapRail>
        </Block>

        <Block title="직무 경험">
          <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
            {workExperiences.map((experience, index) => (
              <div key={experience.title} className="flex gap-3 lg:block">
                <span className="font-mono text-xl font-bold tracking-tight text-brand-600">
                  {step(index)}
                </span>
                <span
                  className="mt-2.5 hidden h-0.5 rounded-full bg-gradient-to-r from-brand-500 via-brand-400/50 to-brand-300/25 lg:block"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1 lg:contents">
                  <h4 className="text-[0.9375rem] font-bold text-ink-900 lg:mt-4">
                    {experience.title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-900/55 lg:mt-2.5">
                    {experience.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="복리후생">
          <div className="grid grid-cols-3 gap-y-6 lg:grid-cols-6">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className={`border-ink-900/8 px-1.5 text-center ${
                  index % 3 === 0 ? 'border-l-0' : 'border-l'
                } ${index % 6 === 0 ? 'lg:border-l-0' : 'lg:border-l'}`}
              >
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Icon name={benefit.icon} className="size-5" strokeWidth={1.5} />
                </span>

                <h4 className="mt-2.5 text-[0.8125rem] font-bold text-ink-900">{benefit.title}</h4>
              </div>
            ))}
          </div>

          <p className="mt-5 border-t border-ink-900/8 pt-4 text-[0.6875rem] leading-5 text-ink-900/40">
            ※ {benefitsNote}
          </p>
        </Block>
      </div>
    </Section>
  )
}
