import { ContactShadows, Environment, Grid, Lightformer } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { sceneConfig } from '../../data/scrollScene'
import { getGroundFlow, setGroundPeriod } from '../../lib/groundFlow'

setGroundPeriod(sceneConfig.lighting.grid.cellSize, sceneConfig.lighting.grid.sectionSize)

export default function SceneStage({ compact = false }) {
  const L = sceneConfig.lighting
  const env = L.environment
  const g = L.grid
  const k = L.key

  return (
    <>
      <color attach="background" args={[L.background]} />
      <fog attach="fog" args={[L.fog.color, L.fog.near, L.fog.far]} />

      <Environment resolution={compact ? env.compactResolution : env.resolution} frames={1}>
        <color attach="background" args={[env.background]} />
        {env.lightformers.map((lf, i) => (
          <Lightformer
            key={i}
            form={lf.form}
            intensity={lf.intensity}
            color={lf.color}
            scale={lf.scale}
            position={lf.position}
            rotation={lf.rotation}
          />
        ))}
      </Environment>

      <ambientLight intensity={L.ambient} />
      <hemisphereLight args={[L.hemisphere.sky, L.hemisphere.ground, L.hemisphere.intensity]} />

      <directionalLight
        position={k.position}
        intensity={k.intensity}
        castShadow={!compact}
        shadow-mapSize={[k.shadowMapSize, k.shadowMapSize]}
        shadow-camera-near={k.shadowNear}
        shadow-camera-far={k.shadowFar}
        shadow-camera-left={-k.shadowRadius}
        shadow-camera-right={k.shadowRadius}
        shadow-camera-top={k.shadowRadius}
        shadow-camera-bottom={-k.shadowRadius}
        shadow-bias={k.shadowBias}
      />
      {!compact && (
        <ContactShadows
          position={[0, 0.002, 0]}
          opacity={L.contactShadows.opacity}
          scale={L.contactShadows.scale}
          blur={L.contactShadows.blur}
          far={L.contactShadows.far}
          resolution={L.contactShadows.resolution}
        />
      )}

      <directionalLight position={L.fill.position} intensity={L.fill.intensity} color={L.fill.color} />

      {L.rims.map((r, i) => (
        <directionalLight key={i} position={r.position} intensity={r.intensity} color={r.color} />
      ))}

      <FlowingGrid
        position={[0, 0.001, 0]}
        args={[40, 40]}
        cellSize={g.cellSize}
        cellThickness={g.cellThickness}
        cellColor={g.cellColor}
        sectionSize={g.sectionSize}
        sectionThickness={g.sectionThickness}
        sectionColor={g.sectionColor}
        fadeDistance={compact ? g.compactFadeDistance : g.fadeDistance}
        fadeStrength={g.fadeStrength}
        infiniteGrid
        followCamera={false}
      />

    </>
  )
}

/**
 * 바닥 격자. 트레드밀 무대에서는 지게차 대신 이쪽이 흐른다.
 *
 * 격자는 주기적이라 **한 주기의 정수배만큼 옮기면 옮기기 전과 완전히 같다.**
 * 그래서 흐른 거리를 주기로 나눈 나머지만 위치에 넣으면 되고, 아무리 오래
 * 흘려도 정밀도가 무너지거나 이음매가 생기지 않는다.
 */
function FlowingGrid(props) {
  const grid = useRef(null)

  useFrame(() => {
    if (grid.current) grid.current.position.x = -getGroundFlow()
  })

  return <Grid ref={grid} {...props} />
}
