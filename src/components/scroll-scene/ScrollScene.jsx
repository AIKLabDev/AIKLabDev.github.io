import { AdaptiveDpr, PerformanceMonitor, Preload } from '@react-three/drei'
import { Canvas, invalidate, useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ASSIGNED_VARIANTS,
  DEFAULT_VARIANT,
  EXPERIMENT_ID,
  VARIANT_PARAM,
  VARIANT_STORAGE_KEY,
  heroVariants,
  sceneConfig,
  scrollModel,
} from '../../data/scrollScene'
import { useIsCompact, useReducedMotion } from '../../hooks/useMediaQuery'
import { mixHex } from '../../lib/color'
import { setHeroReveal } from '../../lib/heroChrome'
import { clamp } from '../../lib/math'
import { readLastScroll, writeLastScroll } from '../../lib/lastScroll'
import { useScrollProgress } from '../../hooks/useScrollProgress'
import { useSectionSnap } from '../../hooks/useSectionSnap'
import { reportExposure, resolveVariant } from '../../lib/abTest'
import { isWebGLAvailable } from '../../lib/webgl'
import Hero from '../Hero'
import CameraRig from './CameraRig'
import PlaceholderModel from './PlaceholderModel'
import SceneLoader from './SceneLoader'
import SceneModel from './SceneModel'
import SceneOverlay from './SceneOverlay'
import SceneProgress from './SceneProgress'
import SceneStage from './SceneStage'
import { cameraPath, sections, totalVh } from './sectionPlan'

/**
 * 스크롤 연동 3D 히어로.
 *
 * 구조: 높이만 가진 바깥 섹션 + 그 안에 sticky 캔버스.
 * 페이지 스크롤을 그대로 쓰기 때문에 sticky 헤더, 해시 앵커(/#about),
 * 라우팅이 전부 평소대로 동작한다. (drei ScrollControls 를 쓰지 않는 이유)
 *
 * 장면 내용은 src/data/scrollScene.js 가 정본이고, A/B 변형은 heroVariants 가
 * 정의한다. ?hero=flow / ?hero=snap 으로 강제 지정할 수 있다(선택은 저장되어 유지된다).
 */

// 모델 경로는 런타임에 바뀌지 않으므로 모듈 수준에서 한 번만 고른다 (훅 순서 안전)
const Subject = scrollModel.path ? SceneModel : PlaceholderModel
const VARIANT_KEYS = Object.keys(heroVariants)

export default function ScrollScene() {
  const reduced = useReducedMotion()
  const [webgl] = useState(isWebGLAvailable)
  const fallback = reduced || !webgl

  /**
   * 정적 히어로에는 3D 서사가 없으니 헤더를 평소대로 되돌린다.
   * 헤더의 초기값은 "히어로 경로면 감춤" 이라, 그대로 두면 메뉴가 계속 감춰져 있다.
   * 페인트 전에 돌려놔야 반대 방향 번쩍임이 생기지 않는다.
   */
  useLayoutEffect(() => {
    if (fallback) setHeroReveal(1)
  }, [fallback])

  // 모션 저감 사용자 / WebGL 미지원 → 기존 정적 히어로를 그대로 재사용한다.
  // 3D 훅이 아예 실행되지 않도록 캔버스는 별도 컴포넌트로 갈라 둔다.
  // 이 사용자들은 실험 대상이 아니므로 변형 배정도, 노출 보고도 하지 않는다.
  if (fallback) return <Hero />

  return <ScrollCanvas />
}

/**
 * 첫 프레임이 실제로 그려진 시점을 알린다.
 * 셰이더 컴파일과 환경맵 굽기 때문에 마운트와 첫 렌더 사이에 눈에 띄는 간격이 있고,
 * 로딩 화면은 그 간격을 덮으려고 있는 것이므로 이 신호가 있어야 의미가 있다.
 */
function FirstFrame({ onReady }) {
  const fired = useRef(false)
  useFrame(() => {
    if (fired.current) return
    fired.current = true
    onReady()
  })
  return null
}

function ScrollCanvas() {
  const outer = useRef(null)
  const sticky = useRef(null)
  const compact = useIsCompact()
  const [firstFrame, setFirstFrame] = useState(false)
  const { progress, subscribe } = useScrollProgress(outer, sticky)

  /**
   * 로딩 화면을 띄울지 마운트 시점에 한 번 정한다.
   *
   * 히어로에서 한참 아래, 실제 콘텐츠를 읽던 사람에게는 띄우지 않는다 —
   * 3D 를 기다리는 중이 아니라 이미 지나온 사람인데, 로딩 화면이 스크롤까지
   * 잠그면 페이지가 고장난 것으로 보인다.
   *
   * 여기서 window.scrollY 를 읽으면 안 된다. 브라우저의 스크롤 복원은 마운트
   * 뒤에 일어나므로 이 시점 값은 새로고침이어도 항상 0 이다(실제로 이걸로
   * 한 번 틀렸다). 그래서 떠날 때 위치를 우리가 적어두고 그걸 본다.
   *
   * 해시를 달고 들어온 경우(/#about 등)도 마찬가지다 — 히어로를 건너뛰겠다고
   * 지목해서 들어온 사람이다. HashScroll 이 그 위치로 옮기는 것과 로딩 화면이
   * 스크롤을 잠그는 것이 부딪히기도 한다.
   */
  const [showLoader] = useState(() => !window.location.hash && readLastScroll() < window.innerHeight * 0.5)

  /**
   * 페이지를 떠날 때 위치를 적어두고, 캔버스를 감춘다.
   *
   * 캔버스를 감추는 쪽은 새로고침 순간 흰 화면이 번쩍이는 것 때문이다.
   * 아직 로딩 중일 때 새로고침하면 번쩍이지 않고 로딩이 끝난 뒤에만 번쩍이는데,
   * 그 차이가 곧 "살아 있는 WebGL 캔버스가 있느냐" 다. 컨텍스트가 정리될 때
   * 합성기에 남는 빈 레이어로 보인다.
   *
   * 감추면 바로 아래 어두운 층(chrome 의 bg-ink-950)이 드러난다.
   * 다만 브라우저가 pagehide 뒤에 한 프레임을 더 그려준다는 보장은 없어서,
   * 이것만으로 확실히 사라진다고 말할 수는 없다.
   *
   * 뒤로가기로 되살아날 때(BFCache)를 위해 pageshow 에서 되돌린다 —
   * 안 되돌리면 캔버스가 감춰진 채로 복원된다.
   */
  useEffect(() => {
    const canvasStyle = (visibility) => {
      const canvas = sticky.current?.querySelector('canvas')
      if (canvas) canvas.style.visibility = visibility
    }
    const onHide = () => {
      writeLastScroll(window.scrollY)
      canvasStyle('hidden')
    }
    const onShow = () => canvasStyle('')
    window.addEventListener('pagehide', onHide)
    window.addEventListener('pageshow', onShow)
    return () => {
      writeLastScroll(window.scrollY)
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('pageshow', onShow)
    }
  }, [])

  // 변형은 마운트 때 한 번만 정한다. 도중에 바뀌면 스크롤 높이가 달라져
  // 보고 있던 위치가 튄다.
  const [assignment] = useState(() =>
    resolveVariant(VARIANT_KEYS, {
      param: VARIANT_PARAM,
      storageKey: VARIANT_STORAGE_KEY,
      defaultKey: DEFAULT_VARIANT,
      pool: ASSIGNED_VARIANTS,
    }),
  )
  const variantKey = assignment.variant
  const variant = heroVariants[variantKey] ?? heroVariants[DEFAULT_VARIANT]

  // 휠·키·스와이프 한 번에 한 섹션씩 (변형 snap 에서만).
  // 진행률을 실제 문서 스크롤에서 읽는 구조라 스크롤 위치만 옮기면
  // 카메라와 텍스트는 알아서 따라온다 — 별도 배선이 없다.
  useSectionSnap({ enabled: variant.snap, outerRef: outer, stickyRef: sticky, sections })

  // 3D 가 실제로 렌더되는 사용자만 실험에 넣는다.
  // ref 로 한 번만 쏜다 — StrictMode 는 개발 중 effect 를 두 번 실행하고,
  // 노출이 두 번 집계되면 실험 수치가 그대로 망가진다.
  const reported = useRef(false)
  useEffect(() => {
    if (reported.current) return
    reported.current = true
    reportExposure(EXPERIMENT_ID, variantKey, { source: assignment.source })
  }, [variantKey, assignment.source])

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

  /**
   * 마지막 전환에서 3D 를 걷어낸다.
   *
   * 장면을 켜둔 채로 다음 콘텐츠가 이어지면 서사가 끊긴 자리가 그대로 드러난다.
   * 07 -> 08 구간에서 캔버스를 지우면 마지막 섹션은 텍스트+CTA 카드만 남고,
   * 페이지가 이어질 때 버려지는 것이 없어 이음매가 보이지 않는다.
   *
   * CSS transition 을 쓰지 않고 스크롤 값에서 직접 계산한다 — 되감을 때도
   * 정확히 대칭이어야 하고, transition 은 스크롤을 따라오지 못한다.
   */
  const chrome = useRef(null) // 캔버스 + 그라데이션 + 진행표시 — 함께 걷힌다
  useEffect(
    () =>
      subscribe((p) => {
        // frameloop 이 'never' 인 동안에도 스크롤이 오면 한 프레임은 그리게 한다.
        // 진행률은 ref 로만 흐르므로 React 리렌더가 없어 R3F 가 다시 그릴 계기가 없다.
        invalidate()

        const { from, to, background } = sceneConfig.outro
        const t = clamp((p - from) / (to - from), 0, 1)

        if (chrome.current) chrome.current.style.opacity = 1 - t
        // 배경은 다음 섹션 색으로 옮긴다. 여기가 이음매를 없애는 핵심이다.
        if (outer.current) outer.current.style.backgroundColor = mixHex(background[0], background[1], t)

        // 헤더도 같은 타이밍에 3D 위의 최소 상태에서 평범한 웹페이지 헤더로 돌아온다.
        // 배경이 흰색이 되는 순간과 메뉴가 나타나는 순간을 맞춰야 "3D 에서 페이지로
        // 넘어왔다" 로 읽힌다. 따로 놀면 그냥 메뉴가 튀어나온 것으로 보인다.
        setHeroReveal(t)
      }),
    [subscribe],
  )

  // 라우트가 바뀌어 히어로가 사라지면 헤더를 원래대로 돌려놓는다
  useEffect(() => () => setHeroReveal(1), [])

  return (
    <section
      ref={outer}
      data-hero-variant={variantKey}
      /*
       * -mt 로 헤더 밑까지 끌어올린다.
       * 헤더는 sticky 라 문서 흐름에서 자리를 차지하는데, 히어로 위에서는 헤더를
       * 투명하게 만들기 때문에 그대로 두면 최상단에서 투명 헤더 뒤로 페이지 배경
       * (거의 흰색)이 비친다. 히어로가 헤더 밑에서 시작해야 3D 가 화면 맨 위까지
       * 이어진다. 헤더 높이(h-16 / lg:h-20)와 짝이므로 한쪽을 바꾸면 같이 바꿔야 한다.
       */
      className="relative isolate -mt-16 bg-ink-950 lg:-mt-20"
      style={{ height: `${totalVh}svh` }}
    >
      <div ref={sticky} className="sticky top-0 h-svh w-full overflow-hidden">
        {/* 첫 프레임 전까지는 캔버스가 비어 있지만, 섹션 배경이 ink-950 이라
            아직 안 그려진 상태가 그대로 어두운 히어로로 보인다 — 별도 페이드가 필요 없다. */}
        {/*
          bg-ink-950 은 방어용이다. 아래 그라데이션들은 어두운 반투명이라 뒤가
          비치는 구조라서, 캔버스가 그려지지 않는 프레임에 뒤가 밝으면 "가운데가
          흰 방사형" 으로 번쩍인다. 여기에 불투명한 어두운 바탕을 깔면 적어도
          섹션 배경 쪽에서 오는 밝음은 막힌다.
          단, 새로고침 때 실제로 본 번쩍임은 이걸로 사라지지 않았다. 장면이
          <color attach="background"> 를 갖고 있어 캔버스 자체가 불투명하므로,
          흰색은 이 레이어보다 위 — 캔버스 레이어에서 온다는 뜻이다.
        */}
        <div ref={chrome} className="absolute inset-0 bg-ink-950">
          <Canvas
            frameloop={inView ? 'always' : 'never'}
            shadows={!compact}
            dpr={[1, compact ? 1.25 : 1.75]}
            performance={{ min: 0.5 }}
            gl={{ antialias: !compact, powerPreference: 'high-performance' }}
            camera={{
              fov: cameraPath.firstKeyframe.fov,
              near: 0.1,
              far: 120,
              position: cameraPath.firstKeyframe.position,
            }}
          >
            <PerformanceMonitor />
            <AdaptiveDpr pixelated />
            <Suspense fallback={null}>
              <SceneStage compact={compact} />
              <Subject progress={progress} sections={sections} />
              <Preload all />
            </Suspense>
            <CameraRig progress={progress} path={cameraPath} compact={compact} />
            <FirstFrame onReady={() => setFirstFrame(true)} />
          </Canvas>

          {/* 텍스트 가독성용 그라데이션 — 3D 위에 얹는다.
              어두운 그라데이션이라 배경이 흰색으로 바뀔 때 같이 걷혀야 한다. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/5 to-ink-950/85"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,16,31,0.7)_100%)]"
          />

          {/* 진행표시도 흰 글씨라 함께 걷는다. 마지막 단계에서는 역할도 끝났다. */}
          <SceneProgress subscribe={subscribe} sections={sections} />
        </div>

        <SceneOverlay subscribe={subscribe} sections={sections} showSectionActions />
        {showLoader && <SceneLoader ready={firstFrame} />}
      </div>
    </section>
  )
}
