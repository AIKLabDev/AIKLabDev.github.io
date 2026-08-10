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
    // 점 구름이 화면 끝까지 이어져야 공간이 넓게 읽힌다. 끊기는 자리가 아니라
    // 흐려지는 자리에서 끝나도록 far 를 점 구름의 사거리 너머로 민다
    fog: { color: '#0a1a30', near: 34, far: 124 },

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

    // 공간을 만드는 것은 점 구름이다. 격자는 바닥이 어디인지만 알려 주고 물러난다 —
    // 밝으면 점 구름을 눌러 버려 창고가 다시 평면 도면으로 읽힌다
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
    title: ['산업 현장을 만들어 온 경험으로', '움직이는 자동화를 만듭니다'],
    body: '생산설비와 공정을 직접 만들어 온 경험을 바탕으로, 에이아이코리아는 제조와 물류 현장에 필요한 로봇 자동화 기술을 개발하고 있습니다.',
    align: 'left',
    vh: 95,
    // 휠·포크만 프레임에 담기는 거리에서 시작해, ② 로 넘어가며 전체가 드러난다
    camera: { position: [1.75, 0.62, 1.45], target: [0.15, 0.45, 0.05], fov: 32 },
    action: { label: '회사 알아보기', href: '#what-we-do' },
  },
  {
    id: 'perception',
    stage: 'journey',
    beat: 'mapping',
    eyebrow: 'SLAM · LOCALIZATION',
    title: ['주변 환경을 인식하며', '현재 위치를 파악합니다'],
    body: '주행하는 동안 주변 환경을 계속 인식하고, 변화하는 공간 속에서 지도와 자신의 위치를 함께 갱신합니다.',
    align: 'right',
    vh: 95,
    // 센서가 그려 나가는 공간을 내려다봐야 "주변을 인식한다"로 읽힌다 (앙각 48도).
    // ③ 은 여기서 더 물러나며 열린다 — 같은 부감이되 높이가 다르다
    camera: { position: [-9.5, 14.0, 6.0], target: [2.5, 0.6, 0], fov: 46 },
    action: { label: '하는 일 보기', href: '#what-we-do' },
  },
  {
    id: 'planning',
    stage: 'journey',
    beat: 'routing',
    eyebrow: 'AUTONOMOUS NAVIGATION',
    title: ['정해진 길이 아니라', '지금 갈 수 있는 길을 찾습니다'],
    body: '현재 위치와 주변 환경을 바탕으로 주행 경로를 계산하고, 상황이 달라지면 그에 맞춰 경로와 움직임을 다시 결정합니다.',
    align: 'left',
    vh: 100,
    // ② 에서 그대로 물러나며 올라간다 (앙각 45도, 거리 26m). 같은 공간이
    // 통째로 열리고 휘어지는 경로 전체가 그 위에 펼쳐진다
    camera: { position: [-14.5, 18.5, 5.5], target: [6.5, 0.4, -0.4], fov: 44 },
    action: { label: '하는 일 보기', href: '#what-we-do' },
  },
  {
    id: 'simulation',
    stage: 'journey',
    beat: 'docking',
    eyebrow: 'MOTION · CONTROL',
    title: ['목적지에 맞춰', '정밀하게 움직임을 제어합니다'],
    body: '목적지에 도착하는 것만으로는 작업이 끝나지 않습니다. 팔레트와 정확하게 위치를 맞추고, 실제 작업으로 이어질 수 있도록 움직임을 제어합니다.',
    align: 'right',
    vh: 105,
    // 낮아지고 가까워진다. 옆에서 봐야 포크가 팔레트로 들어가는 것이 보인다
    camera: { position: [2.2, 1.25, 5.6], target: [-0.35, 0.55, 0.05], fov: 38 },
    action: { label: '프로젝트 보기', href: '#projects' },
  },
  {
    id: 'fleet',
    stage: 'journey',
    beat: 'lab',
    eyebrow: 'AMR · AI VISION · PALLETIZING',
    title: ['로봇의 이동에서', '공정의 자동화까지'],
    body: '에이아이코리아 연구소는 AMR을 비롯해 AI Vision, 로봇 제어, 팔레타이징 기술을 개발합니다. 각각의 기술을 실제 제조와 물류 현장에서 작동하는 자동화로 연결해 나가고 있습니다.',
    align: 'left',
    vh: 95,
    // 멀찍이 물러난 광각 (거리 24m, 앙각 25도). 차량 주변에 연구 영역을 놓을 자리가 생긴다
    camera: { position: [-16.5, 11.0, 7.5], target: [1.2, 1.1, -0.4], fov: 50 },
    action: { label: '프로젝트 보기', href: '#projects' },
  },
  {
    id: 'join',
    stage: 'journey',
    beat: 'join',
    eyebrow: 'JOIN AIKOREA R&D',
    title: ['실제 현장에서 작동할 답을', '함께 만들 사람을 찾습니다'],
    body: '현장을 이해하고, 스스로 판단하고, 실제로 움직이는 로봇을 만듭니다. 에이아이코리아 연구소에서 그 과정의 다음 문제를 함께 풀어갈 엔지니어를 찾습니다.',
    align: 'center',
    // ⑤ 와 거의 같은 자리다. 카메라는 남고 차량만 깊숙이 빠져나간다
    camera: { position: [-17.4, 10.4, 8.0], target: [4.6, 1.0, -0.6], fov: 52 },
    actions: [
      { label: '채용 공고 보기', href: '#positions', variant: 'primary' },
      { label: '회사 알아보기', href: '#what-we-do', variant: 'outlineDark', outroTinted: true },
    ],
  },
]
