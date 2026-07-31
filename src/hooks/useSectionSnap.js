import { useEffect, useRef } from 'react'
import { sceneConfig } from '../data/scrollScene'
import { tune } from '../lib/devTuning'
import { clamp } from '../lib/math'

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const isTypingTarget = (el) =>
  !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName ?? ''))

/**
 * 관성으로 볼 이벤트 간격(ms).
 * 트랙패드 관성은 프레임 단위(10~16ms)로 쏟아지고, 사람이 휠을 굴리는 간격은
 * 보통 80ms 이상이다. 이 값보다 촘촘하면 "아직 손을 뗀 뒤 흘러나오는 입력"으로 본다.
 */
const MOMENTUM_GAP_MS = 60

/** 애니메이션 시작 직후 중단 판정을 미루는 시간(ms) — 잔여 관성 흡수용 */
const ABORT_GRACE_MS = 180

/**
 * 한 번의 입력에 한 섹션씩 넘어가는 스크롤 스냅.
 *
 * 구현 자체는 단순하다 — 입력을 가로채고, 잠그고, 다음 섹션 위치로 애니메이션하고,
 * 끝나면 푼다. 실제로 어려운 건 아래 항목들이고 전부 여기서 처리한다.
 *
 * 1) window·document·body 의 wheel 리스너는 Chrome 기본이 passive 라
 *    preventDefault 가 무시된다. { passive: false } 를 반드시 명시해야 한다.
 * 2) 트랙패드는 한 번 튕기면 delta 가 감쇠하며 수십~수백 개가 들어온다.
 *    "애니메이션 끝나면 해제" 만 하면 해제 직후 잔여 관성이 다음 섹션을 바로
 *    트리거해서 한 번에 두세 섹션이 넘어간다 → 잠깐 더 잠가둔다.
 *    다만 그 연장에는 반드시 상한이 있어야 한다. 상한 없이 입력마다 타이머를
 *    되감으면, 마우스 휠을 꾸준히 굴리는 사람은 완전히 멈출 때까지 영원히
 *    잠긴다(= 페이지가 얼어붙은 것처럼 보인다).
 * 3) wheel 만 막으면 키보드·터치는 네이티브로 돌아 같은 페이지에 스크롤 모델이
 *    두 개 생긴다 → keydown·touchmove 도 같이 처리한다.
 * 4) 양 끝(첫 섹션에서 위 / 마지막 섹션에서 아래)에서는 가로채지 않는다.
 *    그래야 히어로 밖으로 정상적으로 빠져나갈 수 있다.
 * 5) ctrl+휠(브라우저 확대)과 가로 스크롤은 우리 것이 아니다. 건드리지 않는다.
 * 6) 애니메이션 도중 다른 주체(건너뛰기 링크, 스크롤바 드래그, Home 키)가
 *    스크롤을 옮기면 우리 쪽을 포기한다. 둘이 같은 값을 쓰면 떨린다.
 * 7) 아래 콘텐츠에서 위로 튕겨 올려 되돌아올 때, 관성은 손가락을 뗀 뒤 브라우저가
 *    스스로 굴리는 스크롤이라 이벤트가 오지 않는다. preventDefault 로 막을 대상이
 *    없다는 뜻이다. 입력만 보고 있으면 관성이 히어로 전체를 훑고 첫 장까지
 *    지나가버린다. 그래서 스크롤 위치 자체를 감시해, 밖에서 안으로 들어오는 순간
 *    가장 가까운 섹션으로 잡아 세운다(= 관성을 우리 애니메이션으로 덮어쓴다).
 *
 * prefers-reduced-motion 사용자는 애초에 3D 히어로를 받지 않으므로
 * 이 훅도 마운트되지 않는다.
 */
export function useSectionSnap({ enabled, outerRef, stickyRef, sections }) {
  const animating = useRef(false)
  /** 이 시각 이후에 입력을 다시 받는다 (performance.now 기준) */
  const cooldownUntil = useRef(0)
  /** 아무리 연장돼도 이 시각에는 반드시 푼다 — 얼어붙음 방지 */
  const cooldownHardUntil = useRef(0)
  const lastInputAt = useRef(0)
  const rafId = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const outer = outerRef.current
    if (!outer) return

    // 개발 중 ?snapDuration=1400&snapQuiet=200 으로 바로 바꿔볼 수 있다
    const duration = tune('snapDuration', sceneConfig.snap.duration)
    const quietMs = tune('snapQuiet', sceneConfig.snap.quietMs)
    const maxQuietMs = tune('snapMaxQuiet', sceneConfig.snap.maxQuietMs)
    const reentryMs = tune('snapReentry', sceneConfig.snap.reentryMs)
    const { touchThreshold } = sceneConfig.snap

    /**
     * 문서 좌표 기준 히어로 위치.
     * useScrollProgress 와 같은 근거(getBoundingClientRect)를 써야 한다 —
     * offsetTop 은 offsetParent 기준이라 상위에 positioned 요소가 끼면 조용히 어긋난다.
     */
    const metrics = () => {
      const rect = outer.getBoundingClientRect()
      const viewport = stickyRef.current?.offsetHeight || window.innerHeight
      return { top: rect.top + window.scrollY, travel: rect.height - viewport }
    }

    /**
     * 개입 구간: 히어로가 화면에 걸쳐 있고 아직 끝을 지나지 않았을 때.
     *
     * 위쪽(헤더 높이만큼 히어로가 아직 고정되지 않은 구간)도 포함한다.
     * 제외하면 첫 입력 한 번이 네이티브 스크롤로 새어 나가서, 진행률은 안 변하는데
     * 화면만 조금 밀리는 어중간한 단계가 생긴다.
     */
    const inRegion = () => {
      const { top, travel } = metrics()
      if (travel <= 0) return false
      return outer.getBoundingClientRect().top < window.innerHeight && window.scrollY <= top + travel + 1
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

    /** 타이머 대신 시각을 비교한다 — 되감기는 타이머가 만든 얼어붙음을 구조적으로 없앤다. */
    const isLocked = () => animating.current || performance.now() < cooldownUntil.current

    /** 히어로 기준 현재 위치 */
    const regionOf = () => {
      const { top, travel } = metrics()
      if (window.scrollY < top - 1) return 'above'
      if (window.scrollY > top + travel + 1) return 'below'
      return 'inside'
    }

    /** 진행률에 가장 가까운 섹션 */
    const nearestIndex = () => {
      const p = progressNow()
      let best = 0
      let bestDist = Infinity
      for (let i = 0; i < sections.length; i++) {
        const d = Math.abs(sections[i].at - p)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      }
      return best
    }

    const endAnimation = (extraLock = 0) => {
      animating.current = false
      const now = performance.now()
      cooldownUntil.current = now + Math.max(quietMs, extraLock)
      cooldownHardUntil.current = now + Math.max(maxQuietMs, extraLock)
    }

    /**
     * @param {number} y 목표 스크롤 위치
     * @param {number} extraLock 끝난 뒤 추가로 잠글 시간(ms).
     *        관성으로 되돌아온 직후에 쓴다 — 잔여 관성과 이어지는 스와이프가
     *        곧바로 다음 섹션을 트리거하는 것을 막는다.
     */
    const animateTo = (y, extraLock = 0) => {
      cancelAnimationFrame(rafId.current)

      const from = window.scrollY
      const dist = y - from
      if (Math.abs(dist) < 1) return endAnimation(extraLock)

      animating.current = true
      const start = performance.now()
      let expected = null

      const step = (now) => {
        // 다른 주체가 스크롤을 옮겼으면 우리 애니메이션을 포기한다.
        // 다만 초반 유예를 둔다 — 재진입 직후에는 네이티브 관성이 아직 남아 있어서
        // 유예가 없으면 시작하자마자 중단되고, 그게 연쇄 넘김의 원인이 된다.
        if (expected !== null && now - start > ABORT_GRACE_MS && Math.abs(window.scrollY - expected) > 2) {
          return endAnimation(extraLock)
        }

        const t = Math.min(1, (now - start) / duration)
        // index.css 의 scroll-behavior: smooth 가 걸려 있어 behavior 를 명시하지 않으면
        // scrollTo 가 자체 애니메이션을 돌려 이 루프와 싸운다.
        window.scrollTo({ top: from + dist * easeInOutCubic(t), behavior: 'instant' })
        expected = window.scrollY // 브라우저가 클램프할 수 있으니 실제 반영값을 기준으로 삼는다

        if (t < 1) rafId.current = requestAnimationFrame(step)
        else endAnimation(extraLock) // 애니메이션 종료 ≠ 해제. 관성이 잦아들 시간을 조금 더 준다.
      }
      rafId.current = requestAnimationFrame(step)
    }

    /** 실행하지 않고 목표만 본다 — 터치는 preventDefault 전에 판단이 필요하다 */
    const resolveTarget = (dir) => nextIndex(dir)

    const advance = (dir) => {
      const i = resolveTarget(dir)
      if (i === -1) return false // 양 끝 — 네이티브에 넘긴다
      animateTo(targetFor(i))
      return true
    }

    /**
     * 잠긴 동안 들어온 입력 처리.
     * 관성으로 보이면(직전 입력과 촘촘하면) 해제를 조금 미루되, 하드 상한은 넘지 않는다.
     */
    const holdIfMomentum = (now) => {
      if (now - lastInputAt.current < MOMENTUM_GAP_MS) {
        cooldownUntil.current = Math.min(now + quietMs, cooldownHardUntil.current)
      }
    }

    /**
     * 관성으로 되돌아오는 것을 잡아 세운다.
     *
     * 아래 콘텐츠에서 위로 튕겨 올리면, 손가락을 뗀 뒤에도 브라우저가 스스로
     * 스크롤을 계속한다. 이때는 wheel·touch 이벤트가 오지 않으므로 입력을 막는
     * 방식으로는 손을 쓸 수 없다. 스크롤 위치를 감시하다가 히어로에 들어오는
     * 순간 가장 가까운 섹션으로 애니메이션하면, 그 scrollTo 가 관성을 덮어써
     * 그 자리에서 멈춘다.
     */
    let region = null
    const onScroll = () => {
      const prev = region
      region = regionOf()
      if (prev === 'below' && region === 'inside' && !animating.current) {
        animateTo(targetFor(nearestIndex()), reentryMs)
      }
    }

    const onWheel = (e) => {
      if (e.ctrlKey) return // 브라우저 확대 — 우리 것이 아니다
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return // 가로 스크롤
      if (!inRegion()) return

      const now = performance.now()
      if (isLocked()) {
        e.preventDefault()
        holdIfMomentum(now)
        lastInputAt.current = now
        return
      }
      lastInputAt.current = now
      if (advance(e.deltaY > 0 ? 1 : -1)) e.preventDefault()
    }

    const onKeyDown = (e) => {
      if (!inRegion() || isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return

      let dir
      if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1
      else if (e.key === ' ') dir = e.shiftKey ? -1 : 1
      else return // Home/End/Tab 등은 네이티브 그대로 (탈출 경로를 막지 않는다)

      // 키는 관성이 없다. 잠긴 동안은 막기만 하고 연장하지 않는다.
      if (isLocked()) return e.preventDefault()
      lastInputAt.current = performance.now()
      if (advance(dir)) e.preventDefault()
    }

    let touchY = 0
    let touchX = 0
    /** 이 제스처가 이미 한 섹션을 소비했는가 — "스와이프 1회 = 1섹션" 을 보장한다 */
    let gestureUsed = false

    const onTouchStart = (e) => {
      const t = e.touches[0]
      touchY = t?.clientY ?? 0
      touchX = t?.clientX ?? 0
      gestureUsed = false
    }

    const onTouchMove = (e) => {
      if (!inRegion()) return
      const t = e.touches[0]
      if (!t) return

      const dy = touchY - t.clientY
      const dx = touchX - t.clientX

      // 가로 우세 제스처는 우리 것이 아니다 (iOS 뒤로가기 엣지 스와이프 포함)
      if (Math.abs(dx) > Math.abs(dy)) return

      const dir = dy > 0 ? 1 : -1
      // 히어로 밖으로 나가는 방향이면 네이티브에 넘긴다.
      // 이 판단을 preventDefault 前에 해야 한다 — iOS 는 브라우저가 스크롤을 시작한
      // 뒤에 오는 preventDefault 를 무시하므로, 첫 touchmove 에서 결정해야 한다.
      if (resolveTarget(dir) === -1) return

      e.preventDefault() // 히어로 안에서는 자유 스크롤을 막는다 (스냅의 정의)

      if (gestureUsed || isLocked()) return
      if (Math.abs(dy) < touchThreshold) return

      gestureUsed = true
      lastInputAt.current = performance.now()
      advance(dir)
    }

    // passive: false 가 핵심이다. 없으면 preventDefault 가 조용히 무시된다.
    const opts = { passive: false }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, opts)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, opts)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel, opts)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove, opts)
      cancelAnimationFrame(rafId.current)
      animating.current = false
      cooldownUntil.current = 0
    }
  }, [enabled, outerRef, stickyRef, sections])
}
