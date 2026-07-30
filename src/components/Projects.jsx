import { projects } from '../data/projects'
import { MediaRaw } from './Media'
import { ArrowLink, Section, SectionHead, Tag } from './ui'

/**
 * 캡션은 화면에 띄우지 않고 MediaRaw 안에서 alt/aria 텍스트로만 쓴다.
 */
function ProjectCard({ project }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ink-900/8 bg-white shadow-card transition-shadow duration-200 hover:shadow-card-lg">
      <div className="aspect-video overflow-hidden bg-ink-900">
        <MediaRaw item={project.media} />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-[1.0625rem] leading-snug font-bold text-ink-900">{project.title}</h3>
        <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-ink-900/70">{project.lead}</p>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-900/55">{project.detail}</p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {project.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function Projects() {
  return (
    <Section id="projects">
      <SectionHead
        eyebrow="Our Projects"
        title="지금 개발하고 있는 것들"
        description="에이아이코리아 로봇 연구개발 조직에서 현재 진행하고 있는 주요 프로젝트입니다."
        action={<ArrowLink href="#positions">관련 포지션 보기</ArrowLink>}
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-14">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </Section>
  )
}
