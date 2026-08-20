export const scrollModel = {
  path: '/models/forklift.glb',
  draco: '/draco/',
  scale: 1,
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
    background: ['#0a1a30', '#ffffff'],
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
    background: '#0a1a30',
    fog: { color: '#0a1a30', near: 34, far: 124, lift: [110, 260] },

    ambient: 0.62,
    hemisphere: { sky: '#cfdeff', ground: '#0a1a30', intensity: 0.85 },

    key: {
      position: [5.5, 8, 4],
      intensity: 2.8,
      shadowMapSize: 1024,
      shadowRadius: 8,
      shadowNear: 1,
      shadowFar: 26,
      shadowBias: -0.0004,
    },

    fill: { position: [0, 3, 9], intensity: 0.85, color: '#dbe7ff' },

    rims: [
      { position: [-6, 2.5, -4], intensity: 1.8, color: '#38bdf8' },
      { position: [3, 1.2, -6], intensity: 1.1, color: '#2f63ea' },
    ],

    environment: {
      resolution: 256,
      compactResolution: 128,
      background: '#12294a',
      lightformers: [
        { form: 'rect', intensity: 2.2, color: '#dbe7ff', scale: [14, 8, 1], position: [0, 8, 2], rotation: [-Math.PI / 2, 0, 0] },
        { form: 'circle', intensity: 1.8, color: '#38bdf8', scale: 7, position: [-8, 3, 3] },
        { form: 'rect', intensity: 1.5, color: '#2f63ea', scale: [10, 5, 1], position: [7, 2, -5], rotation: [0, -Math.PI / 3, 0] },
        { form: 'rect', intensity: 0.7, color: '#1d4785', scale: [14, 14, 1], position: [0, -3, 0], rotation: [Math.PI / 2, 0, 0] },
      ],
    },

    grid: {
      cellSize: 0.6,
      cellThickness: 0.5,
      cellColor: '#16376b',
      sectionSize: 3,
      sectionThickness: 1,
      sectionColor: '#27528f',
      fadeDistance: 84,
      compactFadeDistance: 54,
      fadeStrength: 1.6,
    },

    contactShadows: { opacity: 0.45, scale: 16, blur: 2.4, far: 6, resolution: 512 },
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

export const scrollSections = [
  {
    id: 'intro',
    stage: 'journey',
    beat: 'opening',
    eyebrow: 'AIKOREA ROBOTICS LAB',
    title: ['산업 현장의 새로운 자동화를 개발합니다'],
    body: 'AIKOREA는 생산설비와 공정을 구축해온 경험을 바탕으로, AMR과 로봇 기술로 산업 현장의 자동화를 실현합니다.',
    align: 'left',
    vh: 95,
    camera: { position: [2.19, 2.32, 5.54], target: [-1.52, 0.95, 0.25], fov: 34 },
    action: { label: '더 알아보기', href: '#what-we-do' },
  },
  {
    id: 'perception',
    stage: 'journey',
    beat: 'mapping',
    eyebrow: 'SLAM · LOCALIZATION',
    title: ['주변 환경을 인식하고 현재 위치를 파악합니다'],
    body: '주변 환경을 실시간으로 인식하고 지도와 위치를 끊임없이 갱신하며, 흔들림 없는 자율주행의 기반을 만듭니다.',
    align: 'right',
    vh: 95,
    camera: { position: [-17.3, 20.4, 0], target: [2.5, 0.6, 0], fov: 46 },
  },
  {
    id: 'planning',
    stage: 'journey',
    beat: 'routing',
    eyebrow: 'AUTONOMOUS NAVIGATION',
    title: ['정해진 길이 아니라 지금 갈 수 있는 길을 찾습니다'],
    body: '현재 위치와 주변 상황을 바탕으로 경로를 계획하고, 변화가 생기면 즉시 새로운 길을 찾아 주행을 이어갑니다.',
    align: 'left',
    vh: 100,
    camera: { position: [-11.4, 12.9, 0], target: [3.5, 0.4, 0], fov: 44 },
    action: { label: '하는 일 보기', href: '#what-we-do' },
  },
  {
    id: 'handling',
    stage: 'journey',
    beat: 'docking',
    eyebrow: '3D VISION · ROBOT CONTROL',
    title: ['보고, 판단하고, 정확히 움직입니다'],
    body: '3D 비전으로 대상의 위치와 형태, 상태를 인식해 정밀한 작업으로 연결합니다.',
    align: 'right',
    vh: 105,
    camera: { position: [-13, 9, 15], target: [8, 1.6, 0.5], fov: 44 },
  },
  {
    id: 'fleet',
    stage: 'journey',
    beat: 'fleet',
    eyebrow: 'AMR · VISION · PALLETIZING',
    title: ['로봇의 이동에서', '공정의 자동화까지'],
    body: 'AIKOREA 기술 연구소는 AMR과 팔레타이징을 중심으로 자율주행, 3D 비전, 로봇 제어 기술을 연구합니다. 로봇이 움직이고 인식하고 작업하는 전 과정을 실제 제조·물류 현장에서 쓸 수 있는 자동화 시스템으로 완성합니다.',
    align: 'center',
    vh: 95,
    camera: { position: [26, 45.5, 39], target: [26, 0.5, 10.5], fov: 58, frame: [0, 0.185] },
    action: { label: 'Projects', href: '#projects' },
  },
  {
    id: 'join',
    stage: 'journey',
    beat: 'join',
    eyebrow: 'JOIN AIKOREA R&D',
    title: ['현장의 문제를 함께 풀어나갈 엔지니어를 찾습니다'],
    body: '자율주행, 비전, 로봇 제어 기술로 새로운 자동화를 함께 만들어갈 엔지니어를 찾습니다.',
    align: 'center',
    camera: { position: [26, 49.8, 42.4], target: [26, 0.5, 10.5], fov: 58 },
    actions: [
      { label: '하는 일 보기', href: '/jobs', variant: 'primary' },
      { label: '더 알아보기', href: '#what-we-do', variant: 'outlineDark', outroTinted: true },
    ],
  },
]
