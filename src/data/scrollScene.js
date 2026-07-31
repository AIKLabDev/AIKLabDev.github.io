/**
 * 스크롤 연동 3D 히어로의 정본 데이터.
 *
 * 여기만 고치면 장면이 바뀐다 — 컴포넌트는 이 데이터를 해석만 한다.
 *  - 실제 glTF 모델 교체:  scrollModel.path 를 '/models/xxx.glb' 로
 *  - 애니메이션 타이밍:    scrollModel.animation
 *  - 섹션 개수·문구·카메라: scrollSections (5~8개 권장)
 */

/* ------------------------------------------------------------------ */
/* 모델                                                                */
/* ------------------------------------------------------------------ */

export const scrollModel = {
  /**
   * null 이면 절차적 placeholder(PlaceholderModel)로 프로토타이핑한다.
   * .glb 를 public/models/ 에 넣고 경로만 채우면 SceneModel 로 전환된다.
   * 예) path: '/models/forklift.glb'
   */
  path: null,

  /**
   * Draco 디코더 경로. public/draco/ 에 three 배포본을 복사해 두었으므로
   * 외부 CDN 없이 동작한다. (meshopt 디코더는 drei 에 번들돼 별도 설정 불필요)
   * true 로 두면 drei 기본값인 gstatic CDN 을 쓴다.
   */
  draco: '/draco/',
  meshopt: true,

  /** 배치 — 모델마다 원점·스케일이 다르므로 교체 시 여기서 맞춘다. */
  scale: 1,
  position: [0, 0, 0],
  rotation: [0, 0, 0],

  animation: {
    /** 재생할 클립 이름. null 이면 glTF 의 첫 번째 클립. */
    clip: null,

    /**
     * 'scrub'    — 스크롤 진행률 0~1 을 range 초 구간에 선형 매핑 (기본)
     * 'segments' — 섹션별로 다른 시간 구간을 재생 (segments 사용)
     */
    mode: 'scrub',

    /** scrub 모드에서 쓸 [시작초, 끝초]. */
    range: [0, 4],

    /**
     * segments 모드에서 쓸 섹션별 구간.
     * scrollSections 와 같은 순서·같은 길이여야 한다. (모자라면 마지막 값 유지)
     */
    segments: [
      [0.0, 0.5],
      [0.5, 1.2],
      [1.2, 1.8],
      [1.8, 2.4],
      [2.4, 3.0],
      [3.0, 3.4],
      [3.4, 3.8],
      [3.8, 4.0],
    ],
  },
}

/* ------------------------------------------------------------------ */
/* 장면 튜닝                                                            */
/* ------------------------------------------------------------------ */

export const sceneConfig = {
  /**
   * 섹션 하나가 차지하는 스크롤 높이(svh).
   * 100 이면 한 섹션당 정확히 한 화면. 낮출수록 전체 히어로가 짧아진다.
   */
  vhPerSection: 90,

  /** 카메라 추종 감쇠 계수 — 클수록 즉각적, 작을수록 부드럽다. */
  cameraDamping: 6,

  /** 포인터 패럴랙스 강도(0이면 끔). */
  parallax: 0.18,

  /** 섹션 텍스트가 페이드 인/아웃하는 구간 비율(0~0.5). */
  textFade: 0.28,
}

/* ------------------------------------------------------------------ */
/* 섹션                                                                */
/* ------------------------------------------------------------------ */

/**
 * range: 이 섹션의 텍스트가 살아 있는 전체 진행률(0~1) 구간.
 *        구간들은 순서대로 이어져야 하고, 각 구간의 중앙이 카메라 키프레임 위치가 된다.
 * camera: 그 키프레임에서의 카메라 상태. 키프레임 사이는 smoothstep 보간된다.
 */
export const scrollSections = [
  {
    id: 'intro',
    eyebrow: 'AIKOREA · ROBOTICS & AUTOMATION',
    title: ['산업 현장의 움직임을', '로봇으로 바꿉니다'],
    body: '에이아이코리아는 산업 설비와 자동화 시스템을 개발해 온 경험을 바탕으로, 물류와 제조 현장에 필요한 로봇 기술을 개발합니다.',
    align: 'left',
    range: [0.0, 0.125],
    camera: { position: [2.6, 2.1, 8.6], target: [0, 0.95, 0], fov: 42 },
  },
  {
    id: 'autonomy',
    eyebrow: '01 · AUTONOMOUS DRIVING',
    title: ['지게차가 스스로', '창고를 다닙니다'],
    body: '후륜 조향 산업 차량의 경로 계획과 주행 제어, LiDAR·카메라·IMU·엔코더를 융합한 위치 추정으로 작업자 조작 없이 이동합니다.',
    align: 'left',
    range: [0.125, 0.25],
    camera: { position: [-5.6, 1.3, 4.8], target: [0, 0.75, 0], fov: 40 },
  },
  {
    id: 'perception',
    eyebrow: '02 · PERCEPTION & DOCKING',
    title: ['팔레트를 찾아', '정확히 파고듭니다'],
    body: '3D 비전으로 팔레트의 위치와 자세를 인식하고, 포크 승강 제어를 자율주행과 연동해 센티미터 단위로 도킹합니다.',
    align: 'left',
    range: [0.25, 0.375],
    camera: { position: [-2.5, 0.85, 4.4], target: [0.1, 0.7, 0.8], fov: 34 },
  },
  {
    id: 'manipulation',
    eyebrow: '03 · MANIPULATION',
    title: ['화물을 인식하고', '쌓아 올립니다'],
    body: '4축·6축 산업용 로봇의 모션 계획과 제어, 로봇–카메라 좌표계 정합, 혼합 팔레타이징의 적재 순서와 배치를 판단합니다.',
    align: 'right',
    range: [0.375, 0.5],
    camera: { position: [5.4, 3.6, 5.2], target: [0, 1.5, 0], fov: 42 },
  },
  {
    id: 'simulation',
    eyebrow: '04 · DIGITAL TWIN',
    title: ['현장에 나가기 전에', '가상 환경에서 검증합니다'],
    body: 'NVIDIA Isaac Sim 위에 창고와 설비를 3D로 재현하고, 센서 모델과 제어 응답까지 맞춘 뒤 실물로 이관합니다.',
    align: 'right',
    range: [0.5, 0.625],
    camera: { position: [8.2, 6.2, -2.6], target: [0, 1.1, 0], fov: 44 },
  },
  {
    id: 'fleet',
    eyebrow: '05 · FLEET CONTROL',
    title: ['여러 대가 동시에 움직이는', '현장을 관제합니다'],
    body: '로봇의 위치와 상태를 실시간으로 확인하고, 미션을 생성해 배차하며, 다수 로봇의 교통과 작업 순서를 조율합니다.',
    align: 'center',
    range: [0.625, 0.75],
    camera: { position: [0.5, 10.6, 1.5], target: [0, 0.3, 0], fov: 50 },
  },
  {
    id: 'team',
    eyebrow: '06 · HOW WE WORK',
    title: ['기술을 나누지 않고', '문제를 기준으로 연결합니다'],
    body: '기계 설계, 전장, 로봇 소프트웨어, 인공지능 비전과 관제를 서로 분리된 기술로 보지 않습니다. 현장의 문제에서 출발해 하나의 자동화 시스템으로 완성합니다.',
    align: 'left',
    range: [0.75, 0.875],
    camera: { position: [-6.2, 3.2, -6.8], target: [0, 1.2, 0], fov: 40 },
  },
  {
    id: 'join',
    eyebrow: 'JOIN US',
    title: ['이 문제를 함께 풀', '동료를 찾습니다'],
    body: '시뮬레이션에서 검증하고 현장에서 움직이는 일. 로보틱스 엔지니어를 기다립니다.',
    align: 'center',
    range: [0.875, 1.0],
    camera: { position: [0, 2.0, 10.6], target: [0, 1.1, 0], fov: 44 },
    /** 마지막 섹션에만 CTA 를 붙인다. */
    actions: [
      { label: '채용 공고 보기', href: '#positions', variant: 'onDark' },
      { label: '회사 알아보기', href: '#about', variant: 'outlineDark' },
    ],
  },
]
