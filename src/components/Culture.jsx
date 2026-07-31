import { benefits, benefitsNote, coreValues, workExperiences } from '../data/culture'
import Icon from './Icon'
import { Section, SectionHead } from './ui'

/**
 * 세 블록(인재상 / 직무 경험 / 복리후생)은 모두 같은 골격을 쓴다.
 * 왼쪽 좁은 칼럼에 제목, 세로 구분선 오른쪽 넓은 칼럼에 내용.
 */
function Block({ title, children }) {
  return (
    <div className="rounded-2xl border border-ink-900/6 bg-white p-5 shadow-card sm:p-6 lg:px-7 lg:py-7">
      <div className="grid gap-4 lg:grid-cols-12 lg:items-start lg:gap-7">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold tracking-tight text-ink-900 sm:text-xl">{title}</h3>
        </div>

        <div className="lg:col-span-10 lg:border-l lg:border-ink-900/8 lg:pl-7">{children}</div>
      </div>
    </div>
  )
}

/**
 * 인재상 카드 색 — 하늘 / 주황 / 파랑.
 * 가운데 난색을 끼워 양옆 두 파랑이 서로 붙어 보이지 않게 한다.
 * 세 장의 틴트 농도는 맞춰 뒀다 — 한 장만 옅으면 비어 보인다.
 */
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
        eyebrow="Careers at AIKOREA"
        title="함께 성장하며 새로운 가능성을 만들어갑니다."
      />

      <div className="mt-7 space-y-4 lg:mt-8">
        {/* 인재상 */}
        <Block title="인재상">
          <div className="grid gap-3 sm:grid-cols-3">
            {coreValues.map((value, index) => {
              const tone = valueTones[index % valueTones.length]
              return (
                <article
                  key={value.key}
                  className={`rounded-xl px-4 pt-3.5 pb-4 text-center ${tone.card}`}
                >
                  <span className={`block text-left font-mono text-[0.6875rem] font-bold ${tone.num}`}>
                    {step(index)}
                  </span>

                  <span
                    className={`mx-auto mt-1 grid size-11 place-items-center rounded-full ${tone.badge}`}
                  >
                    <Icon name={value.icon} className="size-5.5" strokeWidth={1.5} />
                  </span>

                  <h4 className="mt-2.5 text-base font-bold tracking-tight text-ink-900">
                    {value.key}
                  </h4>
                  <p className="mt-1 text-[0.8125rem] font-semibold text-ink-900/75">
                    {value.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-900/55">{value.body}</p>
                </article>
              )
            })}
          </div>
        </Block>

        {/* 직무 경험 — 번호 + 그라데이션 밑줄 */}
        <Block title="직무 경험">
          <div className="grid gap-6 sm:grid-cols-3">
            {workExperiences.map((experience, index) => (
              <div key={experience.title}>
                <span className="font-mono text-xl font-bold tracking-tight text-brand-600">
                  {step(index)}
                </span>
                <span
                  className="mt-2.5 block h-0.5 rounded-full bg-gradient-to-r from-brand-500 via-brand-400/50 to-brand-300/25"
                  aria-hidden="true"
                />
                <h4 className="mt-4 text-[0.9375rem] font-bold text-ink-900">{experience.title}</h4>
                <p className="mt-2.5 text-xs leading-relaxed text-ink-900/55">{experience.body}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* 복리후생 — 세로 구분선으로 나눈 아이콘 열 */}
        <Block title="복리후생">
          {/* 3 → 6열. 줄 맨 앞 항목만 세로 구분선을 뺀다. */}
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
