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
} from '../../data/scrollScene'
import { useIsCompact, useReducedMotion } from '../../hooks/useMediaQuery'
import { mixHex } from '../../lib/color'
import { setHeroReveal } from '../../lib/heroChrome'
import { clamp } from '../../lib/math'
import { handleAnchorClick } from '../../lib/anchorScroll'
import { readLastScroll, writeLastScroll } from '../../lib/lastScroll'
import { useScrollProgress } from '../../hooks/useScrollProgress'
import { useSectionSnap } from '../../hooks/useSectionSnap'
import { reportExposure, resolveVariant } from '../../lib/abTest'
import { isWebGLAvailable } from '../../lib/webgl'
import Hero from '../Hero'
import CameraRig from './CameraRig'
import HeroScene from './HeroScene'
import SceneLoader from './SceneLoader'
import SceneOverlay from './SceneOverlay'
import SceneProgress from './SceneProgress'
import SceneStage from './SceneStage'
import { cameraPath, sectionBlend, sections, totalVh } from './sectionPlan'

const VARIANT_KEYS = Object.keys(heroVariants)

export default function ScrollScene() {
  const reduced = useReducedMotion()
  const [webgl] = useState(isWebGLAvailable)
  const fallback = reduced || !webgl

  useLayoutEffect(() => {
    if (fallback) setHeroReveal(1)
  }, [fallback])

  if (fallback) return <Hero />

  return <ScrollCanvas />
}

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

  const [showLoader] = useState(() => !window.location.hash && readLastScroll() < window.innerHeight * 0.5)

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

  useSectionSnap({ enabled: variant.snap, outerRef: outer, stickyRef: sticky, sections })

  const reported = useRef(false)
  useEffect(() => {
    if (reported.current) return
    reported.current = true
    reportExposure(EXPERIMENT_ID, variantKey, { source: assignment.source })
  }, [variantKey, assignment.source])

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

  const chrome = useRef(null)
  useEffect(
    () =>
      subscribe((p) => {
        invalidate()

        const { from, to, background } = sceneConfig.outro
        const t = clamp((p - from) / (to - from), 0, 1)

        if (chrome.current) chrome.current.style.opacity = 1 - t
        if (outer.current) outer.current.style.backgroundColor = mixHex(background[0], background[1], t)

        setHeroReveal(t)
      }),
    [subscribe],
  )

  useEffect(() => () => setHeroReveal(1), [])

  return (
    <section
      ref={outer}
      data-hero-variant={variantKey}
      className="relative isolate -mt-16 bg-ink-950 lg:-mt-20"
      style={{ height: `${totalVh}svh` }}
      onClick={handleAnchorClick}
    >
      <div ref={sticky} className="sticky top-0 h-svh w-full overflow-hidden">
        <div ref={chrome} className="absolute inset-0 bg-ink-950">
          <Canvas
            frameloop={inView ? 'always' : 'never'}
            shadows={compact ? false : 'percentage'}
            dpr={[1, compact ? 1.25 : 1.75]}
            performance={{ min: 0.5 }}
            gl={{ antialias: !compact, powerPreference: 'high-performance' }}
            camera={{
              fov: cameraPath.firstKeyframe.fov,
              near: 0.1,
              far: 220,
              position: cameraPath.firstKeyframe.position,
            }}
          >
            <PerformanceMonitor />
            <AdaptiveDpr pixelated />
            <SceneStage compact={compact} />
            <Suspense fallback={null}>
              <HeroScene progress={progress} blend={sectionBlend} sections={sections} compact={compact} />
              <Preload all />
            </Suspense>
            <CameraRig progress={progress} path={cameraPath} compact={compact} />
            <FirstFrame onReady={() => setFirstFrame(true)} />
          </Canvas>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/18 via-transparent to-ink-950/24"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_66%,rgba(5,16,31,0.12)_100%)]"
          />

          <SceneProgress subscribe={subscribe} sections={sections} />
        </div>

        <SceneOverlay subscribe={subscribe} sections={sections} showSectionActions />
        {showLoader && <SceneLoader ready={firstFrame} />}
      </div>
    </section>
  )
}
