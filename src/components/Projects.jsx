import { projects } from '../data/projects'
import { MediaRaw } from './Media'
import { ArrowLink, Section, SectionHead, SnapRail, Tag } from './ui'

function ProjectCard({ project }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-900/8 bg-white shadow-card transition-shadow duration-200 hover:shadow-card-lg">
      <div className="aspect-video overflow-hidden bg-ink-900">
        <MediaRaw item={project.media} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[0.9375rem] leading-snug font-bold text-ink-900">{project.title}</h3>
        <p className="mt-2.5 whitespace-pre-line text-[0.8125rem] leading-relaxed text-ink-900/70 md:text-justify">
          {project.body}
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
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
        title="AIKOREA의 주요 프로젝트"
        description="로봇 기술의 가능성을 넓혀 온 AIKOREA의 주요 프로젝트를 만나보세요."
        action={<ArrowLink href="#positions">관련 포지션 보기</ArrowLink>}
      />
      <SnapRail
        className="mt-12 lg:mt-14"
        gridClass="md:grid-cols-2 lg:grid-cols-3"
        label="주요 프로젝트 목록"
      >
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </SnapRail>
    </Section>
  )
}
