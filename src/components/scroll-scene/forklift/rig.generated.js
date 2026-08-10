/**
 * 자동 생성 파일 — tools/forklift-model/build.mjs 가 URDF 와 OBJ 에서 뽑는다.
 * 손으로 고치지 말 것. 값을 바꾸려면 원본 URDF 를 고치고 다시 빌드한다.
 *
 * 단위 m / rad, 좌표계는 URDF 그대로 Z-up. 차량 전방은 +X, 좌측이 +Y 다.
 */

/** motion 노드 이름 = URDF 조인트 이름. 런타임이 이 이름으로 노드를 찾는다. */
export const joints = {
  "fork_lift_joint": {
    "type": "prismatic",
    "axis": [
      0,
      0,
      1
    ],
    "lower": -0.140000015497,
    "upper": 0.879999995232,
    "mimic": null
  },
  "steering_handle_joint": {
    "type": "revolute",
    "axis": [
      0,
      0,
      1
    ],
    "lower": -2.90248254607,
    "upper": 2.90248254607,
    "mimic": null
  },
  "front_left_wheel_joint": {
    "type": "continuous",
    "axis": [
      1,
      0,
      0
    ],
    "lower": null,
    "upper": null,
    "mimic": null
  },
  "front_right_wheel_joint": {
    "type": "continuous",
    "axis": [
      1,
      0,
      0
    ],
    "lower": null,
    "upper": null,
    "mimic": {
      "joint": "front_left_wheel_joint",
      "multiplier": 1,
      "offset": 0
    }
  },
  "rear_left_steering_joint": {
    "type": "revolute",
    "axis": [
      0,
      0,
      1
    ],
    "lower": -0.774926187885,
    "upper": 0.774926187885,
    "mimic": {
      "joint": "steering_handle_joint",
      "multiplier": -0.266987372219,
      "offset": 0
    }
  },
  "rear_right_steering_joint": {
    "type": "revolute",
    "axis": [
      0,
      0,
      1
    ],
    "lower": -0.774926187885,
    "upper": 0.774926187885,
    "mimic": {
      "joint": "steering_handle_joint",
      "multiplier": -0.266987372219,
      "offset": 0
    }
  },
  "rear_left_wheel_joint": {
    "type": "continuous",
    "axis": [
      1,
      0,
      0
    ],
    "lower": null,
    "upper": null,
    "mimic": null
  },
  "rear_right_wheel_joint": {
    "type": "continuous",
    "axis": [
      1,
      0,
      0
    ],
    "lower": null,
    "upper": null,
    "mimic": {
      "joint": "rear_left_wheel_joint",
      "multiplier": 1,
      "offset": 0
    }
  }
}

export const vehicle = {
  /** 앞축(비조향축) - 뒷축(조향축) 거리. 후륜 조향이라 경로를 따라가는 점은 앞축이다. */
  wheelbase: 1.477845,
  frontAxleX: -1.264500,
  rearAxleX: -2.742345,
  frontWheelRadius: 0.284347,
  rearWheelRadius: 0.205033,
  /** 바퀴가 바닥(z=0)에 닿는 base_link 높이 */
  rideHeight: 0.235622,
  /** 차량 외곽 (base_link + 포크). 카메라 프레이밍과 그림자 범위의 기준. */
  extent: {
    min: [-3.052, -0.572, -0.164],
    max: [0.436, 0.565, 2.069],
  },
}

export const forkLift = {
  /** fork_lift_joint 의 이동 한계 (URDF limit 그대로) */
  lower: -0.140000015497,
  upper: 0.879999995232,
  /** 캐리지 앞면 / 포크 끝 (차량 좌표 X). 팔레트 진입 깊이가 여기서 나온다. */
  backrestX: -0.870071,
  tineTipX: 0.435998,
  /**
   * 포크 두 갈래의 Y 중심. 포크가 차체 중앙에 있지 않아서(좌측으로 치우쳐 있다)
   * 팔레트도 같은 만큼 옆으로 놓여야 갈래가 슬롯에 들어간다.
   * 값은 전달 패키지 데모(threejs_demo/app.js 의 FORK_TINES)에서 가져왔다.
   */
  tineCenterY: -0.092357,
}

export const palletProp = {
  size: [1.0200, 1.2200, 0.1400],
  /** 메시 원점이 바닥면에 있다 (z=0 이 접지면) */
  originAtBottom: true,
}

export const boxProp = {
  size: [0.5090, 0.4083, 0.3500],
}
