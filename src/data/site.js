export const site = {
  name: 'AIKOREA',
  legalName: '(주)에이아이코리아',
  // TODO: 실제 채용 담당 연락처로 교체
  email: 'recruit@aikorea.co.kr',
  phone: '031-000-0000',
}

/**
 * 헤더·바닥글 공용 내비게이션.
 * 공고 상세(/jobs/:id)에서도 눌러야 하므로 루트 기준 해시(`/#id`)로 둔다.
 * 홈에서는 같은 경로이므로 리로드 없이 스크롤만 이동한다.
 */
export const nav = [
  { label: '회사 소개', href: '/#about' },
  { label: '하는 일', href: '/#what-we-do' },
  { label: '일하는 방식', href: '/#how-we-work' },
  { label: '프로젝트', href: '/#projects' },
  { label: '채용 공고', href: '/#positions' },
  { label: '팀 문화', href: '/#culture' },
]
