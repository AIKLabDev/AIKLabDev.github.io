import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { nav, site } from '../data/site'
import Icon from './Icon'
import { Button } from './ui'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 모바일 메뉴가 열려 있을 때 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow duration-200 ${
        scrolled ? 'bg-white/90 shadow-sm backdrop-blur-md' : 'bg-white'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          <img src="/brand/aikorea-logo.png" alt={`${site.name} 로고`} className="h-7 w-auto lg:h-8" />
          <span className="sr-only">{site.legalName} 채용</span>
          <span className="hidden border-l border-ink-900/12 pl-2.5 text-xs font-semibold tracking-wide text-ink-900/45 sm:block">
            CAREERS
          </span>
        </Link>

        {/* 내비게이션은 CTA 바로 옆에 붙여 오른쪽 한 덩어리로 읽히게 둔다. */}
        <div className="flex items-center gap-2 lg:gap-4">
          <nav className="hidden items-center gap-1 lg:flex" aria-label="주요 섹션">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-ink-900/65 transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <Button href="/#positions" size="sm" className="hidden sm:inline-flex">
            채용 공고 보기
          </Button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-md text-ink-900 lg:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} className="size-6" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-ink-900/8 bg-white lg:hidden" aria-label="주요 섹션 (모바일)">
          <div className="container-page flex flex-col py-2">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-ink-900/5 py-3.5 text-[0.9375rem] font-medium text-ink-900/75 last:border-0"
              >
                {item.label}
              </a>
            ))}
            <Button href="/#positions" onClick={() => setMenuOpen(false)} className="my-3 sm:hidden">
              채용 공고 보기
            </Button>
          </div>
        </nav>
      )}
    </header>
  )
}
