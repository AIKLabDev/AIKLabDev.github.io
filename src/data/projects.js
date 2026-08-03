/**
 * "지금 개발하고 있는 것들" — 로봇 연구개발 조직이 진행 중인 주요 프로젝트.
 *
 * 서술 층위가 섹션마다 겹치지 않도록 나눈다.
 *   techAreas.js  다루는 기술 영역과 역량 (하는 일)
 *   body          이 프로젝트로 무엇을 만들고 있고, 무엇이 까다로운가.
 *                 techAreas 의 역량 나열을 반복하지 않는다
 *   tags          무엇으로 만드는가 — 실제 쓰는 도구·프레임워크·라이브러리만 적는다.
 *                 언어와 센서·하드웨어는 넣지 않는다 (공고의 stack 에서 다룬다)
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
    title: '자율주행 AMR 지게차',
    body: '창고와 공장에서 팔레트를 자동으로 운반하는 자율주행 지게차를 개발합니다. 주행 알고리즘을 시뮬레이션에서 검증한 뒤 실제 장비에 적용하며, 다양한 현장 환경에 맞춰 성능을 고도화하고 있습니다.',
    tags: ['ROS2', 'Nav2', 'TEB', 'RTAB-Map', 'Isaac Sim'],
    media: {
      kind: 'loop',
      src: '/media/forklift-real.webm',
      poster: '/media/forklift-real.jpg',
      caption: '실물 지게차 자율주행 — 우측은 실시간 SLAM 지도',
    },
  },
  {
    id: 'sim-to-real',
    title: '로봇 시뮬레이션과 Sim-to-Real',
    body: '현장과 유사한 가상 환경에서 로봇의 주행과 작업, 센서 반응을 검증합니다. 검증한 알고리즘을 실물 로봇에 적용하며 시뮬레이션과 실제 환경의 차이를 줄여가고 있습니다.',
    tags: ['Isaac Sim', 'OpenUSD', 'URDF', 'SolidWorks'],
    media: {
      kind: 'loop',
      src: '/media/forklift-nav2-driving.webm',
      poster: '/media/forklift-nav2-driving.jpg',
      caption: 'Isaac Sim 창고에서 Nav2 자율주행 검증 — 좌측은 LiDAR 스캔, 우측은 추적 카메라',
    },
  },
  {
    id: 'palletizing',
    title: '팔레타이징 자동화',
    body: '산업용 로봇과 3D 비전을 활용해 다양한 크기와 형태의 제품을 팔레트에 자동으로 적재합니다. 제품의 위치와 규격을 인식하고, 적재 순서와 로봇의 동작 경로를 계산합니다.',
    tags: ['MoveIt', 'ROS2', 'Isaac Sim', 'OpenCV', 'PCL'],
    media: { kind: 'diagram', variant: 'palletizing', caption: 'Sim-to-Real 브리지 구조' },
  },
  {
    id: 'fleet-console',
    title: 'AMR 통합 관제 시스템',
    body: '여러 대의 AMR을 한 화면에서 확인하고 제어할 수 있는 관제 시스템을 개발합니다. 로봇의 위치와 상태, 카메라 영상을 실시간으로 전달해 안정적인 현장 운영을 지원합니다.',
    tags: ['FastAPI', 'React', 'WebSocket', 'WebRTC', 'MediaMTX'],
    media: { kind: 'image', src: '/media/fleet-surround.jpg', caption: 'AMR 서라운드 뷰 관제 화면' },
  },
  {
    id: 'mecanum-amr',
    title: '전방향 메카넘 AMR',
    body: '전후·좌우·대각선으로 자유롭게 이동할 수 있는 전방향 AMR을 개발합니다. 좁은 공간에서도 유연하게 움직이며, 새로운 센서와 주행 알고리즘을 검증하는 플랫폼으로 활용하고 있습니다.',
    tags: ['ROS2', 'Nav2', 'Isaac Sim'],
    media: {
      kind: 'loop',
      src: '/media/mecanum-real.webm',
      poster: '/media/mecanum-real.jpg',
      caption: '실물 메카넘 AMR 자율주행',
    },
  },
  {
    id: 'vision-control',
    title: '로봇 비전 기반 제어',
    body: '카메라로 인식한 위치 정보를 실제 로봇의 움직임과 연결하는 비전 기술을 개발합니다. 좌표계를 정밀하게 보정하고, 학습 기반 제어 기술의 현장 적용 가능성을 검증하고 있습니다.',
    tags: ['ROS2', 'OpenCV', 'ZED SDK'],
    media: { kind: 'image', src: '/media/camera-calibration.jpg', caption: '실물 차량 카메라 캘리브레이션' },
  },
]
