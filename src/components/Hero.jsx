import { Link } from 'react-router'
import { Button } from './ui'
import { handleAnchorClick } from '../lib/anchorScroll'

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-ink-900">
      <img
        src="/media/hero-forklift.jpg"
        alt="창고 랙 사이를 자율주행 중인 AMR 지게차"
        className="absolute inset-0 size-full object-cover object-[62%_center]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/92 to-ink-950/25 sm:to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/50" aria-hidden="true" />

      <div className="container-page relative py-24 sm:py-32 lg:py-40">
        <div className="max-w-2xl">
          <p className="eyebrow-on-dark">AIKOREA · ROBOTICS &amp; AUTOMATION</p>

          <h1 className="mt-5 text-[2rem] leading-[1.2] font-bold tracking-tight text-white sm:text-[2.75rem] lg:text-[3.25rem]">
          산업의 움직임에 <br></br> <span className="text-accent-400">로봇의 가능성</span>을 더합니다.
          </h1>
           

          <div className="mt-6 max-w-xl space-y-3 text-[0.9375rem] leading-relaxed text-brand-100/80 sm:text-base">
            <p>
              AIKOREA는 산업 설비와 자동화 시스템을 개발해 온 경험을 바탕으로, 물류와 제조 현장에 필요한 로봇
              기술을 개발하고 있습니다.
            </p>
            <p>
              현재는 AMR 지게차 자율주행과 3D 비전 기반 팔레타이징을 주요 과제로 진행하며, 시뮬레이션을 활용해 로봇의 주행과 작업 성능을 검증하고 있습니다.
            </p>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button as={Link} to="/jobs" variant="onDark" size="lg">
              하는 일 보기
            </Button>
            <Button href="#what-we-do" onClick={handleAnchorClick} variant="outlineDark" size="lg">
              더 알아보기
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
