import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { lerp, rangeProgress, smoothstep } from '../../lib/math'

const BODY = <meshStandardMaterial color="#14356e" metalness={0.4} roughness={0.45} />
const STEEL = <meshStandardMaterial color="#8fa3bd" metalness={0.85} roughness={0.3} />
const SENSOR = <meshStandardMaterial color="#54657f" metalness={0.6} roughness={0.32} />
const RUBBER = <meshStandardMaterial color="#2a3542" metalness={0.15} roughness={0.72} />
const CARGO = <meshStandardMaterial color="#3b4a5f" metalness={0.1} roughness={0.7} />
const WOOD = <meshStandardMaterial color="#55647c" metalness={0.05} roughness={0.85} />
const GLOW = <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.8} toneMapped={false} />
const SENSOR_GLOW = <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.75} />
const SCAN = <meshBasicMaterial color="#38bdf8" transparent opacity={0.09} toneMapped={false} depthWrite={false} />

const WHEELS = [
  [0.66, 0.3, 0.5],
  [-0.66, 0.3, 0.5],
  [0.62, 0.28, -1.15],
  [-0.62, 0.28, -1.15],
]

// 센서 배치 근거: amr-forklift-urdf 의 forklift_static_sensors_wheels.urdf
const SENSOR_GAP = 0.17

const PALLET_Z = 1.55
const VEHICLE_START_Z = -1.5
const MAX_LIFT = 1.45
const TRAVEL_LIFT = 0.6
const ENTRY_LIFT = 0.02

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

function Lidar2D({ position, rotorRef }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.07, 20]} />
        {SENSOR}
      </mesh>
      <group ref={rotorRef} position={[0, 0.052, 0]}>
        <mesh position={[0, 0, 0.045]}>
          <boxGeometry args={[0.07, 0.03, 0.03]} />
          {SENSOR_GLOW}
        </mesh>
      </group>
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

    const lower = smoothstep(rangeProgress(p, 0.1, 0.2))
    const approach = smoothstep(rangeProgress(p, 0.2, 0.34))
    const raise = smoothstep(rangeProgress(p, 0.38, 0.56))
    const carried = smoothstep(rangeProgress(p, 0.34, 0.4))

    const forkY = lerp(TRAVEL_LIFT, ENTRY_LIFT, lower) + raise * (MAX_LIFT - ENTRY_LIFT)

    if (root.current) root.current.position.z = lerp(VEHICLE_START_Z, 0, approach)
    if (carriage.current) carriage.current.position.y = 0.12 + forkY
    if (pallet.current) pallet.current.position.y = (forkY - ENTRY_LIFT) * carried

    const spin = (approach * VEHICLE_START_Z) / 0.3
    for (const w of wheels.current) {
      if (w) w.rotation.x = spin
    }

    for (const r of rotors.current) {
      if (r) r.rotation.y += delta * 2.6
    }
  })

  return (
    <group>
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
        <mesh position={[0, 0.51, 0.4]}>
          <boxGeometry args={[0.22, 0.22, 0.01]} />
          {GLOW}
        </mesh>
      </group>

      <group ref={root} position={[0, 0, VEHICLE_START_Z]}>
      <RoundedBox args={[1.45, 0.75, 2.1]} radius={0.09} smoothness={4} position={[0, 0.72, -0.4]} castShadow receiveShadow>
        {BODY}
      </RoundedBox>
      {[0.74, -0.74].map((x) => (
        <mesh key={x} position={[x, 0.95, -0.4]}>
          <boxGeometry args={[0.02, 0.07, 1.5]} />
          {GLOW}
        </mesh>
      ))}

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

      <ZedX position={[0, 0.45, 0.7]} facing={1} />
      <Lidar2D
        position={[0, 0.45 + SENSOR_GAP, 0.7]}
        rotorRef={(el) => {
          rotors.current[0] = el
        }}
      />
      <ZedX position={[0, 0.95, -1.47]} facing={-1} />
      <Lidar2D
        position={[0, 0.95 + SENSOR_GAP, -1.47]}
        rotorRef={(el) => {
          rotors.current[1] = el
        }}
      />

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
