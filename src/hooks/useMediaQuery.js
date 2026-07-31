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

/**
 * 좁은 화면 — 그림자·픽셀비를 줄이고, 텍스트를 하단에 깔고 피사체를 위로 민다.
 *
 * 높이 조건이 붙어 있는 이유: 폭만 보면 가로 모드 폰(아이폰 가로 812px)이
 * 데스크톱으로 잡힌다. 세로 375px 화면에 좌우 배치 텍스트가 들어가면 3D 와 겹친다.
 * "화면이 좁다" 가 아니라 "여유가 없다" 를 판정해야 한다.
 */
export const useIsCompact = () => useMediaQuery('(max-width: 767px), (max-height: 520px)')
