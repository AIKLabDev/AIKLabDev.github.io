import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { lerp, rangeProgress, smoothstep } from '../../lib/math'

/**
 * 실제 glTF 가 준비되기 전까지 쓰는 절차적 지게차 리그.
 *
 * SceneModel 과 계약이 같다 — props 는 { progress } 하나뿐이고
 * 진행률 해석을 컴포넌트 내부에서 끝낸다. data/scrollScene.js 의 path 만 채우면
 * ScrollScene 이 이 컴포넌트를 SceneModel 로 바꿔 끼운다.
 *
 * 진행률 → 동작 매핑 (모두 스크럽 가능해야 하므로 시간 누적을 쓰지 않는다):
 *   시작        주행 자세: 포크가 전면 센서 위로 올라가 있다
 *   0.10~0.20  하강: 팔레트에 꽂을 높이로 포크를 내린다
 *   0.20~0.34  진입: 차량이 전진해 포크가 팔레트에 들어간다
 *   0.38~0.56  적재: 캐리지 상승 + 팔레트가 함께 올라감
 * LiDAR 로터만 예외로 시간 기반 — 정지 중에도 장비가 살아 있음을 보여준다.
 *
 * 포크가 처음부터 내려가 있으면 안 된다. 전면 ZED X 와 LiDAR 바로 앞을 가려서
 * 실제로는 아무것도 감지하지 못하는 자세가 된다 — 주행 중에는 센서 시야를
 * 비워두고, 팔레트를 뜨러 갈 때만 내린다.
 */

const BODY = <meshStandardMaterial color="#14356e" metalness={0.4} roughness={0.45} />
const STEEL = <meshStandardMaterial color="#8fa3bd" metalness={0.85} roughness={0.3} />
// 센서 하우징. 차체보다 밝게 둔다 — 어두우면 뒤쪽 실루엣에서 통째로 묻힌다.
const SENSOR = <meshStandardMaterial color="#54657f" metalness={0.6} roughness={0.32} />
// 타이어. 배경(ink-950 = #05101f)과 같은 색이면 실루엣이 통째로 사라진다 —
// 실제로 그랬다. 어두운 고무로 읽히면서 배경에서는 떨어지는 값이어야 하고,
// roughness 를 조금 낮춰 환경광이 위쪽 모서리에 걸리게 해야 형태가 보인다.
const RUBBER = <meshStandardMaterial color="#2a3542" metalness={0.15} roughness={0.72} />
const CARGO = <meshStandardMaterial color="#3b4a5f" metalness={0.1} roughness={0.7} />
const WOOD = <meshStandardMaterial color="#55647c" metalness={0.05} roughness={0.85} />
const GLOW = <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.8} toneMapped={false} />
// 센서 렌즈·인디케이터용 약한 발광. GLOW 는 toneMapped={false} 라 흰색으로 터져서
// 작은 부품에 쓰면 빛덩어리로만 보인다 — 형태가 남을 만큼만 밝힌다.
const SENSOR_GLOW = <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.75} />
// 스캔면. 아주 옅어야 한다 — 조금만 진해도 차체에 널빤지를 꽂아둔 것처럼 보인다.
const SCAN = <meshBasicMaterial color="#38bdf8" transparent opacity={0.09} toneMapped={false} depthWrite={false} />

const WHEELS = [
  [0.66, 0.3, 0.5],
  [-0.66, 0.3, 0.5],
  [0.62, 0.28, -1.15],
  [-0.62, 0.28, -1.15],
]

/**
 * 센서 배치는 amr-forklift-urdf 의 forklift_static_sensors_wheels.urdf 를 따른다.
 * 실물은 전면·후면에 각각 ZED X 스테레오 카메라 한 대와 2D LiDAR 한 대가 짝으로
 * 붙고, 두 곳 모두 LiDAR 가 카메라보다 6cm 위에 온다. 상단(캐노피)에는 아무것도
 * 없다 — 예전에 여기 3D LiDAR 를 올려뒀던 것은 실물과 다른 표현이었다.
 *
 * 지면 높이(URDF 실측): 전면 카메라 0.196 / 전면 LiDAR 0.256,
 * 후면 카메라 0.745 / 후면 LiDAR 0.805. 전면은 낮고 후면은 높다는 관계를 지킨다.
 * 절대 치수는 이 리그의 과장된 비례에 맞춰 키웠다 — 실척이면 화면에서 점이 된다.
 */
const SENSOR_GAP = 0.17 // 카메라 위에 LiDAR 가 올라앉는 간격 (실물 6cm 을 리그 비례로)

/** 팔레트는 제자리에 놓여 있고 차량이 다가간다 (실제 도킹과 같은 방향) */
const PALLET_Z = 1.55
const VEHICLE_START_Z = -1.5
const MAX_LIFT = 1.45
/** 주행 자세 — 포크 밑면이 전면 LiDAR 위(약 0.66)를 살짝 넘어서는 높이 */
const TRAVEL_LIFT = 0.6
/** 팔레트에 꽂는 높이 */
const ENTRY_LIFT = 0.02

/**
 * ZED X 스테레오 카메라 — 가로로 긴 본체에 렌즈 두 개.
 * 렌즈가 둘이라는 것이 이 장비를 알아보게 하는 유일한 단서라 반드시 두 개 그린다.
 *
 * @param {number} facing 렌즈가 보는 방향 (+1 = +Z 전방, -1 = 후방)
 */
function ZedX({ position, facing = 1 }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.34, 0.1, 0.08]} radius={0.02} smoothness={3} castShadow>
        {SENSOR}
      </RoundedBox>
      {[0.1, -0.1].map((x) => (
        <mesh key={x} position={[x, 0, facing * 0.042]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.027, 0.027, 0.008, 16]} />
          {SENSOR_GLOW}
        </mesh>
      ))}
    </group>
  )
}

/**
 * 2D LiDAR — 카메라보다 작은 원통.
 *
 * 스캔 표현을 수평으로 얇은 판으로 두는 것이 3D LiDAR 와 갈리는 지점이다.
 * 회전하는 선 하나로 그리면 층을 쌓는 3D 처럼 읽힌다.
 */
function Lidar2D({ position, rotorRef }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.07, 20]} />
        {SENSOR}
      </mesh>
      <group ref={rotorRef} position={[0, 0.052, 0]}>
        {/* 내부 미러 — 도는 것이 보이도록 한쪽만 밝힌다 */}
        <mesh position={[0, 0, 0.045]}>
          <boxGeometry args={[0.07, 0.03, 0.03]} />
          {SENSOR_GLOW}
        </mesh>
      </group>
      {/* 스캔면. 원판이라 "수평 한 겹" 으로 읽힌다 — 3D LiDAR 의 층 쌓임과 갈리는 지점 */}
      <mesh position={[0, 0.052, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.004, 32]} />
        {SCAN}
      </mesh>
    </group>
  )
}

export default function PlaceholderModel({ progress }) {
  const root = useRef(null)
  const carriage = useRef(null)
  const pallet = useRef(null)
  const rotors = useRef([])
  const wheels = useRef([])

  useFrame((state, delta) => {
    const p = progress.current

    // 내리고 -> 들어가고 -> 든다. 실제 포킹 순서와 같은 차례여야 한다.
    const lower = smoothstep(rangeProgress(p, 0.1, 0.2))
    const approach = smoothstep(rangeProgress(p, 0.2, 0.34))
    const raise = smoothstep(rangeProgress(p, 0.38, 0.56))
    // 팔레트는 포크가 들어간 뒤에야 캐리지를 따라 올라간다
    const carried = smoothstep(rangeProgress(p, 0.34, 0.4))

    const forkY = lerp(TRAVEL_LIFT, ENTRY_LIFT, lower) + raise * (MAX_LIFT - ENTRY_LIFT)

    if (root.current) root.current.position.z = lerp(VEHICLE_START_Z, 0, approach)
    if (carriage.current) carriage.current.position.y = 0.12 + forkY
    if (pallet.current) pallet.current.position.y = (forkY - ENTRY_LIFT) * carried

    // 바퀴는 이동 거리 / 반지름 만큼 구른다 (되감으면 반대로 돈다)
    const spin = (approach * VEHICLE_START_Z) / 0.3
    for (const w of wheels.current) {
      if (w) w.rotation.x = spin
    }

    // 2D LiDAR 내부 미러 — 정지 중에도 장비가 살아 있음을 보여준다
    for (const r of rotors.current) {
      if (r) r.rotation.y += delta * 2.6
    }
  })

  return (
    <group>
      {/* ---- 팔레트 + 화물 (바닥에 놓여 있다) ---- */}
      <group ref={pallet} position={[0, 0, PALLET_Z]}>
        {[-0.45, 0, 0.45].map((x) => (
          <mesh key={x} position={[x, 0.06, 0]} castShadow>
            <boxGeometry args={[0.16, 0.12, 1.0]} />
            {WOOD}
          </mesh>
        ))}
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.18, 0.08, 1.0]} />
          {WOOD}
        </mesh>
        <RoundedBox args={[0.86, 0.62, 0.78]} radius={0.04} smoothness={4} position={[0, 0.51, 0]} castShadow receiveShadow>
          {CARGO}
        </RoundedBox>
        {/* 비전 인식 마커 */}
        <mesh position={[0, 0.51, 0.4]}>
          <boxGeometry args={[0.22, 0.22, 0.01]} />
          {GLOW}
        </mesh>
      </group>

      {/* ---- 차량 ---- */}
      <group ref={root} position={[0, 0, VEHICLE_START_Z]}>
      {/* ---- 차체 ---- */}
      <RoundedBox args={[1.45, 0.75, 2.1]} radius={0.09} smoothness={4} position={[0, 0.72, -0.4]} castShadow receiveShadow>
        {BODY}
      </RoundedBox>
      {/* 측면 브랜드 스트라이프 */}
      {[0.74, -0.74].map((x) => (
        <mesh key={x} position={[x, 0.95, -0.4]}>
          <boxGeometry args={[0.02, 0.07, 1.5]} />
          {GLOW}
        </mesh>
      ))}

      {/* ---- 바퀴 ---- */}
      {WHEELS.map(([x, r, z], i) => (
        <mesh
          key={`${x}-${z}`}
          ref={(el) => {
            wheels.current[i] = el
          }}
          position={[x, r, z]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[r, r, 0.22, 24]} />
          {RUBBER}
        </mesh>
      ))}

      {/* ---- 운전석 캐노피 ---- */}
      {[
        [0.6, 0.1],
        [-0.6, 0.1],
        [0.6, -1.3],
        [-0.6, -1.3],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 1.62, z]} castShadow>
          <boxGeometry args={[0.07, 1.05, 0.07]} />
          {STEEL}
        </mesh>
      ))}
      <mesh position={[0, 2.16, -0.6]} castShadow>
        <boxGeometry args={[1.35, 0.07, 1.65]} />
        {STEEL}
      </mesh>

      {/* ---- 센서 (URDF 배치: 전면·후면 각각 ZED X + 그 위 2D LiDAR) ---- */}
      {/* 전면은 낮다 — 실물도 포크 사이 차체 하단에 붙는다 */}
      <ZedX position={[0, 0.45, 0.7]} facing={1} />
      <Lidar2D
        position={[0, 0.45 + SENSOR_GAP, 0.7]}
        rotorRef={(el) => {
          rotors.current[0] = el
        }}
      />
      {/* 후면은 높다 — 차체 뒤쪽 상단. 예전에 큰 검은 박스가 있던 자리다 */}
      <ZedX position={[0, 0.95, -1.47]} facing={-1} />
      <Lidar2D
        position={[0, 0.95 + SENSOR_GAP, -1.47]}
        rotorRef={(el) => {
          rotors.current[1] = el
        }}
      />

      {/* ---- 마스트 ---- */}
      {[0.42, -0.42].map((x) => (
        <mesh key={x} position={[x, 1.3, 0.72]} castShadow>
          <boxGeometry args={[0.13, 2.5, 0.13]} />
          {STEEL}
        </mesh>
      ))}
      <mesh position={[0, 2.5, 0.72]} castShadow>
        <boxGeometry args={[1.0, 0.1, 0.1]} />
        {STEEL}
      </mesh>

      {/* ---- 캐리지 + 포크 (스크롤로 상승) ---- */}
      <group ref={carriage} position={[0, 0.12, 0.78]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[0.95, 0.52, 0.08]} />
          {STEEL}
        </mesh>
        {[0.27, -0.27].map((x) => (
          <mesh key={x} position={[x, 0.03, 0.62]} castShadow receiveShadow>
            <boxGeometry args={[0.11, 0.07, 1.15]} />
            {STEEL}
          </mesh>
        ))}
      </group>
      </group>
    </group>
  )
}
