import { site } from '../data/site'
import Icon from './Icon'
import { Button } from './ui'

/** 하단 지원 유도(CTA) 밴드 */
export default function Contact() {
  return (
    <section id="contact" className="relative isolate overflow-hidden bg-ink-950">
      <div
        className="absolute top-1/2 left-1/2 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/25 blur-3xl"
        aria-hidden="true"
      />




      <div className="container-page py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          산업 현장의 새로운 가능성을 함께 만들어 주세요.
          </h2>
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-brand-100/70">
            AIKOREA는 더 나은 자동화 기술을 현실로 만들어나갈 인재를 기다립니다.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button href="#positions" variant="onDark" size="lg">
              채용 공고 보기
            </Button>
            <Button href={`mailto:${site.email}`} variant="outlineDark" size="lg">
              <Icon name="mail" className="size-4.5" strokeWidth={1.8} />
              지원 문의하기
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
