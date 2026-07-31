import { useEffect, useRef } from 'react'
import { sceneConfig } from '../data/scrollScene'
import { tune } from '../lib/devTuning'
import { isWheelContinuation } from '../lib/gesture'
import { clamp } from '../lib/math'

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const isTypingTarget = (el) =>
  !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName ?? ''))

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
 * 5) 세로·가로 어느 쪽으로 밀어도 다음 장으로 넘어간다. 이 히어로에는 방향을
 *    알려줄 단서가 거의 없어서(특히 모바일), 둘 다 받으면 사용자가 방향을
 *    맞힐 필요 자체가 없어진다. 두 축 중 큰 쪽을 그 동작의 세기로 본다.
 *    ctrl+휠(브라우저 확대)만 우리 것이 아니다.
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
  /** 스크롤 자체를 막아 관성을 죽이는 구간의 종료 시각 */
  const hardLockUntil = useRef(0)
  const hardLockTimer = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const outer = outerRef.current
    if (!outer) return

    // 개발 중 ?snapDuration=1400&snapQuiet=200 으로 바로 바꿔볼 수 있다
    const duration = tune('snapDuration', sceneConfig.snap.duration)
    const quietMs = tune('snapQuiet', sceneConfig.snap.quietMs)
    const maxQuietMs = tune('snapMaxQuiet', sceneConfig.snap.maxQuietMs)
    const reentryMs = tune('snapReentry', sceneConfig.snap.reentryMs)
    const continuationGapMs = tune('snapContinuation', sceneConfig.snap.continuationGapMs)
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
    const isLocked = () =>
      animating.current || performance.now() < Math.max(cooldownUntil.current, hardLockUntil.current)

    /**
     * 스크롤을 아예 불가능하게 만들어 관성을 죽인다.
     *
     * 관성은 이벤트가 오지 않으므로 preventDefault 로 막을 수 없고, scrollTo 로
     * 덮어써도 프레임 사이에 계속 밀고 들어와 이길 수 없다. 갈 곳을 없애는 것이
     * 유일하게 확실한 방법이다.
     *
     * 복구를 놓치면 페이지가 스크롤 불가로 남는다. 타이머·정리 함수 양쪽에서 푼다.
     */
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
      // 스크롤바가 사라지면서 폭이 변하면 화면이 튄다. 그만큼 여백으로 메운다.
      const gutter = window.innerWidth - el.clientWidth
      if (gutter > 0) el.style.paddingRight = `${gutter}px`
      el.style.overflow = 'hidden'
      hardLockUntil.current = performance.now() + ms
      hardLockTimer.current = setTimeout(releaseHardLock, ms)
    }

    /** 히어로 기준 현재 위치 */
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

    /**
     * @param {number} y 목표 스크롤 위치
     * @param {object} [opts]
     * @param {number} [opts.lock] 끝난 뒤 추가로 잠글 시간(ms)
     * @param {number} [opts.ms] 이동 시간(ms). 생략하면 일반 전환 시간
     * @param {boolean} [opts.force] 중단 가드를 끈다.
     *        평소에는 다른 주체(건너뛰기 링크·스크롤바)가 스크롤을 옮기면 양보하지만,
     *        관성을 붙잡는 중에는 양보하면 안 된다. 관성은 프레임 사이에 계속 스크롤을
     *        밀어넣으므로, 양보하면 180ms 만에 포기하고 그대로 통과당한다.
     */
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
        // 다른 주체가 스크롤을 옮겼으면 우리 애니메이션을 포기한다.
        // 다만 초반 유예를 둔다 — 재진입 직후에는 네이티브 관성이 아직 남아 있어서
        // 유예가 없으면 시작하자마자 중단되고, 그게 연쇄 넘김의 원인이 된다.
        if (!force && expected !== null && now - start > ABORT_GRACE_MS && Math.abs(window.scrollY - expected) > 2) {
          return endAnimation(extraLock)
        }

        const t = Math.min(1, (now - start) / dur)
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

    /** 직전 휠 이벤트 — 같은 동작의 연속인지 판정하는 근거 (lib/gesture) */
    const prevWheel = { mag: 0, at: 0 }

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
    let lastY = window.scrollY
    let captures = 0

    /**
     * 포인터를 누르고 있는 동안에는 "계속 밀림" 재포착을 하지 않는다.
     *
     * 데스크톱 스크롤바 드래그가 관성과 구분되지 않아서 예전에는 터치 기기에서만
     * 재포착을 켰는데, 그러면 트랙패드 관성이 그대로 통과한다(데스크톱에서 가드가
     * 안 듣던 이유다). 관성은 손을 뗀 뒤에 일어나므로, "버튼이 눌려 있는가" 로
     * 정확히 갈린다.
     */
    let pointerHeld = false
    const onPointerDown = () => {
      pointerHeld = true
    }
    const onPointerUp = () => {
      pointerHeld = false
    }

    /**
     * 아래에서 관성으로 되돌아온 것을 경계에 붙여 세운다.
     *
     * 애니메이션으로 "따라잡으려" 하면 관성과 위치를 다투다 진다. 대신 즉시
     * 마지막 섹션 위치로 붙이고 스크롤을 잠가, 관성이 밀 공간 자체를 없앤다.
     * (web.auto 는 히어로에 스크롤 높이를 주지 않아 문서 최상단이 곧 벽이 되고,
     *  거기서 1초를 기다렸다가 8장을 띄운다 — 성질이 같다.)
     */
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

      // 아래 콘텐츠에서 관성으로 되돌아왔다
      if (prev === 'below' && region === 'inside') {
        captures = 0
        return capture()
      }

      // 잠금이 풀린 뒤에도 잔여 관성이 밀고 있으면 다시 잡는다.
      // 히어로 안에서 입력은 우리가 가로채므로 스크롤이 저절로 움직일 이유가 없다.
      // 즉 "입력 없이 크게 움직임 + 버튼도 안 눌림" 이면 관성이다.
      const noInput = performance.now() - lastInputAt.current > 250
      if (region === 'inside' && noInput && !pointerHeld && drift > 50 && captures < 3) {
        capture()
      }
    }

    const onWheel = (e) => {
      if (e.ctrlKey) return // 브라우저 확대 — 우리 것이 아니다

      // 두 축 중 큰 쪽이 그 동작이다. 가로로 밀어도 다음 장으로 간다.
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (delta === 0) return

      const now = performance.now()
      const mag = Math.abs(delta)
      const continuation = isWheelContinuation(mag, now, prevWheel, continuationGapMs)
      // 히어로 밖에서 들어오는 도중의 이벤트도 기억해야, 진입 순간이 같은 동작의
      // 연속인지 알 수 있다.
      prevWheel.mag = mag
      prevWheel.at = now

      if (!inRegion()) return

      const dir = delta > 0 ? 1 : -1
      if (resolveTarget(dir) === -1) return // 양 끝 — 네이티브로 빠져나간다

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
      else return // Home/End/Tab 등은 네이티브 그대로 (탈출 경로를 막지 않는다)

      // 키는 관성이 없다. 잠긴 동안은 막기만 하고 연장하지 않는다.
      if (isLocked()) return e.preventDefault()
      lastInputAt.current = performance.now()
      if (advance(dir)) e.preventDefault()
    }

    let touchY = 0
    let touchX = 0

    /**
     * 시작점 대비 이동량을 한 축으로 접는다. 큰 쪽이 그 스와이프의 축이고,
     * 양수면 "다음" 이다.
     *
     * 두 축의 부호 규칙이 다른 것은 의도다.
     * 세로는 스크롤 관례를 따른다 — 위로 쓸어올리면 다음. (콘텐츠가 위로 밀린다)
     * 가로는 손이 간 방향이 곧 진행 방향이다 — 오른쪽으로 쓸면 다음.
     * 캐러셀 관례(왼쪽으로 쓸면 다음)로 만들었더니 반대로 느껴진다는 지적을 받았고,
     * 이 편이 키보드 화살표(-> = 다음)와도 맞는다.
     */
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

    /**
     * 이동 중에는 방향만 보고 자유 스크롤을 막는다. 섹션 전환은 손을 뗄 때 정한다.
     * 이동 중에 임계값으로 판정하면 손가락을 끄는 동안 여러 번 발화하고,
     * 그때마다 "한 스와이프 = 한 섹션" 을 지키려고 별도 래치가 필요해진다.
     * 손을 뗄 때 한 번만 판정하면 그 문제가 구조적으로 사라진다.
     */
    const onTouchMove = (e) => {
      if (!inRegion()) return
      const t = e.touches[0]
      if (!t) return

      // 위로 쓸어올리거나(dy) 왼쪽으로 쓸면(dx) 둘 다 "다음" 이다.
      const d = swipeDelta(t.clientX, t.clientY)
      if (d === 0) return

      // 히어로 밖으로 나가는 방향이면 네이티브에 넘긴다.
      // iOS 는 브라우저가 스크롤을 시작한 뒤의 preventDefault 를 무시하므로
      // 첫 touchmove 에서 결정해야 한다.
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

    // passive: false 가 핵심이다. 없으면 preventDefault 가 조용히 무시된다.
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
