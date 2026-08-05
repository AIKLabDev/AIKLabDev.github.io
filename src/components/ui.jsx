import { Children, useRef, useState } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import Icon from './Icon'

export function SnapRail({
  gridClass,
  gapClass = 'md:gap-5',
  itemWidth = 'w-[80vw]',
  label,
  dark = false,
  className = '',
  children,
}) {
  const items = Children.toArray(children)
  const railRef = useRef(null)
  const [active, setActive] = useState(0)
  const isRail = useMediaQuery('(max-width: 767px)')

  const onScroll = () => {
    const el = railRef.current
    if (!el || el.children.length < 2) return
    const step = el.children[1].offsetLeft - el.children[0].offsetLeft
    if (step <= 0) return
    const i = Math.round(el.scrollLeft / step)
    setActive(Math.max(0, Math.min(items.length - 1, i)))
  }

  return (
    <div className={className}>
      <div
        ref={railRef}
        onScroll={isRail ? onScroll : undefined}
        className={`no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-1 md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0 ${gapClass} ${gridClass}`}
        {...(isRail ? { role: 'group', 'aria-label': label, tabIndex: 0 } : {})}
      >
        {items.map((child, i) => (
          <div key={i} className={`${itemWidth} shrink-0 snap-start md:w-auto md:shrink`}>
            {child}
          </div>
        ))}
      </div>

      {isRail && (
        <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === active
                  ? `w-5 ${dark ? 'bg-accent-400' : 'bg-brand-600'}`
                  : `w-1.5 ${dark ? 'bg-white/25' : 'bg-ink-900/20'}`
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** 섹션 래퍼 — 밝은/어두운 두 가지 톤 */
export function Section({ id, tone = 'light', className = '', children }) {
  const tones = {
    light: 'bg-page',
    white: 'bg-white',
    dark: 'bg-ink-900 text-white',
  }
  return (
    <section id={id} className={`${tones[tone]} py-16 sm:py-24 ${className}`}>
      <div className="container-page">{children}</div>
    </section>
  )
}

/** 제목만 있는 섹션에서는 md로 한 단계 낮춰 쓴다. */
const headSizes = {
  lg: 'mt-3 text-2xl sm:text-3xl lg:text-[2.125rem]',
  md: 'mt-2.5 text-xl sm:text-2xl lg:text-[1.625rem]',
}

/** 섹션 머리말 — eyebrow / 제목 / 설명 + 우측 액션 */
export function SectionHead({
  eyebrow,
  title,
  description,
  action,
  size = 'lg',
  dark = false,
  className = '',
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-8 gap-y-4 ${className}`}>
      <div className="max-w-2xl">
        {eyebrow && <p className={dark ? 'eyebrow-on-dark' : 'eyebrow'}>{eyebrow}</p>}
        <h2
          className={`font-bold tracking-tight ${headSizes[size]} ${
            dark ? 'text-white' : 'text-ink-900'
          }`}
        >
          {title}
        </h2>
        {description && (
          <p className={`mt-4 text-[0.9375rem] leading-relaxed sm:text-base ${dark ? 'text-brand-100/70' : 'text-ink-900/60'}`}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors duration-150 disabled:opacity-50'

const buttonVariants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  onDark: 'bg-white text-ink-900 hover:bg-brand-50',
  outline: 'border border-ink-900/15 bg-white text-ink-900 hover:border-brand-500/50 hover:text-brand-600',
  outlineDark: 'border border-white/25 text-white hover:border-white/60 hover:bg-white/10',
  ghost: 'text-brand-600 hover:text-brand-700',
}

const buttonSizes = {
  sm: 'h-9 px-3.5',
  md: 'h-11 px-5',
  lg: 'h-12 px-6 text-[0.9375rem]',
}

export function Button({ as = 'a', variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const Tag = as
  return (
    <Tag className={`${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

/** 텍스트 + 화살표 링크 (섹션 우측 상단 "더 보기" 류) */
export function ArrowLink({ as = 'a', children, dark = false, className = '', ...rest }) {
  const Tag = as
  return (
    <Tag
      className={`group inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
        dark ? 'text-accent-400 hover:text-white' : 'text-brand-600 hover:text-brand-700'
      } ${className}`}
      {...rest}
    >
      {children}
      <Icon
        name="arrowRight"
        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
        strokeWidth={2}
      />
    </Tag>
  )
}

/** 기술 태그 칩 */
export function Tag({ children, dark = false }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 font-mono text-[0.6875rem] leading-none tracking-tight ${
        dark ? 'bg-white/10 text-brand-100' : 'bg-brand-50 text-brand-700'
      }`}
    >
      {children}
    </span>
  )
}

/** 분류 배지 (고용 형태 / 주력 표시 등) */
export function Badge({ children, variant = 'brand' }) {
  const variants = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-500/20',
    accent: 'bg-accent-500/10 text-accent-600 ring-accent-500/25',
    onDark: 'bg-white/10 text-white ring-white/20',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold whitespace-nowrap ring-1 ring-inset ${variants[variant]}`}
    >
      {children}
    </span>
  )
}

/** 메타 정보 한 줄 (아이콘 + 텍스트) */
export function Meta({ icon, children, dark = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${dark ? 'text-brand-100/70' : 'text-ink-900/55'}`}>
      <Icon name={icon} className="size-3.5 shrink-0" strokeWidth={1.7} />
      {children}
    </span>
  )
}
