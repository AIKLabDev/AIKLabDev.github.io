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
 *   0.16~0.30  주행: 차량이 팔레트 쪽으로 전진하며 바퀴가 구른다
 *   0.32~0.52  적재: 캐리지 상승 + 팔레트가 함께 올라감
 * LiDAR 로터만 예외로 시간 기반 — 정지 중에도 장비가 살아 있음을 보여준다.
 */

const BODY = <meshStandardMaterial color="#14356e" metalness={0.4} roughness={0.45} />
const STEEL = <meshStandardMaterial color="#8fa3bd" metalness={0.85} roughness={0.3} />
const DARK = <meshStandardMaterial color="#0a1628" metalness={0.25} roughness={0.7} />
// 타이어. 배경(ink-950 = #05101f)과 같은 색이면 실루엣이 통째로 사라진다 —
// 실제로 그랬다. 어두운 고무로 읽히면서 배경에서는 떨어지는 값이어야 하고,
// roughness 를 조금 낮춰 환경광이 위쪽 모서리에 걸리게 해야 형태가 보인다.
const RUBBER = <meshStandardMaterial color="#2a3542" metalness={0.15} roughness={0.72} />
const CARGO = <meshStandardMaterial color="#3b4a5f" metalness={0.1} roughness={0.7} />
const WOOD = <meshStandardMaterial color="#55647c" metalness={0.05} roughness={0.85} />
const GLOW = <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.8} toneMapped={false} />
const BEAM = <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} toneMapped={false} />

const WHEELS = [
  [0.66, 0.3, 0.5],
  [-0.66, 0.3, 0.5],
  [0.62, 0.28, -1.15],
  [-0.62, 0.28, -1.15],
]

/** 팔레트는 제자리에 놓여 있고 차량이 다가간다 (실제 도킹과 같은 방향) */
const PALLET_Z = 1.55
const VEHICLE_START_Z = -1.5
const MAX_LIFT = 1.45

export default function PlaceholderModel({ progress }) {
  const root = useRef(null)
  const carriage = useRef(null)
  const pallet = useRef(null)
  const rotor = useRef(null)
  const wheels = useRef([])

  useFrame((state, delta) => {
    const p = progress.current

    const approach = smoothstep(rangeProgress(p, 0.16, 0.3))
    const lift = smoothstep(rangeProgress(p, 0.32, 0.52)) * MAX_LIFT
    // 팔레트는 도킹이 끝난 뒤에야 캐리지를 따라 올라간다
    const carried = smoothstep(rangeProgress(p, 0.3, 0.34))

    if (root.current) root.current.position.z = lerp(VEHICLE_START_Z, 0, approach)
    if (carriage.current) carriage.current.position.y = 0.12 + lift
    if (pallet.current) pallet.current.position.y = lift * carried

    // 바퀴는 이동 거리 / 반지름 만큼 구른다 (되감으면 반대로 돈다)
    const spin = (-approach * -VEHICLE_START_Z) / 0.3
    for (const w of wheels.current) {
      if (w) w.rotation.x = spin
    }

    if (rotor.current) rotor.current.rotation.y += delta * 2.6
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
      <mesh position={[0, 0.62, -1.58]} castShadow receiveShadow>
        <boxGeometry args={[1.25, 0.6, 0.45]} />
        {DARK}
      </mesh>
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

      {/* ---- LiDAR ---- */}
      <group position={[0, 2.24, -0.6]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.13, 0.1, 20]} />
          {DARK}
        </mesh>
        <group ref={rotor} position={[0, 0.11, 0]}>
          <mesh>
            <cylinderGeometry args={[0.11, 0.11, 0.1, 20]} />
            {GLOW}
          </mesh>
          {/* 스캔 빔 — 회전하는 LiDAR 를 암시만 한다 */}
          <mesh position={[0, 0, 0.6]}>
            <boxGeometry args={[0.01, 0.01, 1.2]} />
            {BEAM}
          </mesh>
        </group>
      </group>

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
