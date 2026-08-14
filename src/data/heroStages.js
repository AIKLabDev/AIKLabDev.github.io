const ENTRY = -0.14
const TRAVEL = -0.06
const CARRY = 0.1

export const forkHeights = { carry: CARRY, entry: ENTRY, travel: TRAVEL }

/** 무대는 하나다. 장마다 달라지는 것은 연출(`beat`)뿐이다 */
export const heroStages = {
  journey: {
    /** 순항 속도(m/s) */
    speed: 2.6,
    /** 속도·포크 높이 추종 강도 */
    accel: 1.6,
    forkRate: 4,

    scan: {
      color: '#7dd3fc',
      z: 0.5,
      radius: 15,
      rings: 3,
      ringOpacity: 0.1,
      sector: 0.5,
      sectorOpacity: 0.14,
      rate: 0.32,
    },

    /** 주행 방향 간격은 전부 `span` 의 약수여야 접히는 자리가 드러나지 않는다 */
    world: {
      color: '#cfdcf5',
      seed: 20260814,
      span: 180,
      /** 점 하나의 월드 지름(m) */
      dot: 0.19,

      /** [드러나는 지점, 그 폭, 사라지는 지점, 그 폭] — 전부 차량 기준 X */
      building: [10, 4.5, -22, 8],
      built: [58, 18, -58, 20],
      curveRate: 1.4,

      /** `gap` 은 매 주기 끝에 남기는 빈 자리 — `route.branches` 가 여기로 빠져나간다 */
      block: { period: 18, length: [11, 13.5], gap: 4.5 },

      /** 실물 랙은 깊이 1.1m · 높이 6.1m 벽이 통로에서 10m·21m 에 선다 */
      rack: {
        /** 통로에 면한 쪽 y. 상자는 여기서 바깥으로 depth 만큼 놓인다 */
        rows: [7.5, 18, 30],
        falloff: 0.55,

        depth: [1.6, 2.6],
        height: [4.8, 6.4],
        /** 열 기본 높이에 칸마다 곱해지는 폭 */
        spread: 0.16,
        empty: 0.12,

        /** 겉면을 표본하는 간격 [주행방향, 폭방향, 높이] */
        step: [0.5, 0.7, 0.5],
        alpha: 0.95,
      },

      wall: {
        y: 46,
        step: 0.7,
        rows: 7,
        z0: 0.2,
        zStep: 0.85,
        jitter: 0.07,
        alpha: 0.72,
        door: { every: 36, width: 9 },
      },

      /** 블록 안에 박히면 다른 형태와 겹친다 */
      column: { y: 14.5, spacing: 18, size: 0.7, height: 6.8, step: 0.5, alpha: 0.8 },

      compact: { step: 1.5, rackRows: 3, wallRows: 5 },
    },

    route: {
      count: 6,
      /** width 보다 넓어야 이웃한 회피가 서로 겹쳐 갈지자로 흔들리지 않는다 */
      spacing: 30,
      /** 멀리서 먼저 보이고(appear), 이 거리 안에 들어와야 경로가 휜다(detect) */
      appear: [34, 24],
      detect: 9,
      ramp: 3.5,
      /** width 는 차량 길이(3.5m)보다 길어야 한다 — 짧으면 뒷부분이 장애물을 스친다 */
      amplitude: 2.4,
      width: 9,
      offset: 0.35,
      yaws: [0.18, -0.12, 0.26, -0.2, 0.1, -0.28],

      tail: -26,
      tailFade: 8,
      ahead: 58,
      behind: 22,
      samples: 120,
      trailSamples: 48,

      plan: { width: 0.26, color: '#4f9dff', opacity: 0.85 },
      laid: { width: 0.16, color: '#dbe7ff', opacity: 0.22 },

      /** `base + radius` 가 `block.gap` 안에 들어와야 갈래가 랙을 뚫지 않는다 */
      branches: {
        count: 4,
        /** 블록 주기의 배수여야 매번 빈 자리에 선다 */
        spacing: 18,
        /** 주기 안에서 갈림목이 서는 자리 (빈 구간은 13.5~18m) */
        base: 13.5,
        radius: 3.2,
        reach: 14,
        samples: 30,
        taper: 0.7,
        /** 앞에서 드러나고 지나가며 사라지는 구간 (차량 기준 X) */
        appear: [34, 26],
        leave: [-4, -14],
        style: { width: 0.2, color: '#7dd3fc', opacity: 0.5 },
        pulse: { rate: 0.19, depth: 0.3 },
      },

      /** 장애물 발밑에 깔린다 */
      detection: { margin: 0.5, thickness: 0.055, color: '#7dd3fc', opacity: 0.75 },
    },

    /** 한 바퀴마다 `stride` 만큼 전진한다 — 팔레트·트럭 모두 사라졌다 나타나지 않는다 */
    dock: {
      stride: 28,
      /** `run` 은 실제로는 다음 격자 눈금까지 맞춰진다 */
      run: 12,
      decel: 7,

      pick: 0.9,
      lift: 1,
      hold: 0.4,
      haul: 2.4,
      accel: 1.8,
      back: 2.6,
      settle: 0.9,
      /** 내려놓기 직전 팔레트가 적재함 바닥 위로 떠 있는 높이 */
      clear: 0.11,
      /** 포크가 팔레트에서 빠져나올 때까지의 후진 거리, 그리고 그 뒤로 다 내리는 거리 */
      tineOut: 1.4,
      lower: 5,
      /** 후진 곡선의 기울기는 양 끝에서 0이다 — 들어온 곡선을 되짚으면 요각이 튄다 */
      backRun: 9.4,
      backLane: -2,
      /** 차선은 시간이 아니라 거리로 옮긴다 */
      laneRun: 15,
      /** `passRun` 은 물러난 자리와 다음 적재 지점 사이에 들어가야 양 끝이 0으로 닫힌다 */
      pass: 2,
      passRun: 10.5,
      steerRate: 7,
      fadeRate: 4,

      queue: { count: 4, appear: [64, 48], leave: [-24, -36], reset: -42 },
      seed: 20260814,

      /** `stop` 은 트럭 중심에서 차량이 서는 자리 — 포크 길이(1.24m)가 정하는 한계다 */
      truck: {
        x: 17,
        y: -4.6,
        bed: 0.885,
        stop: -1.66,
        /** 적재함 안쪽 길이(4m) 안에서 세 장(+ 넣을 한 장)이 한계다 */
        stocked: [2, 0, 2, 1],
        /** 흔들린 화물끼리 닿지 않는 최소 간격(1.16m)보다 넓고, 운전실 격벽 앞에서 닫힌다 */
        pitch: 1.25,
        /** 화물을 흔드는 폭 [각도, 좌우] */
        jitter: [0.12, 0.14],
        appear: [58, 44],
        leave: [-22, -34],
        reset: -40,
      },

      marker: { color: '#f5b544', margin: 0.24, thickness: 0.05, opacity: 0.9 },

      /** 안개 밖의 `truck` 만 `run` 동안 물러난다 — 이미 온 트럭은 그대로 흘러 지나간다 */
      linger: { truck: 44, run: 10 },
    },

    yard: {
      fadeRate: 2.4,

      /** span 은 spacing 의 배수여야 접히는 자리가 벌어지지 않는다 */
      rack: {
        /** 랙을 채우는 차량이 물러설 자리(열에서 7m)만 남기고 붙인다 */
        rows: [10, 21, -20],
        /** 랙 폭보다 넓어야 끝 기둥이 겹쳐 깜빡이지 않는다 */
        spacing: 13.5,
        /** 원본 메시 칸(0.65×0.66m)은 팔레트가 안 들어가 `WAREHOUSE_RACK_SIZE` 비례로 키운 값이다 */
        size: [1.1, 13.35, 6.1],
        span: 108,
        compactSpan: 54,
        /** 선반 상판 실측값(테두리 기준) — 기둥 이음매를 재면 화물이 0.25m 뜬다 */
        decks: [0.1301, 0.7858, 1.4416, 2.0974],
        /** 기둥 사이 여덟 자리 중 선반 판 없는 둘은 뺀 값이다 */
        slots: [-2.1875, -1.5375, -0.3075, 0.3425, 1.5375, 2.1875],
        fill: 0.6,
        /** 칸에 깔리는 저면체 팔레트 색 — 실물 팔레트 텍스처의 평균값 */
        palletColor: '#367191',
        seed: 20260811,
      },

      /** [x, y, 단수, 각도, 켜수] */
      floor: [
        [6, 8.2, 2, 0.1],
        [12.5, 7.9, 1, -0.28],
        [24, 8.5, 1, 0.06, 2],
        [31, 8.0, 2, -0.15],
        [45, 8.4, 1, 0.24],
        [61, 7.8, 2, -0.09],
        [78, 8.3, 1, 0.31, 2],
        [9, -7.5, 1, -0.19, 2],
        [21, -8.4, 2, 0.35],
        [27, -7.5, 2, 0.08],
        [44, -8.1, 1, -0.42],
        [58, -7.7, 1, 0.21, 2],
        [66, -8.5, 2, -0.06],
        [83, -7.6, 1, 0.44],
        [90, -8.2, 1, -0.26, 2],
      ],

      /** speed 는 통로 기준 상대속도다 */
      fleet: [
        { y: 19, speed: -2.2, base: 34, load: true },
        { y: 15.5, speed: 1.3, base: -46, load: false },
        { y: -17.5, speed: -1.9, base: 62, load: true },
      ],
      fleetSpan: 140,

      /** `rows[lane]` 열의 `every` 모듈마다 `slot` 칸을 비워 두고 거기에 넣는다 — 주기(spacing × every)가 다르면 이미 찬 칸에 겹친다 */
      loader: {
        lane: 0,
        slot: 1,
        every: 4,
        approach: 32,
        exit: 18,
        /** 호 끝의 남는 거리(1.76m)는 갈래가 팔레트에서 빠지는 거리(1.02m)보다 길어야 한다 */
        radius: 2.6,
        /** 세계가 멈춰 있을 때 이 차량이 스스로 나아가는 속도(m/s) */
        pace: 1.2,
        /** 통로 y는 부풀리는 폭(+2.6)과 연구 영역(+6.5) 사이 — 꺾어 들 때 뒤끝이 3.8m 밀려난다 */
        aisle: 5.6,
        /** 내려놓기 직전 팔레트가 선반 위로 떠 있는 높이 */
        clear: 0.12,
        /** 달려온 거리를 더한 자기 자리 기준 구간이다 */
        appear: [56, 38],
        leave: [-10, -24],
        /** 칸 기준 구간이다 */
        shelf: { appear: [26, 16], leave: [-16, -26] },
      },

      appear: [62, 42],
      leave: [-26, -38],
    },

    /** 글자는 세계 좌표에 고정되어 있다 */
    plaza: {
      text: 'AIKOREA',
      /** 칸 크기(m) */
      cell: 1.7,
      compactCell: 1.12,
      /** 두 열이면 길 폭이 차폭(1.14m)의 세 배도 안 된다 */
      space: 3,
      center: [26, -10.5],
      seed: 20260814,
      jitter: { offset: 0.09, yaw: 0.09 },
      palletColor: '#367191',

      /** 동시에 비어 있을 수 있는 자리 수의 상한(전체 88칸) */
      damage: 4,
      /** 열에 곧게 들어가기 시작하는 자리 — 글자 끝에서 m */
      gate: 4.2,
      /** 글자 양옆 적치대. `rows` 는 걸치는 줄 수, `stock` 은 초기에 찬 줄 수, `cap` 은 최대 적재 장수다 */
      buffer: { out: 4, rows: 4, stock: 2, cap: 2 },
      /** 붙어 있으면 곡선이 제자리 왕복으로 퇴화한다 */
      stride: 8,
      cross: 14,
      /** 차체(3.49m) + 0.2초 샘플링 오차(최대 0.7m) */
      clear: 4.2,
      wait: 2.2,
      /** 마친 차량이 자리를 잡고 있는 것으로 보는 시간 — 아니면 길이 그 위로 그어진다 */
      park: 5,
      /** 이미 붙어 버린 두 대가 다시 벌어져 나가야 하는 속도(m/s) */
      recover: 0.6,
      /** 몇 번째 일마다 화물을 든 채 화면 밖으로 나가는가 (0 이면 나가지 않는다) */
      away: 0,
      /** 화면 밖 자리 — 글자 양끝에서 `out`, 통로에서 `drop` 만큼 더 내려간다 */
      wing: { out: 26, drop: 11 },

      /** 넷을 넘기지 않는다 — 다섯이면 `damage` 상한에 걸려 자리가 빈다 */
      units: [
        { side: 'front', delay: 6, bow: 0, gap: 0, lean: 0.22 },
        { side: 'back', delay: 20, bow: 2.4, gap: 2, lean: 0.58 },
        { side: 'front', delay: 34, bow: 1.2, gap: 1, lean: 0.38 },
        { side: 'back', delay: 48, bow: 3.4, gap: 3, lean: 0.7 },
      ],
      compactUnits: 3,
    },

    join: { depart: 16, ease: 0.6 },
  },
}
