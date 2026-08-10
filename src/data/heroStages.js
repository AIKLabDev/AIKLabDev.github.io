const ENTRY = -0.14
const TRAVEL = -0.06
const CARRY = 0.1

export const forkHeights = { carry: CARRY, entry: ENTRY, travel: TRAVEL }

/**
 * 무대는 하나다. 여섯 장이 같은 차량의 한 번의 주행이라 무대를 나누면
 * 장이 바뀔 때마다 서로 다른 세계의 차량이 겹쳐 디졸브된다.
 * 장마다 달라지는 것은 연출(`beat`)뿐이고, 차량은 계속 달린다.
 */
export const heroStages = {
  journey: {
    /** 순항 속도(m/s). 바닥과 세계가 이 속도로 뒤로 흐른다 */
    speed: 2.6,
    /** 속도·포크 높이 추종 강도 */
    accel: 1.6,
    forkRate: 4,

    /** ② 센서가 도는 것을 보여 주는 스윕. 외벽까지 닿는다 */
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

    /**
     * ② 에서 드러나고 ③~⑥ 내내 서 있는 공간. 점 하나짜리 지오메트리 한 덩이다.
     * 주행 방향 간격은 전부 `span` 의 약수여야 접히는 자리가 드러나지 않는다.
     */
    world: {
      color: '#cfdcf5',
      seed: 20260810,
      span: 180,
      /** 점 하나의 월드 지름(m) */
      dot: 0.19,

      /**
       * [드러나는 지점, 그 폭, 사라지는 지점, 그 폭] — 전부 차량 기준 X.
       * ② 는 센서 바로 앞에서 돋아나고(building), ③ 부터는 이미 다 그려진
       * 공간이 통째로 서 있다(built). 이 둘 사이를 옮겨 가는 것이 ②→③ 이다.
       */
      building: [10, 4.5, -22, 8],
      built: [58, 18, -58, 20],
      curveRate: 1.4,

      /** 한 칸(period)마다 랙 하나. 길이는 칸마다 다르고 남는 자리는 통로가 된다 */
      block: { period: 18, length: [8.5, 15], gap: 2.5 },

      rack: {
        /** 통로에 면한 쪽 y. 상자는 여기서 바깥으로 depth 만큼 놓인다 */
        rows: [6.5, 17, 29],
        /** 멀수록 성기게 — 거리에서 실제로 지각되는 정보량에 맞춘다 */
        falloff: 0.55,

        // 창고의 랙은 다 같지 않다. 열마다 기본 높이가 다르고 칸마다 또 다르다 —
        // 전부 같은 상자면 벽지 무늬로 읽힌다
        depth: [4, 7.5],
        height: [2.4, 6.2],
        /** 열 기본 높이에 칸마다 곱해지는 폭 */
        spread: 0.28,
        /** 비어 있는 칸의 비율 */
        empty: 0.12,

        /** 겉면을 표본하는 간격 [주행방향, 폭방향, 높이] */
        step: [0.55, 0.75, 0.55],
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
        /** 끊기지 않으면 끝없는 터널로 읽힌다 */
        door: { every: 36, width: 9 },
      },

      /** 랙 블록 사이 통로에 선다. 블록 안에 박히면 형태가 서로 먹는다 */
      column: { y: 14.5, spacing: 18, size: 0.7, height: 6.8, step: 0.5, alpha: 0.8 },

      // 세로 화면은 카메라가 크게 물러나 같은 밀도로는 화면에서 사라진다.
      // 줄일 수 있는 것은 열 수와 표본 간격이지 밀도 자체가 아니다
      compact: { step: 1.5, rackRows: 3, wallRows: 5 },
    },

    /** ③ 장애물이 들어오면 서지 않고 주행 중에 경로가 휜다 */
    route: {
      count: 6,
      /** width 보다 넓어야 이웃한 회피가 서로 겹쳐 갈지자로 흔들리지 않는다 */
      spacing: 30,
      /** 멀리서 먼저 보이고(appear), 이 거리 안에 들어와야 경로가 휜다(detect) */
      appear: [34, 24],
      detect: 9,
      ramp: 3.5,
      /**
       * 비켜서는 폭과 그 폭이 퍼지는 거리.
       * width 는 차량 길이(3.5m)보다 충분히 길어야 한다 — 짧으면 최대 요각이
       * 30도를 넘고, 장애물이 뒤쪽에 왔을 때 이미 중앙으로 돌아와 뒷부분이 쓸린다.
       */
      amplitude: 2.4,
      width: 9,
      /** 장애물 자체는 차선 중앙에서 살짝 비켜 있다 */
      offset: 0.35,
      yaws: [0.18, -0.12, 0.26, -0.2, 0.1, -0.28],

      tail: -26,
      tailFade: 8,
      /** 계획 경로는 화면 끝까지 뻗어야 "멀리 내다본다"로 읽힌다 */
      ahead: 58,
      behind: 22,
      samples: 120,
      trailSamples: 48,

      plan: { width: 0.26, color: '#4f9dff', opacity: 0.85 },
      laid: { width: 0.16, color: '#dbe7ff', opacity: 0.22 },

      /** 피할 것으로 인식했다는 표시. 장애물 발밑에 깔린다 */
      detection: { margin: 0.5, thickness: 0.055, color: '#7dd3fc', opacity: 0.75 },
    },

    /** ④ 감속 → 정렬 → 포크 삽입 → 정지. 한 바퀴를 돌고 다시 팔레트를 만난다 */
    dock: {
      /** 접근 시작점까지의 거리와 감속을 시작하는 거리 */
      run: 12,
      decel: 7,
      lift: 1.2,
      hold: 1,
      carry: 2.6,
      /** 다음 바퀴를 위해 적재물을 넘기고 비우는 구간 */
      handoff: 1.1,
      gap: 2.4,
      fadeRate: 4,

      marker: { color: '#f5b544', margin: 0.24, thickness: 0.05, opacity: 0.9 },
    },

    /** ⑤ 로봇을 더 놓지 않고 연구 영역을 공간에 띄운다 */
    lab: {
      labels: ['AMR', 'AI VISION', 'ROBOT CONTROL', 'PALLETIZING'],
      sides: [1, -1, 1, -1],
      spacing: 15,
      y: 6.5,
      z: [2.6, 3.3],
      color: '#7dd3fc',
      size: [3.4, 0.85],
      /** 앞에서 나타나고 뒤로 지나가며 사라지는 구간 (차량 기준 X) */
      appear: [28, 21],
      leave: [-6, -15],
    },

    /** ⑥ 카메라는 남고 차량만 깊숙이 빠진다 */
    join: { depart: 16, ease: 0.6 },
  },
}
