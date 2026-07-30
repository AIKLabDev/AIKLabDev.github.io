/**
 * "지금 개발하고 있는 것들" — 로봇 연구개발 조직이 진행 중인 주요 프로젝트.
 *
 * media.kind
 *   'loop'    자동 재생되는 짧은 무음 루프 (webm, 용량 작음)
 *   'clip'    포스터 + 클릭 재생 (mp4, preload 안 함)
 *   'image'   정지 이미지
 *   'diagram' 사진 자료가 없는 경우의 구조 다이어그램
 */
export const projects = [
  {
    id: 'amr-forklift',
    title: 'AMR 지게차 자율주행',
    lead: '산업용 지게차가 창고와 공장 안에서 스스로 이동하고 팔레트를 운반하도록 개발합니다.',
    detail:
      '일반적인 차동구동 AMR과 다른 지게차의 후륜 조향 특성을 반영해 경로 계획과 제어 알고리즘을 구성합니다. 팔레트를 인식한 뒤 포크 삽입 위치까지 정밀하게 접근하는 도킹 기술도 함께 개발합니다.',
    tags: ['ROS2', 'Nav2', 'RTAB-Map', '센서 퓨전', '주행 제어', '정밀 도킹'],
    media: {
      kind: 'loop',
      src: '/media/forklift-real.webm',
      poster: '/media/forklift-real.jpg',
      caption: '실물 지게차 자율주행 — 우측은 실시간 SLAM 지도',
    },
  },
  {
    id: 'warehouse-twin',
    title: '창고 디지털 트윈',
    lead: '로봇과 작업 환경을 NVIDIA Isaac Sim에 구현해 실제 장비 투입 전에 동작을 확인합니다.',
    detail: '창고 구조와 센서 배치를 가상 환경에 구성하고, 자율주행·충돌 회피·로봇 작업 동작을 반복 검증합니다.',
    tags: ['Isaac Sim', 'OpenUSD', 'URDF', 'ROS2 Bridge', 'Sim-to-Real'],
    media: {
      kind: 'image',
      src: '/media/isaacsim-warehouse.jpg',
      caption: 'Isaac Sim으로 재현한 창고 랙 구조',
    },
  },
  {
    id: 'palletizing',
    title: '팔레타이징 자동화',
    lead: '산업용 로봇과 3D 비전을 이용해 크기와 형태가 다른 제품을 팔레트에 적재합니다.',
    detail:
      '카메라로 제품의 위치와 자세를 인식하고, 로봇이 제품을 집을 위치와 적재 순서를 계산합니다. 하나의 규격만 반복해서 쌓는 작업뿐 아니라 여러 규격의 제품이 섞인 작업도 다룹니다.',
    tags: ['3D 비전', '로봇 매니퓰레이션', '모션 계획', '혼합 팔레타이징'],
    media: { kind: 'diagram', variant: 'palletizing', caption: 'Sim-to-Real 브리지 구조' },
  },
  {
    id: 'fleet-console',
    title: 'AMR 관제 시스템',
    lead: '여러 대의 로봇을 하나의 화면에서 관리하기 위한 관제 시스템입니다.',
    detail:
      '지도 위에서 차량 위치와 상태를 확인하고, 작업을 배차하며, 이동 구역과 안전 구역을 설정합니다. 차량의 영상과 장애 상태도 함께 확인할 수 있도록 개발하고 있습니다.',
    tags: ['플릿 관리', '지도 편집', '미션 배차', '실시간 통신', '영상 관제'],
    media: { kind: 'image', src: '/media/fleet-surround.jpg', caption: 'AMR 서라운드 뷰 관제 화면' },
  },
  {
    id: 'mecanum-amr',
    title: '전방향 메카넘 AMR',
    lead: '좁은 공간에서 전후·좌우와 대각선으로 이동할 수 있는 전방향 AMR을 개발합니다.',
    detail: '소형 테스트 플랫폼을 이용해 센서, 자율주행 알고리즘과 관제 시스템을 빠르게 시험하고 검증합니다.',
    tags: ['메카넘 구동', 'ROS2', '자율주행', '스테레오 비전'],
    media: {
      kind: 'loop',
      src: '/media/mecanum-real.webm',
      poster: '/media/mecanum-real.jpg',
      caption: '실물 메카넘 AMR 자율주행',
    },
  },
  {
    id: 'calibration-rl',
    title: '로봇 비전과 학습 기반 제어',
    lead: '카메라가 인식한 공간과 로봇이 움직이는 공간을 정확하게 맞추고, 이를 실제 로봇 제어에 활용합니다.',
    detail:
      '3D 자세 추정, 카메라 캘리브레이션과 좌표 변환 기술을 개발하고 있으며, 시뮬레이션과 학습 기반 제어 기술의 실제 장비 적용 가능성도 검토하고 있습니다.',
    tags: ['RGB-D', '3D 좌표 정합', '카메라 캘리브레이션', '강화학습'],
    media: { kind: 'image', src: '/media/camera-calibration.jpg', caption: '실물 차량 카메라 캘리브레이션' },
  },
]
