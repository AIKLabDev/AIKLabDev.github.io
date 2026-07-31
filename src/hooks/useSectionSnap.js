import { useEffect, useRef } from 'react'
import { sceneConfig } from '../data/scrollScene'
import { tune } from '../lib/devTuning'
import { clamp } from '../lib/math'

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const isTypingTarget = (el) =>
  !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName ?? ''))

/**
 * 한 번의 입력에 한 섹션씩 넘어가는 스크롤 스냅 (web.auto 방식).
 *
 * 구현 자체는 단순하다 — 입력을 가로채고, 잠그고, 다음 섹션 위치로 애니메이션하고,
 * 끝나면 푼다. 실제로 어려운 건 아래 네 가지이고 전부 여기서 처리한다.
 *
 * 1) window·document·body 의 wheel 리스너는 Chrome 기본이 passive 라
 *    preventDefault 가 무시된다. { passive: false } 를 반드시 명시해야 한다.
 * 2) 트랙패드는 한 번 튕기면 delta 가 감쇠하며 수십~수백 개가 들어온다.
 *    "애니메이션 끝나면 해제" 만 하면 해제 직후 잔여 관성이 다음 섹션을 바로
 *    트리거해서 한 번에 두세 섹션이 넘어간다 → 입력이 조용해질 때까지 더 잠근다.
 * 3) wheel 만 막으면 키보드·터치는 네이티브로 돌아 같은 페이지에 스크롤 모델이
 *    두 개 생긴다 → keydown·touchmove 도 같이 처리한다.
 * 4) 양 끝(첫 섹션에서 위 / 마지막 섹션에서 아래)에서는 가로채지 않는다.
 *    그래야 히어로 밖으로 정상적으로 빠져나갈 수 있다.
 *
 * prefers-reduced-motion 사용자는 애초에 3D 히어로를 받지 않으므로
 * 이 훅도 마운트되지 않는다.
 */
export function useSectionSnap({ enabled, outerRef, stickyRef, sections }) {
  const locked = useRef(false)
  const rafId = useRef(0)
  const quietTimer = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const outer = outerRef.current
    if (!outer) return

    // 개발 중 ?snapDuration=1400&snapQuiet=200 으로 바로 바꿔볼 수 있다
    const duration = tune('snapDuration', sceneConfig.snap.duration)
    const quietMs = tune('snapQuiet', sceneConfig.snap.quietMs)
    const { touchThreshold } = sceneConfig.snap

    const metrics = () => {
      const top = outer.offsetTop
      const viewport = stickyRef.current?.offsetHeight || window.innerHeight
      return { top, travel: outer.offsetHeight - viewport }
    }

    /** 히어로가 화면을 잡고 있는 동안에만 개입한다. 밖에서는 평범한 페이지다. */
    const inHero = () => {
      const { top, travel } = metrics()
      return travel > 0 && window.scrollY >= top - 1 && window.scrollY <= top + travel + 1
    }

    const progressNow = () => {
      const { top, travel } = metrics()
      return travel <= 0 ? 0 : clamp((window.scrollY - top) / travel, 0, 1)
    }

    /** 섹션 i 의 카메라 키프레임이 완성되는 스크롤 위치 */
    const targetFor = (i) => {
      const { top, travel } = metrics()
      return Math.round(top + sections[i].at * travel)
    }

    /**
     * 진행 방향으로 "다음" 섹션. 가장 가까운 섹션이 아니라 다음 섹션을 고른다 —
     * 가까운 것을 고르면 경계 부근에서 한 섹션을 건너뛴다.
     * 더 갈 곳이 없으면 -1 (네이티브 스크롤에 넘긴다).
     */
    const nextIndex = (dir) => {
      const p = progressNow()
      const eps = 0.002
      if (dir > 0) return sections.findIndex((s) => s.at > p + eps)
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].at < p - eps) return i
      }
      return -1
    }

    const bumpQuiet = () => {
      clearTimeout(quietTimer.current)
      quietTimer.current = setTimeout(() => {
        locked.current = false
      }, quietMs)
    }

    const animateTo = (y) => {
      cancelAnimationFrame(rafId.current)
      clearTimeout(quietTimer.current)

      const from = window.scrollY
      const dist = y - from
      locked.current = true

      if (Math.abs(dist) < 1) return bumpQuiet()

      const start = performance.now()
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration)
        // index.css 의 scroll-behavior: smooth 가 걸려 있어 behavior 를 명시하지 않으면
        // scrollTo 가 자체 애니메이션을 돌려 이 루프와 싸운다.
        window.scrollTo({ top: from + dist * easeInOutCubic(t), behavior: 'instant' })
        if (t < 1) rafId.current = requestAnimationFrame(step)
        else bumpQuiet() // 애니메이션 종료 ≠ 해제. 입력이 조용해져야 해제한다.
      }
      rafId.current = requestAnimationFrame(step)
    }

    const advance = (dir) => {
      const i = nextIndex(dir)
      if (i === -1) return false // 양 끝 — 네이티브에 넘긴다
      animateTo(targetFor(i))
      return true
    }

    const onWheel = (e) => {
      if (!inHero()) return
      if (locked.current) {
        e.preventDefault()
        bumpQuiet() // 관성이 계속 들어오는 동안은 계속 잠가둔다
        return
      }
      if (advance(e.deltaY > 0 ? 1 : -1)) e.preventDefault()
    }

    const onKeyDown = (e) => {
      if (!inHero() || isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return

      let dir
      if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1
      else if (e.key === ' ') dir = e.shiftKey ? -1 : 1
      else return // Home/End/Tab 등은 네이티브 그대로 (탈출 경로를 막지 않는다)

      if (locked.current) return e.preventDefault()
      if (advance(dir)) e.preventDefault()
    }

    let touchY = 0
    const onTouchStart = (e) => {
      touchY = e.touches[0]?.clientY ?? 0
    }

    const onTouchMove = (e) => {
      if (!inHero()) return
      e.preventDefault() // 히어로 안에서는 자유 스크롤을 막는다 (스냅의 정의)
      if (locked.current) return

      const y = e.touches[0]?.clientY ?? touchY
      const dy = touchY - y
      if (Math.abs(dy) < touchThreshold) return
      touchY = y
      advance(dy > 0 ? 1 : -1)
    }

    // passive: false 가 핵심이다. 없으면 preventDefault 가 조용히 무시된다.
    const opts = { passive: false }
    window.addEventListener('wheel', onWheel, opts)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, opts)

    return () => {
      window.removeEventListener('wheel', onWheel, opts)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove, opts)
      cancelAnimationFrame(rafId.current)
      clearTimeout(quietTimer.current)
      locked.current = false
    }
  }, [enabled, outerRef, stickyRef, sections])
}
