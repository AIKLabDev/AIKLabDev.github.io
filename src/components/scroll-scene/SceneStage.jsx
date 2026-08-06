import { ContactShadows, Environment, Grid, Lightformer } from '@react-three/drei'
import { sceneConfig } from '../../data/scrollScene'

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

      <directionalLight position={L.fill.position} intensity={L.fill.intensity} color={L.fill.color} />

      {L.rims.map((r, i) => (
        <directionalLight key={i} position={r.position} intensity={r.intensity} color={r.color} />
      ))}

      <Grid
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
    </>
  )
}
