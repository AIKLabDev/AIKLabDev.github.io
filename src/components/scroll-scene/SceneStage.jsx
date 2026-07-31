import { ContactShadows, Environment, Grid, Lightformer } from '@react-three/drei'

/**
 * 조명·환경·바닥.
 *
 * 외부 CDN 에셋(Environment preset 의 HDRI 등)을 쓰지 않는다 —
 * 히어로가 서드파티 네트워크에 묶이면 첫 화면이 남의 가용성에 좌우된다.
 * 대신 Lightformer 로 환경맵을 그 자리에서 만든다. metalness 가 있는 재질은
 * 반사할 환경이 없으면 거의 검게 렌더되므로 이 환경맵이 필수다.
 *
 * @param {boolean} compact 좁은 화면 — 그림자/해상도 비용을 덜어낸다
 */
export default function SceneStage({ compact = false }) {
  return (
    <>
      <color attach="background" args={['#05101f']} />
      <fog attach="fog" args={['#05101f', 14, 38]} />

      {/* 절차적 환경맵 — 금속 반사와 전체 톤을 만든다 (frames={1}: 한 번만 굽는다) */}
      <Environment resolution={compact ? 128 : 256} frames={1}>
        <color attach="background" args={['#0a1628']} />
        {/* 상단 대형 소프트박스 */}
        <Lightformer form="rect" intensity={3.2} color="#dbe7ff" scale={[14, 8, 1]} position={[0, 8, 2]} rotation={[-Math.PI / 2, 0, 0]} />
        {/* 브랜드 컬러 측면 반사 */}
        <Lightformer form="circle" intensity={2.6} color="#38bdf8" scale={7} position={[-8, 3, 3]} />
        <Lightformer form="rect" intensity={2.0} color="#2f63ea" scale={[10, 5, 1]} position={[7, 2, -5]} rotation={[0, -Math.PI / 3, 0]} />
        {/* 바닥 반사 */}
        <Lightformer form="rect" intensity={0.8} color="#163561" scale={[14, 14, 1]} position={[0, -3, 0]} rotation={[Math.PI / 2, 0, 0]} />
      </Environment>

      <ambientLight intensity={0.85} />
      <hemisphereLight args={['#bcd2ff', '#05101f', 1.1]} />

      {/* 키 라이트 — 그림자 담당 */}
      <directionalLight
        position={[5.5, 8, 4]}
        intensity={3.2}
        castShadow={!compact}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={26}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0004}
      />
      {/* 정면 필 — 카메라가 어디로 가든 형태가 뭉개지지 않게 */}
      <directionalLight position={[0, 3, 9]} intensity={1.1} color="#dbe7ff" />
      {/* 림라이트 — 로고 팔레트(accent-400 / brand-500) */}
      <directionalLight position={[-6, 2.5, -4]} intensity={2.2} color="#38bdf8" />
      <directionalLight position={[3, 1.2, -6]} intensity={1.3} color="#2f63ea" />

      <Grid
        position={[0, 0.001, 0]}
        args={[40, 40]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor="#1d4785"
        sectionSize={3}
        sectionThickness={1.2}
        sectionColor="#3f74f0"
        fadeDistance={compact ? 26 : 36}
        fadeStrength={1.2}
        infiniteGrid
        followCamera={false}
      />

      {!compact && (
        <ContactShadows position={[0, 0.002, 0]} opacity={0.6} scale={16} blur={2.4} far={6} resolution={512} />
      )}
    </>
  )
}
