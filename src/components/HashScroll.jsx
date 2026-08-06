import { useEffect } from 'react'

export default function HashScroll() {
  useEffect(() => {
    const { hash } = window.location
    if (!hash || hash === '#') return

    let cancelled = false
    const go = () => {
      if (cancelled) return
      try {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'instant', block: 'start' })
      } catch {
        /* empty */
      }
    }

    go()
    const retry = setTimeout(go, 300)
    return () => {
      cancelled = true
      clearTimeout(retry)
    }
  }, [])

  return null
}
