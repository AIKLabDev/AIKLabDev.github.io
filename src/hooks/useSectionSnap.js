import { useEffect, useRef } from 'react'
import { sceneConfig } from '../data/scrollScene'
import { tune } from '../lib/devTuning'
import { recentAnchorJump } from '../lib/anchorScroll'
import { isWheelContinuation } from '../lib/gesture'
import { clamp } from '../lib/math'

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const isTypingTarget = (el) =>
  !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName ?? ''))

const ABORT_GRACE_MS = 180

export function useSectionSnap({ enabled, outerRef, stickyRef, sections }) {
  const animating = useRef(false)
  const cooldownUntil = useRef(0)
  const cooldownHardUntil = useRef(0)
  const lastInputAt = useRef(0)
  const rafId = useRef(0)
  const hardLockUntil = useRef(0)
  const hardLockTimer = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const outer = outerRef.current
    if (!outer) return

    const duration = tune('snapDuration', sceneConfig.snap.duration)
    const quietMs = tune('snapQuiet', sceneConfig.snap.quietMs)
    const maxQuietMs = tune('snapMaxQuiet', sceneConfig.snap.maxQuietMs)
    const reentryMs = tune('snapReentry', sceneConfig.snap.reentryMs)
    const continuationGapMs = tune('snapContinuation', sceneConfig.snap.continuationGapMs)
    const { touchThreshold } = sceneConfig.snap

    const metrics = () => {
      const rect = outer.getBoundingClientRect()
      const viewport = stickyRef.current?.offsetHeight || window.innerHeight
      return { top: rect.top + window.scrollY, travel: rect.height - viewport }
    }

    const inRegion = () => {
      const { top, travel } = metrics()
      if (travel <= 0) return false
      return outer.getBoundingClientRect().top < window.innerHeight && window.scrollY <= top + travel + 1
    }

    const progressNow = () => {
      const { top, travel } = metrics()
      return travel <= 0 ? 0 : clamp((window.scrollY - top) / travel, 0, 1)
    }

    const targetFor = (i) => {
      const { top, travel } = metrics()
      return Math.round(top + sections[i].at * travel)
    }

    const nextIndex = (dir) => {
      const p = progressNow()
      const eps = 0.002
      if (dir > 0) return sections.findIndex((s) => s.at > p + eps)
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].at < p - eps) return i
      }
      return -1
    }

    const isLocked = () =>
      animating.current || performance.now() < Math.max(cooldownUntil.current, hardLockUntil.current)

    const releaseHardLock = () => {
      clearTimeout(hardLockTimer.current)
      hardLockUntil.current = 0
      const el = document.documentElement
      el.style.overflow = ''
      el.style.paddingRight = ''
    }

    const hardLock = (ms) => {
      clearTimeout(hardLockTimer.current)
      const el = document.documentElement
      const gutter = window.innerWidth - el.clientWidth
      if (gutter > 0) el.style.paddingRight = `${gutter}px`
      el.style.overflow = 'hidden'
      hardLockUntil.current = performance.now() + ms
      hardLockTimer.current = setTimeout(releaseHardLock, ms)
    }

    const regionOf = () => {
      const { top, travel } = metrics()
      if (window.scrollY < top - 1) return 'above'
      if (window.scrollY > top + travel + 1) return 'below'
      return 'inside'
    }

    const endAnimation = (extraLock = 0) => {
      animating.current = false
      const now = performance.now()
      cooldownUntil.current = now + Math.max(quietMs, extraLock)
      cooldownHardUntil.current = now + Math.max(maxQuietMs, extraLock)
    }

    const animateTo = (y, { lock: extraLock = 0, ms, force = false } = {}) => {
      const dur = ms ?? duration
      cancelAnimationFrame(rafId.current)

      const from = window.scrollY
      const dist = y - from
      if (Math.abs(dist) < 1) return endAnimation(extraLock)

      animating.current = true
      const start = performance.now()
      let expected = null

      const step = (now) => {
        if (!force && expected !== null && now - start > ABORT_GRACE_MS && Math.abs(window.scrollY - expected) > 2) {
          return endAnimation(extraLock)
        }

        const t = Math.min(1, (now - start) / dur)
        // index.css 의 scroll-behavior: smooth 때문에 behavior 를 명시해야 한다
        window.scrollTo({ top: from + dist * easeInOutCubic(t), behavior: 'instant' })
        expected = window.scrollY

        if (t < 1) rafId.current = requestAnimationFrame(step)
        else endAnimation(extraLock)
      }
      rafId.current = requestAnimationFrame(step)
    }

    const resolveTarget = (dir) => nextIndex(dir)

    const advance = (dir) => {
      const i = resolveTarget(dir)
      if (i === -1) return false
      animateTo(targetFor(i))
      return true
    }

    const prevWheel = { mag: 0, at: 0 }

    let region = null
    let lastY = window.scrollY
    let captures = 0

    let pointerHeld = false
    const onPointerDown = () => {
      pointerHeld = true
    }
    const onPointerUp = () => {
      pointerHeld = false
    }

    const capture = () => {
      captures += 1
      const last = sections.length - 1
      window.scrollTo({ top: targetFor(last), behavior: 'instant' })
      hardLock(reentryMs)
    }

    const onScroll = () => {
      const prev = region
      region = regionOf()
      const y = window.scrollY
      const drift = Math.abs(y - lastY)
      lastY = y

      if (animating.current) return
      if (recentAnchorJump()) return

      if (prev === 'below' && region === 'inside') {
        captures = 0
        return capture()
      }

      const noInput = performance.now() - lastInputAt.current > 250
      if (region === 'inside' && noInput && !pointerHeld && drift > 50 && captures < 3) {
        capture()
      }
    }

    const onWheel = (e) => {
      if (e.ctrlKey) return

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (delta === 0) return

      const now = performance.now()
      const mag = Math.abs(delta)
      const continuation = isWheelContinuation(mag, now, prevWheel, continuationGapMs)
      prevWheel.mag = mag
      prevWheel.at = now

      if (!inRegion()) return

      const dir = delta > 0 ? 1 : -1
      if (resolveTarget(dir) === -1) return

      e.preventDefault()
      if (continuation || isLocked()) return

      lastInputAt.current = now
      advance(dir)
    }

    const onKeyDown = (e) => {
      if (!inRegion() || isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return

      let dir
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight') dir = 1
      else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') dir = -1
      else if (e.key === ' ') dir = e.shiftKey ? -1 : 1
      else return

      if (isLocked()) return e.preventDefault()
      lastInputAt.current = performance.now()
      if (advance(dir)) e.preventDefault()
    }

    let touchY = 0
    let touchX = 0

    const swipeDelta = (x, y) => {
      const dy = touchY - y
      const dx = x - touchX
      return Math.abs(dx) > Math.abs(dy) ? dx : dy
    }

    const onTouchStart = (e) => {
      const t = e.touches[0]
      touchY = t?.clientY ?? 0
      touchX = t?.clientX ?? 0
    }

    const onTouchMove = (e) => {
      if (!inRegion()) return
      const t = e.touches[0]
      if (!t) return

      const d = swipeDelta(t.clientX, t.clientY)
      if (d === 0) return

      // iOS 는 스크롤이 시작된 뒤의 preventDefault 를 무시한다 — 첫 touchmove 에서 결정한다
      if (resolveTarget(d > 0 ? 1 : -1) === -1) return

      e.preventDefault()
    }

    const onTouchEnd = (e) => {
      if (!inRegion() || isLocked()) return
      const t = e.changedTouches[0]
      if (!t) return
      const d = swipeDelta(t.clientX, t.clientY)
      if (Math.abs(d) < touchThreshold) return
      lastInputAt.current = performance.now()
      advance(d > 0 ? 1 : -1)
    }

    // passive: false 를 명시하지 않으면 preventDefault 가 무시된다
    const opts = { passive: false }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    window.addEventListener('pointercancel', onPointerUp, { passive: true })
    window.addEventListener('wheel', onWheel, opts)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, opts)
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('wheel', onWheel, opts)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove, opts)
      window.removeEventListener('touchend', onTouchEnd)
      cancelAnimationFrame(rafId.current)
      releaseHardLock()
      animating.current = false
      cooldownUntil.current = 0
    }
  }, [enabled, outerRef, stickyRef, sections])
}
