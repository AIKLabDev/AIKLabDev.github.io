import { nav, site } from '../data/site'
import Icon from './Icon'

const legal = ['개인정보처리방침', '이용약관', '이메일무단수집거부']

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-white">
      <div className="container-page py-12 sm:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div>
            <img
              src="/brand/aikorea-logo.png"
              alt={`${site.name} 로고`}
              className="h-7 w-auto brightness-0 invert"
            />
            <div className="mt-5 flex flex-col gap-2">
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 text-[0.8125rem] text-brand-100/70 hover:text-white"
              >
                <Icon name="mail" className="size-4" strokeWidth={1.7} />
                {site.email}
              </a>
              <span className="inline-flex items-center gap-2 text-[0.8125rem] text-brand-100/70">
                <Icon name="phone" className="size-4" strokeWidth={1.7} />
                {site.phone}
              </span>
            </div>
          </div>

          <nav
            className="grid grid-cols-2 content-start gap-x-10 gap-y-2.5 sm:grid-cols-3 lg:gap-x-14"
            aria-label="바닥글 탐색"
          >
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="text-[0.8125rem] text-brand-100/70 hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex flex-col-reverse gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-brand-100/45">
            © {new Date().getFullYear()} {site.legalName} All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map((l) => (
              <li key={l}>
                <a href="#" className="text-xs text-brand-100/55 hover:text-white">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
