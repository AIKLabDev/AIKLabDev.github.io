import { useEffect, useState } from 'react'
import Icon from './Icon'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function LoopVideo({ src, poster, caption }) {
  const reduced = usePrefersReducedMotion()

  if (reduced && poster) {
    return <img src={poster} alt={caption} loading="lazy" className="size-full object-cover" />
  }
  return (
    <video
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={caption}
      className="size-full object-cover"
    />
  )
}

function ClipVideo({ src, poster, caption }) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <video
        src={src}
        poster={poster}
        controls
        autoPlay
        muted
        loop
        playsInline
        aria-label={caption}
        className="size-full bg-ink-950 object-contain"
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative size-full cursor-pointer bg-ink-950"
      aria-label={`${caption} 영상 재생`}
    >
      {poster ? (
        <img src={poster} alt="" loading="lazy" className="size-full object-cover opacity-85 transition-opacity group-hover:opacity-100" />
      ) : (
        <div className="size-full bg-gradient-to-br from-ink-800 to-ink-950" />
      )}
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-14 place-items-center rounded-full bg-white/90 text-ink-900 shadow-lg backdrop-blur transition-transform duration-200 group-hover:scale-105">
          <Icon name="play" className="ml-0.5 size-6" strokeWidth={1} fill="currentColor" />
        </span>
      </span>
    </button>
  )
}

export function MediaRaw({ item }) {
  const { kind, src, poster, caption } = item
  if (kind === 'loop') return <LoopVideo src={src} poster={poster} caption={caption} />
  if (kind === 'clip') return <ClipVideo src={src} poster={poster} caption={caption} />
  if (kind === 'image') return <img src={src} alt={caption ?? ''} loading="lazy" className="size-full object-cover" />
  return null
}
