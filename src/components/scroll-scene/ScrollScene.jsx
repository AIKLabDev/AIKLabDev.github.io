import { AdaptiveDpr, PerformanceMonitor, Preload } from '@react-three/drei'
import { Canvas, invalidate } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import { sceneConfig, scrollModel, scrollSections } from '../../data/scrollScene'
import { useIsCompact, useReducedMotion } from '../../hooks/useMediaQuery'
import { useScrollProgress } from '../../hooks/useScrollProgress'
import { isWebGLAvailable } from '../../lib/webgl'
import Hero from '../Hero'
import CameraRig from './CameraRig'
import { firstKeyframe } from './cameraPath'
import PlaceholderModel from './PlaceholderModel'
import SceneLoader from './SceneLoader'
import SceneModel from './SceneModel'
import SceneOverlay from './SceneOverlay'
import SceneStage from './SceneStage'

/**
 * 스크롤 연동 3D 히어로.
 *
 * 구조: 높이만 가진 바깥 섹션(N × vhPerSection) + 그 안에 sticky 캔버스.
 * 페이지 스크롤을 그대로 쓰기 때문에 sticky 헤더, 해시 앵커(/#about),
 * 라우팅이 전부 평소대로 동작한다. (drei ScrollControls 를 쓰지 않는 이유)
 *
 * 장면 내용은 src/data/scrollScene.js 가 정본이다.
 */

// 모델 경로는 런타임에 바뀌지 않으므로 모듈 수준에서 한 번만 고른다 (훅 순서 안전)
const Subject = scrollModel.path ? SceneModel : PlaceholderModel

export default function ScrollScene() {
  const reduced = useReducedMotion()
  const [webgl] = useState(isWebGLAvailable)

  // 모션 저감 사용자 / WebGL 미지원 → 기존 정적 히어로를 그대로 재사용한다.
  // 3D 훅이 아예 실행되지 않도록 캔버스는 별도 컴포넌트로 갈라 둔다.
  if (reduced || !webgl) return <Hero />

  return <ScrollCanvas />
}

function ScrollCanvas() {
  const outer = useRef(null)
  const sticky = useRef(null)
  const compact = useIsCompact()
  const { progress, subscribe } = useScrollProgress(outer, sticky)

  // 히어로가 화면 밖으로 나가면 렌더 루프를 멈춘다 —
  // 아래 섹션들을 읽는 동안 GPU 를 계속 태울 이유가 없다.
  // rootMargin 을 넉넉히 주는 것은 안전장치다: 경계에서 아슬아슬하게 판정되면
  // 히어로가 보이는데도 frameloop 이 'never' 로 얼어붙는다(실제로 겪었다).
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = sticky.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '300px',
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // frameloop 이 'never' 인 동안에도 스크롤이 오면 한 프레임은 그리게 한다.
  // 진행률은 ref 로만 흐르므로 React 리렌더가 없어 R3F 가 스스로 다시 그릴 계기가 없다.
  useEffect(() => subscribe(() => invalidate()), [subscribe])

  return (
    <section
      ref={outer}
      className="relative isolate bg-ink-950"
      style={{ height: `${scrollSections.length * sceneConfig.vhPerSection}svh` }}
    >
      <div ref={sticky} className="sticky top-0 h-svh w-full overflow-hidden">
        {/* 첫 프레임 전까지는 캔버스가 비어 있지만, 섹션 배경이 ink-950 이라
            아직 안 그려진 상태가 그대로 어두운 히어로로 보인다 — 별도 페이드가 필요 없다. */}
        <Canvas
          frameloop={inView ? 'always' : 'never'}
          shadows={!compact}
          dpr={[1, compact ? 1.25 : 1.75]}
          performance={{ min: 0.5 }}
          gl={{ antialias: !compact, powerPreference: 'high-performance' }}
          camera={{ fov: firstKeyframe.fov, near: 0.1, far: 120, position: firstKeyframe.position }}
        >
          <PerformanceMonitor />
          <AdaptiveDpr pixelated />
          <Suspense fallback={null}>
            <SceneStage compact={compact} />
            <Subject progress={progress} />
            <Preload all />
          </Suspense>
          <CameraRig progress={progress} compact={compact} />
        </Canvas>

        {/* 텍스트 가독성용 그라데이션 — 3D 위에 얹는다 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/5 to-ink-950/85"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,16,31,0.7)_100%)]"
        />

        <SceneOverlay subscribe={subscribe} />
        <SceneLoader />
      </div>
    </section>
  )
}
