/**
 * 스크롤 연동 3D 히어로의 정본 데이터.
 *
 * 여기만 고치면 장면이 바뀐다 — 컴포넌트는 이 데이터를 해석만 한다.
 *  - 실제 glTF 모델 교체:  scrollModel.path 를 '/models/xxx.glb' 로
 *  - 애니메이션 타이밍:    scrollModel.animation
 *  - 섹션 문구·카메라·길이: scrollSections (5~8개 권장)
 *  - A/B 변형 정의:        heroVariants
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
   * 압축 방식.
   *
   * meshopt 를 기본으로 둔다 — 디코더가 drei 에 번들돼 있어 추가 파일이 없고,
   * 실서비스에서도 meshopt 단독 배포가 일반적이다.
   * Draco 를 쓸 모델이라면 draco 에 '/draco/' 를 넣으면 된다
   * (디코더는 public/draco 에 이미 복사돼 있어 외부 CDN 없이 동작한다).
   */
  meshopt: true,
  draco: false,

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
   * 카메라 추종 감쇠 계수 — 클수록 즉각적(스크롤에 딱 붙고), 작을수록 여운이 남는다.
   * 시간상수 = 1/값 (8이면 125ms 뒤처져 따라오다가 스크롤이 멎으면 0.4초쯤 뒤 정착).
   * 너무 낮추면 이징이 이중으로 걸려 끈적해지고, 너무 높이면 카메라가 스크롤에
   * 못박힌 듯 딱딱해진다.
   */
  cameraDamping: 8,

  /** 포인터 패럴랙스 강도(0이면 끔). */
  parallax: 0.18,

  /** 섹션 텍스트가 페이드 인/아웃하는 구간 비율(0~0.5). */
  textFade: 0.28,

  /** 건너뛰기 링크가 향하는 곳 — 히어로 바로 다음 섹션. */
  skipTarget: '#about',

  /**
   * 화면 안에서 피사체를 밀어 텍스트와 겹치지 않게 하는 양.
   * 값은 뷰포트 비율 [오른쪽으로, 위로] — 카메라를 옮기는 대신 투영을 어긋내므로
   * (setViewOffset) 화각·거리와 무관하게 항상 같은 화면 비율만큼 이동한다.
   * 섹션의 camera.frame 으로 개별 지정하면 이 기본값을 덮어쓴다.
   */
  framing: {
    byAlign: {
      left: [0.17, 0],
      right: [-0.17, 0],
      center: [0, 0.14], // 텍스트가 아래로 가므로 피사체를 위로
    },
    /** 좁은 화면은 좌우로 피할 자리가 없어 위로만 민다 (텍스트가 하단에 깔린다) */
    compact: [0, 0.17],
  },

  /**
   * 조명·환경. 실제 glTF 모델이 들어오면 여기부터 다시 맞추게 된다.
   *
   * 외부 CDN(Environment preset 의 HDRI 등)을 쓰지 않는다 — 첫 화면이 남의
   * 가용성에 묶이면 안 된다. 대신 lightformers 로 환경맵을 그 자리에서 굽는다.
   * metalness 가 있는 재질은 반사할 환경이 없으면 거의 검게 렌더되므로 필수다.
   */
  lighting: {
    background: '#05101f',
    fog: { color: '#05101f', near: 14, far: 38 },

    ambient: 0.85,
    hemisphere: { sky: '#bcd2ff', ground: '#05101f', intensity: 1.1 },

    /** 주광 — 그림자를 만드는 유일한 광원 */
    key: {
      position: [5.5, 8, 4],
      intensity: 3.2,
      shadowMapSize: 1024,
      /** 그림자 카메라가 덮는 반경(월드 단위). 모델이 커지면 같이 키운다 */
      shadowRadius: 8,
      shadowNear: 1,
      shadowFar: 26,
      shadowBias: -0.0004,
    },

    /** 정면 필 — 카메라가 어디로 돌든 형태가 뭉개지지 않게 */
    fill: { position: [0, 3, 9], intensity: 1.1, color: '#dbe7ff' },

    /** 림라이트 — 로고 팔레트(accent-400 / brand-500) */
    rims: [
      { position: [-6, 2.5, -4], intensity: 2.2, color: '#38bdf8' },
      { position: [3, 1.2, -6], intensity: 1.3, color: '#2f63ea' },
    ],

    /** 절차적 환경맵 — 금속 반사와 전체 톤을 만든다 */
    environment: {
      resolution: 256,
      compactResolution: 128,
      background: '#0a1628',
      lightformers: [
        // 상단 대형 소프트박스
        { form: 'rect', intensity: 3.2, color: '#dbe7ff', scale: [14, 8, 1], position: [0, 8, 2], rotation: [-Math.PI / 2, 0, 0] },
        // 브랜드 컬러 측면 반사
        { form: 'circle', intensity: 2.6, color: '#38bdf8', scale: 7, position: [-8, 3, 3] },
        { form: 'rect', intensity: 2.0, color: '#2f63ea', scale: [10, 5, 1], position: [7, 2, -5], rotation: [0, -Math.PI / 3, 0] },
        // 바닥 반사
        { form: 'rect', intensity: 0.8, color: '#163561', scale: [14, 14, 1], position: [0, -3, 0], rotation: [Math.PI / 2, 0, 0] },
      ],
    },

    /** 바닥 격자 */
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

    /** 접지 그림자 — 좁은 화면에서는 생략한다 */
    contactShadows: { opacity: 0.6, scale: 16, blur: 2.4, far: 6, resolution: 512 },
  },

  /** 섹션 스냅 (변형 snap 에서만) */
  snap: {
    /**
     * 한 섹션 이동에 걸리는 시간(ms).
     * 카메라는 스크롤 위치를 따라가므로 이 값이 곧 카메라 이동 속도다.
     * 섹션 간 카메라 이동 거리가 제각각이라(탑다운 -> 후방 저각이 가장 크다)
     * 큰 전환에 맞춰 잡는 편이 안전하다.
     */
    duration: 1100,
    /**
     * 애니메이션이 끝난 뒤 추가로 잠가두는 시간(ms).
     * 트랙패드 관성 이벤트가 잦아들기를 기다린다 — 이게 없으면 한 번 튕겼는데
     * 두세 섹션이 연속으로 넘어간다.
     */
    quietMs: 120,
    /** 터치 스와이프가 한 섹션으로 인정되는 최소 이동(px) */
    touchThreshold: 40,
  },
}

/* ------------------------------------------------------------------ */
/* A/B 변형                                                            */
/* ------------------------------------------------------------------ */

export const EXPERIMENT_ID = 'hero_scroll_snap'
export const VARIANT_PARAM = 'hero' // ?hero=flow / ?hero=snap 으로 강제 지정
export const VARIANT_STORAGE_KEY = 'aikorea.hero.variant'
export const DEFAULT_VARIANT = 'flow'

/**
 * 무엇을 비교하는가:
 * 휠 한 번에 한 섹션씩 끊어 넘기는 것이 연속 스크롤보다
 * 서사를 잘 전달하는가, 아니면 스크롤을 빼앗겨 답답하다고 느끼게 하는가.
 *
 * 진행 표시·건너뛰기·섹션별 길이·섹션 CTA 는 이제 양쪽 공통이다
 * (그 비교는 끝났고 채택됐다).
 */
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

/* ------------------------------------------------------------------ */
/* 섹션                                                                */
/* ------------------------------------------------------------------ */

/**
 * vh:     이 섹션이 차지하는 스크롤 높이(svh).
 *         진행률 구간(range)은 이 길이들로부터 계산된다 — 손으로 적지 않는다.
 *         길이와 구간을 따로 적으면 언젠가 반드시 어긋난다.
 * camera: 그 섹션 한가운데에서의 카메라 상태. 키프레임 사이는 smoothstep 보간된다.
 *         스냅 변형은 이 지점(range 의 중앙)으로 정확히 이동한다.
 * action: 섹션마다 노출되는 보조 링크 하나.
 * actions: 마지막 섹션의 주 CTA 묶음.
 */
export const scrollSections = [
  {
    id: 'intro',
    eyebrow: 'AIKOREA · ROBOTICS & AUTOMATION',
    title: ['산업 현장의 움직임을', '로봇으로 바꿉니다'],
    body: '에이아이코리아는 산업 설비와 자동화 시스템을 개발해 온 경험을 바탕으로, 물류와 제조 현장에 필요한 로봇 기술을 개발합니다.',
    align: 'left',
    vh: 100,
    camera: { position: [2.6, 2.1, 8.6], target: [0, 0.95, 0], fov: 42 },
    action: { label: '회사 알아보기', href: '#about' },
  },
  {
    id: 'autonomy',
    eyebrow: '01 · AUTONOMOUS DRIVING',
    title: ['지게차가 스스로', '창고를 다닙니다'],
    body: '후륜 조향 산업 차량의 경로 계획과 주행 제어, LiDAR·카메라·IMU·엔코더를 융합한 위치 추정으로 작업자 조작 없이 이동합니다.',
    align: 'left',
    vh: 90,
    camera: { position: [-5.6, 1.3, 4.8], target: [0, 0.75, 0], fov: 40 },
    action: { label: '하는 일 보기', href: '#what-we-do' },
  },
  {
    id: 'perception',
    eyebrow: '02 · PERCEPTION & DOCKING',
    title: ['팔레트를 찾아', '정확히 파고듭니다'],
    body: '3D 비전으로 팔레트의 위치와 자세를 인식하고, 포크 승강 제어를 자율주행과 연동해 센티미터 단위로 도킹합니다.',
    align: 'left',
    // 근접 디테일 샷 — 오래 붙들 이유가 없다
    vh: 75,
    camera: { position: [-2.5, 0.85, 4.4], target: [0.1, 0.7, 0.8], fov: 34 },
    action: { label: '하는 일 보기', href: '#what-we-do' },
  },
  {
    id: 'manipulation',
    eyebrow: '03 · MANIPULATION',
    title: ['화물을 인식하고', '쌓아 올립니다'],
    body: '4축·6축 산업용 로봇의 모션 계획과 제어, 로봇–카메라 좌표계 정합, 혼합 팔레타이징의 적재 순서와 배치를 판단합니다.',
    align: 'right',
    // 적재 동작이 실제로 일어나는 구간이라 길게 준다
    vh: 110,
    camera: { position: [5.4, 3.6, 5.2], target: [0, 1.5, 0], fov: 42 },
    action: { label: '프로젝트 보기', href: '#projects' },
  },
  {
    id: 'simulation',
    eyebrow: '04 · DIGITAL TWIN',
    title: ['현장에 나가기 전에', '가상 환경에서 검증합니다'],
    body: 'NVIDIA Isaac Sim 위에 창고와 설비를 3D로 재현하고, 센서 모델과 제어 응답까지 맞춘 뒤 실물로 이관합니다.',
    align: 'right',
    vh: 85,
    camera: { position: [8.2, 6.2, -2.6], target: [0, 1.1, 0], fov: 44 },
    action: { label: '프로젝트 보기', href: '#projects' },
  },
  {
    id: 'fleet',
    eyebrow: '05 · FLEET CONTROL',
    title: ['여러 대가 동시에 움직이는', '현장을 관제합니다'],
    body: '로봇의 위치와 상태를 실시간으로 확인하고, 미션을 생성해 배차하며, 다수 로봇의 교통과 작업 순서를 조율합니다.',
    align: 'center',
    vh: 95,
    camera: { position: [0.5, 10.6, 1.5], target: [0, 0.3, 0], fov: 50 },
    action: { label: '프로젝트 보기', href: '#projects' },
  },
  {
    id: 'team',
    eyebrow: '06 · HOW WE WORK',
    title: ['기술을 나누지 않고', '문제를 기준으로 연결합니다'],
    body: '기계 설계, 전장, 로봇 소프트웨어, 인공지능 비전과 관제를 서로 분리된 기술로 보지 않습니다. 현장의 문제에서 출발해 하나의 자동화 시스템으로 완성합니다.',
    align: 'left',
    vh: 80,
    camera: { position: [-6.2, 3.2, -6.8], target: [0, 1.2, 0], fov: 40 },
    action: { label: '일하는 방식 보기', href: '#how-we-work' },
  },
  {
    id: 'join',
    eyebrow: 'JOIN US',
    title: ['이 문제를 함께 풀', '동료를 찾습니다'],
    body: '시뮬레이션에서 검증하고 현장에서 움직이는 일. 로보틱스 엔지니어를 기다립니다.',
    align: 'center',
    // CTA 를 읽고 누를 시간
    vh: 110,
    camera: { position: [0, 2.0, 10.6], target: [0, 1.1, 0], fov: 44 },
    actions: [
      { label: '채용 공고 보기', href: '#positions', variant: 'onDark' },
      { label: '회사 알아보기', href: '#about', variant: 'outlineDark' },
    ],
  },
]
