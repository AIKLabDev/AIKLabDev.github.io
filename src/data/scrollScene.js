export const scrollModel = {
  // null 이면 PlaceholderModel 로 대체된다
  path: null,

  meshopt: true,
  draco: false,

  scale: 1,
  position: [0, 0, 0],
  rotation: [0, 0, 0],

  animation: {
    // null 이면 glTF 의 첫 번째 클립
    clip: null,
    // 'scrub' | 'segments'
    mode: 'scrub',
    range: [0, 4],
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

export const sceneConfig = {
  cameraDamping: 8,
  parallax: 0.18,
  textFade: 0.28,
  skipTarget: '#what-we-do',

  loading: {
    minMs: 700,
    maxMs: 8000,
  },

  outro: {
    from: 0.87,
    to: 1,
    background: ['#05101f', '#ffffff'],
    eyebrow: ['#38bdf8', '#1b4fa8'],
    title: ['#ffffff', '#0a1628'],
    accent: ['#38bdf8', '#1b4fa8'],
    body: ['#dbe7ff', '#5b6577'],
    cta: ['#ffffff', '#0a1628'],
  },

  framing: {
    byAlign: {
      left: [0.17, 0],
      right: [-0.17, 0],
      center: [0, 0.14],
    },
    compact: [0, 0.17],

    referenceAspect: 16 / 9,
    aspectExponent: 0.5,
    maxPullBack: 2.4,
  },

  lighting: {
    background: '#05101f',
    fog: { color: '#05101f', near: 14, far: 38 },

    ambient: 0.95,
    hemisphere: { sky: '#bcd2ff', ground: '#05101f', intensity: 1.1 },

    key: {
      position: [5.5, 8, 4],
      intensity: 3.2,
      shadowMapSize: 1024,
      shadowRadius: 8,
      shadowNear: 1,
      shadowFar: 26,
      shadowBias: -0.0004,
    },

    fill: { position: [0, 3, 9], intensity: 1.1, color: '#dbe7ff' },

    rims: [
      { position: [-6, 2.5, -4], intensity: 3.1, color: '#38bdf8' },
      { position: [3, 1.2, -6], intensity: 1.9, color: '#2f63ea' },
    ],

    environment: {
      resolution: 256,
      compactResolution: 128,
      background: '#0a1628',
      lightformers: [
        { form: 'rect', intensity: 3.2, color: '#dbe7ff', scale: [14, 8, 1], position: [0, 8, 2], rotation: [-Math.PI / 2, 0, 0] },
        { form: 'circle', intensity: 2.6, color: '#38bdf8', scale: 7, position: [-8, 3, 3] },
        { form: 'rect', intensity: 2.0, color: '#2f63ea', scale: [10, 5, 1], position: [7, 2, -5], rotation: [0, -Math.PI / 3, 0] },
        { form: 'rect', intensity: 0.8, color: '#163561', scale: [14, 14, 1], position: [0, -3, 0], rotation: [Math.PI / 2, 0, 0] },
      ],
    },

    grid: {
      cellSize: 0.6,
      cellThickness: 0.6,
      cellColor: '#1d4785',
      sectionSize: 3,
      sectionThickness: 1.2,
      sectionColor: '#3f74f0',
      fadeDistance: 36,
      compactFadeDistance: 26,
      fadeStrength: 1.2,
    },

    contactShadows: { opacity: 0.6, scale: 16, blur: 2.4, far: 6, resolution: 512 },
  },

  snap: {
    duration: 1100,
    quietMs: 120,
    maxQuietMs: 500,
    touchThreshold: 40,
    continuationGapMs: 100,
    reentryMs: 900,
  },
}

export const EXPERIMENT_ID = 'hero_scroll_snap'
export const VARIANT_PARAM = 'hero'
export const VARIANT_STORAGE_KEY = 'aikorea.hero.variant'
export const DEFAULT_VARIANT = 'snap'

// 원소가 하나면 실험이 꺼지고 그 변형이 전원 기본값이 된다
export const ASSIGNED_VARIANTS = ['snap']

export const heroVariants = {
  flow: {
    label: '연속 스크롤',
    description: '브라우저 기본 스크롤. 휠을 굴린 만큼 진행률이 따라간다.',
    snap: false,
  },
  snap: {
    label: '섹션 스냅',
    description: '휠·키·스와이프 한 번에 한 섹션씩. 브라우저 기본 스크롤을 가로챈다.',
    snap: true,
  },
}

// vh 는 다음 섹션까지의 스크롤 거리(svh). 마지막 섹션의 vh 는 쓰이지 않는다.
export const scrollSections = [
  {
    id: 'intro',
    eyebrow: 'AIKOREA · ROBOTICS & AUTOMATION',
    title: ['산업 현장의 움직임을', '로봇으로 바꿉니다'],
    body: '에이아이코리아는 산업 설비와 자동화 시스템을 개발해 온 경험을 바탕으로, 물류와 제조 현장에 필요한 로봇 기술을 개발합니다.',
    align: 'left',
    vh: 100,
    camera: { position: [2.6, 2.1, 8.6], target: [0, 0.95, 0], fov: 42 },
    action: { label: '회사 알아보기', href: '#what-we-do' },
  },
  {
    id: 'autonomy',
    eyebrow: 'AUTONOMOUS DRIVING',
    title: ['지게차가 스스로 움직여', '팔레트에 정확히 닿습니다'],
    body: '후륜 조향 산업 차량의 경로 계획과 주행 제어, LiDAR·카메라·IMU·엔코더 융합 위치 추정으로 작업자 조작 없이 이동하고, 3D 비전과 포크 승강 제어를 연동해 팔레트에 센티미터 단위로 도킹합니다.',
    align: 'left',
    vh: 90,
    camera: { position: [-4.1, 1.1, 4.6], target: [0.05, 0.72, 0.4], fov: 37 },
    action: { label: '하는 일 보기', href: '#what-we-do' },
  },
  {
    id: 'manipulation',
    eyebrow: 'MANIPULATION',
    title: ['화물을 인식하고', '쌓아 올립니다'],
    body: '4축·6축 산업용 로봇의 모션 계획과 제어, 로봇–카메라 좌표계 정합, 혼합 팔레타이징의 적재 순서와 배치를 판단합니다.',
    align: 'right',
    vh: 110,
    camera: { position: [5.4, 3.6, 5.2], target: [0, 1.5, 0], fov: 42 },
    action: { label: '프로젝트 보기', href: '#projects' },
  },
  {
    id: 'simulation',
    eyebrow: 'DIGITAL TWIN',
    title: ['현장에 나가기 전에', '가상 환경에서 검증합니다'],
    body: 'NVIDIA Isaac Sim 위에 창고와 설비를 3D로 재현하고, 센서 모델과 제어 응답까지 맞춘 뒤 실물로 이관합니다.',
    align: 'right',
    vh: 85,
    camera: { position: [8.2, 6.2, -2.6], target: [0, 1.1, 0], fov: 44 },
    action: { label: '프로젝트 보기', href: '#projects' },
  },
  {
    id: 'fleet',
    eyebrow: 'FLEET CONTROL',
    title: ['여러 대가 동시에 움직이는', '현장을 관제합니다'],
    body: '로봇의 위치와 상태를 실시간으로 확인하고, 미션을 생성해 배차하며, 다수 로봇의 교통과 작업 순서를 조율합니다.',
    align: 'center',
    vh: 95,
    camera: { position: [0.5, 10.6, 1.5], target: [0, 0.3, 0], fov: 50 },
    action: { label: '프로젝트 보기', href: '#projects' },
  },
  {
    id: 'join',
    eyebrow: 'JOIN US',
    title: ['이 문제를 함께 풀', '동료를 찾습니다'],
    body: '시뮬레이션에서 검증하고 현장에서 움직이는 일. 로보틱스 엔지니어를 기다립니다.',
    align: 'center',
    camera: { position: [0, 2.0, 10.6], target: [0, 1.1, 0], fov: 44 },
    actions: [
      { label: '채용 공고 보기', href: '#positions', variant: 'primary' },
      { label: '회사 알아보기', href: '#what-we-do', variant: 'outlineDark', outroTinted: true },
    ],
  },
]
