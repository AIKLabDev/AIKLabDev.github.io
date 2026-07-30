/**
 * 얇은 라인 아이콘 세트. 외부 아이콘 라이브러리를 쓰지 않고
 * currentColor 기반 stroke 아이콘으로 통일했다.
 */

const paths = {
  // 지게차 — AMR 지게차 자율주행
  forklift: (
    <>
      <path d="M3 17.5h.5M20.5 17.5H21" />
      <circle cx="7" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
      <path d="M4.5 15V9.5A1.5 1.5 0 0 1 6 8h4.5l2 4.5V15" />
      <path d="M14 15V4.5M14 4.5h2.5M17.5 15V6" />
      <path d="M17.5 11.5h4" />
    </>
  ),
  // 로봇 팔 — 매니퓰레이션 / 팔레타이징
  arm: (
    <>
      <path d="M3 20.5h8" />
      <path d="M7 20.5v-3.5" />
      <circle cx="7" cy="15" r="2" />
      <path d="M8.4 13.6 13 9" />
      <circle cx="14.5" cy="7.5" r="2" />
      <path d="M16 6.1 19.5 3.5" />
      <rect x="14" y="14" width="7" height="6.5" rx="1" />
      <path d="M17.5 14v-2.5" />
    </>
  ),
  // 디지털 트윈 — 실물/가상 한 쌍
  twin: (
    <>
      <rect x="2.5" y="6" width="8.5" height="12" rx="1.5" />
      <rect x="13" y="6" width="8.5" height="12" rx="1.5" strokeDasharray="2.5 2" />
      <path d="M6 12.5h2M6 15h1.5" />
      <path d="M16.5 12.5h2M16.5 15h1.5" />
      <path d="M11.2 9.5h1.6M11.2 14.5h1.6" />
    </>
  ),
  // 플릿 관제 — 여러 대 + 신호
  fleet: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8.5 21h7M12 17v4" />
      <circle cx="8" cy="10.5" r="1.6" />
      <circle cx="15.5" cy="8.5" r="1.6" />
      <path d="M9.6 10.5h4.3M14.3 9.9 9.6 13" />
      <path d="M6 7h2" />
    </>
  ),
  // 시뮬레이션 / 큐브
  cube: (
    <>
      <path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7z" />
      <path d="M3.5 7 12 11.4 20.5 7M12 11.4v9.8" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2.8 14 9l6.2 2-6.2 2-2 6.2-2-6.2L3.8 11 10 9z" />
      <path d="M18.5 3.5v3M17 5h3" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.2 21 8l-9 4.8L3 8z" />
      <path d="M3 12.5 12 17.3l9-4.8" />
      <path d="M3 16.8 12 21.6l9-4.8" />
    </>
  ),
  lab: (
    <>
      <path d="M9 3h6M10.5 3v5.2L5.6 17A2.6 2.6 0 0 0 7.9 21h8.2a2.6 2.6 0 0 0 2.3-4l-4.9-8.8V3" />
      <path d="M7.6 14h8.8" />
    </>
  ),
  growth: (
    <>
      <path d="M3 20h18" />
      <path d="M6.5 20v-5M11 20V9.5M15.5 20v-7.5M20 20V5" />
    </>
  ),
  // 협업 — 서로 다른 담당자가 문제를 함께 해결
  team: (
    <>
      <circle cx="8.5" cy="9" r="3.2" />
      <circle cx="16.5" cy="10.4" r="2.6" />
      <path d="M3 20.5c.4-3.6 2.6-5.6 5.5-5.6s5.1 2 5.5 5.6" />
      <path d="M15 15.3c2.3.3 3.8 1.9 4.1 3.8" />
    </>
  ),
  // 실행력 — 목표를 정확히 맞춤
  target: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  // 첨단 기술 — 원자 궤도
  atom: (
    <>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" />
    </>
  ),
  // 소통 — 대화 말풍선
  chat: (
    <>
      <path d="M4 5.5h16v11H9.5L5.5 20v-3.5H4z" />
      <path d="M8 9.5h8M8 13h5" />
    </>
  ),
  // 고객 가치 — 통찰/아이디어
  bulb: (
    <>
      <path d="M9.3 21h5.4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9V17h5v-1.2c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 3z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.5s7-6.1 7-11.1a7 7 0 1 0-14 0c0 5 7 11.1 7 11.1z" />
      <circle cx="12" cy="10.2" r="2.6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2.8" y="7.2" width="18.4" height="12.5" rx="2" />
      <path d="M8.6 7.2V5.6A1.8 1.8 0 0 1 10.4 3.8h3.2a1.8 1.8 0 0 1 1.8 1.8v1.6" />
      <path d="M2.8 12.4h18.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.4l3.4 2" />
    </>
  ),
  arrowRight: <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8.5 7H17v8.5" />,
  play: <path d="M8 5.5v13l11-6.5z" strokeLinejoin="round" />,
  check: <path d="M4.5 12.8 9 17.2 19.5 6.8" />,
  mail: (
    <>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2" />
      <path d="M3.5 7 12 13l8.5-6" />
    </>
  ),
  phone: (
    <path d="M6.2 3.5h3l1.6 4-2 1.4a11.5 11.5 0 0 0 5.3 5.3l1.4-2 4 1.6v3a1.7 1.7 0 0 1-1.9 1.7A16.5 16.5 0 0 1 4.5 5.4 1.7 1.7 0 0 1 6.2 3.5z" />
  ),
  menu: <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
}

export default function Icon({ name, className = 'size-6', strokeWidth = 1.6, ...rest }) {
  const d = paths[name]
  if (!d) return null
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {d}
    </svg>
  )
}
