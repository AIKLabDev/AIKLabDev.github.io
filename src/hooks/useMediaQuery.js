import { useCallback, useSyncExternalStore } from 'react'

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

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

// 높이 조건이 있어야 가로 모드 폰이 데스크톱으로 잡히지 않는다
export const useIsCompact = () => useMediaQuery('(max-width: 767px), (max-height: 520px)')
