import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { nav, site } from '../data/site'
import { mixHex } from '../lib/color'
import { getHeroReveal, subscribeHeroReveal } from '../lib/heroChrome'
import Icon from './Icon'
import { Button } from './ui'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  /**
   * 3D 히어로 위에서는 로고만 남기고 나머지 크롬을 걷는다.
   * 마지막 전환에서 배경이 흰색이 되는 것과 같은 타이밍에 되돌아오므로,
   * "3D 를 보다가 웹페이지로 넘어왔다" 로 읽힌다. (값은 히어로가 흘려준다)
   *
   * 리렌더 대신 DOM 을 직접 만진다 — 스크롤마다 헤더 전체가 다시 그려질 이유가 없다.
   */
  const headerRef = useRef(null)
  const chromeRef = useRef(null) // 메뉴 + CTA + 햄버거
  const logoLightRef = useRef(null) // 어두운 배경용 흰 로고 레이어
  const dividerRef = useRef(null)
  /** 첫 페인트부터 맞는 상태로 그린다. effect 로 감추면 새로고침마다 메뉴가 번쩍인다. */
  const [initialReveal] = useState(getHeroReveal)
  const revealRef = useRef(initialReveal)
  /** 키보드 포커스가 헤더 안에 있으면 무조건 드러낸다 — 안 보이는 곳으로 포커스가 가면 안 된다 */
  const focusedRef = useRef(false)

  useEffect(() => {
    const apply = () => {
      const r = focusedRef.current ? 1 : revealRef.current
      const header = headerRef.current
      if (header) {
        if (r >= 1) {
          header.style.backgroundColor = ''
          header.style.boxShadow = ''
        } else {
          header.style.backgroundColor = `rgba(255, 255, 255, ${r})`
          header.style.boxShadow = 'none'
        }
      }
      if (chromeRef.current) {
        chromeRef.current.style.opacity = r
        chromeRef.current.style.pointerEvents = r > 0.6 ? '' : 'none'
      }
      if (logoLightRef.current) logoLightRef.current.style.opacity = 1 - r
      if (dividerRef.current) {
        dividerRef.current.style.color = mixHex('#dbe7ff', '#0a1628', r)
        dividerRef.current.style.borderColor = mixHex('#dbe7ff', '#0a1628', r)
      }
    }

    const unsubscribe = subscribeHeroReveal((r) => {
      revealRef.current = r
      apply()
    })

    const onFocusIn = () => {
      focusedRef.current = true
      apply()
    }
    const onFocusOut = (e) => {
      if (headerRef.current?.contains(e.relatedTarget)) return
      focusedRef.current = false
      apply()
    }
    const el = headerRef.current
    el?.addEventListener('focusin', onFocusIn)
    el?.addEventListener('focusout', onFocusOut)
    return () => {
      unsubscribe()
      el?.removeEventListener('focusin', onFocusIn)
      el?.removeEventListener('focusout', onFocusOut)
    }
  }, [])

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
      ref={headerRef}
      style={initialReveal < 1 ? { backgroundColor: `rgba(255, 255, 255, ${initialReveal})`, boxShadow: 'none' } : undefined}
      className={`sticky top-0 z-50 transition-shadow duration-200 ${
        scrolled ? 'bg-white/90 shadow-sm backdrop-blur-md' : 'bg-white'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          {/* 로고가 짙은 남색이라 어두운 3D 위에서는 읽히지 않는다.
              흰색으로 뒤집은 사본을 겹쳐 크로스페이드한다 — 별도 에셋이 필요 없다. */}
          <span className="relative block">
            <img src="/brand/aikorea-logo.png" alt={`${site.name} 로고`} className="h-7 w-auto lg:h-8" />
            <img
              ref={logoLightRef}
              src="/brand/aikorea-logo.png"
              alt=""
              aria-hidden="true"
              style={{ opacity: 1 - initialReveal }}
              className="absolute inset-0 h-7 w-auto brightness-0 invert lg:h-8"
            />
          </span>
          <span className="sr-only">{site.legalName} 채용</span>
          <span
            ref={dividerRef}
            className="hidden border-l border-ink-900/12 pl-2.5 text-xs font-semibold tracking-wide text-ink-900/45 sm:block"
          >
            CAREERS
          </span>
        </Link>

        <div
          ref={chromeRef}
          style={{ opacity: initialReveal, pointerEvents: initialReveal > 0.6 ? undefined : 'none' }}
          className="flex flex-1 items-center justify-end gap-6"
        >
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

        <div className="flex items-center gap-2">
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
