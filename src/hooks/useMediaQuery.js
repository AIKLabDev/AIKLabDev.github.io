import { useCallback, useSyncExternalStore } from 'react'

/**
 * matchMedia 구독. OS 설정을 도중에 바꿔도 반영된다.
 * useEffect + setState 대신 useSyncExternalStore 를 쓴다 —
 * 외부 저장소 구독이 정확히 이 훅의 용도이고, 마운트 직후 여분의 렌더가 없다.
 */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** 모션 저감 사용자 — 3D 장면 대신 정적 히어로를 준다. */
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

/** 좁은 화면(모바일) — 그림자·픽셀비 등 부하를 줄이는 판단에 쓴다. */
export const useIsCompact = () => useMediaQuery('(max-width: 767px)')
