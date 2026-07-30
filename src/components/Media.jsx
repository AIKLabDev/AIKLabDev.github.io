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

/** 무음 자동 반복 루프. 모션 감소 설정이면 포스터 이미지만 보여준다. */
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

/** 포스터 + 재생 버튼. 클릭할 때까지 영상을 내려받지 않는다. */
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

/**
 * 사진/영상 자료가 없는 프로젝트용 구조 다이어그램.
 * (팔레타이징 Sim-to-Real 브리지 구조)
 */
function PalletizingDiagram() {
  const nodes = [
    { x: 24, label: 'MoveIt', sub: '모션 계획' },
    { x: 156, label: 'ROS2 Bridge', sub: '커스텀 브리지 패키지' },
  ]
  return (
    <div className="grid size-full place-items-center bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 p-4">
      <svg viewBox="0 0 420 200" className="h-full w-full max-w-[420px]" role="img" aria-label="Sim-to-Real 브리지 구조 다이어그램">
        <defs>
          <marker id="arw" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 8 4 0 8z" fill="#38bdf8" />
          </marker>
        </defs>

        {nodes.map((n) => (
          <g key={n.label}>
            <rect x={n.x} y="78" width="112" height="44" rx="7" fill="#38bdf8" fillOpacity="0.1" stroke="#38bdf8" strokeOpacity="0.45" />
            <text x={n.x + 56} y="97" textAnchor="middle" className="fill-white text-[11px] font-semibold">
              {n.label}
            </text>
            <text x={n.x + 56} y="111" textAnchor="middle" className="fill-sky-300/70 text-[8.5px]">
              {n.sub}
            </text>
          </g>
        ))}

        {/* 브리지에서 가상/실물로 갈라지는 두 경로 */}
        <path d="M268 92 Q296 92 296 56 L318 56" fill="none" stroke="#38bdf8" strokeOpacity="0.5" strokeWidth="1.4" markerEnd="url(#arw)" />
        <path d="M268 108 Q296 108 296 144 L318 144" fill="none" stroke="#38bdf8" strokeOpacity="0.5" strokeWidth="1.4" markerEnd="url(#arw)" />
        <path d="M136 100 L150 100" fill="none" stroke="#38bdf8" strokeOpacity="0.5" strokeWidth="1.4" markerEnd="url(#arw)" />

        <g>
          <rect x="326" y="36" width="76" height="40" rx="7" fill="#ffffff" fillOpacity="0.08" stroke="#ffffff" strokeOpacity="0.3" strokeDasharray="3 2.5" />
          <text x="364" y="54" textAnchor="middle" className="fill-white text-[10.5px] font-semibold">Isaac Sim</text>
          <text x="364" y="66" textAnchor="middle" className="fill-white/55 text-[8px]">디지털 트윈</text>
        </g>
        <g>
          <rect x="326" y="124" width="76" height="40" rx="7" fill="#ffffff" fillOpacity="0.08" stroke="#ffffff" strokeOpacity="0.3" />
          <text x="364" y="142" textAnchor="middle" className="fill-white text-[10.5px] font-semibold">실물 로봇</text>
          <text x="364" y="154" textAnchor="middle" className="fill-white/55 text-[8px]">6축 매니퓰레이터</text>
        </g>

        {/* JointState 양방향 동기화 */}
        <path d="M364 80 L364 120" fill="none" stroke="#94a3b8" strokeOpacity="0.45" strokeWidth="1.1" strokeDasharray="3 3" />
        <text x="372" y="103" className="fill-slate-300/70 text-[7.5px]">JointState 동기화</text>
      </svg>
    </div>
  )
}

/**
 * 부모를 그대로 채우는 렌더러. 바깥에서 비율·모서리를 잡아주는 것을 전제한다.
 * caption 은 화면에 띄우지 않고 alt / aria 텍스트로만 쓴다.
 */
export function MediaRaw({ item }) {
  const { kind, src, poster, caption } = item
  if (kind === 'loop') return <LoopVideo src={src} poster={poster} caption={caption} />
  if (kind === 'clip') return <ClipVideo src={src} poster={poster} caption={caption} />
  if (kind === 'image') return <img src={src} alt={caption ?? ''} loading="lazy" className="size-full object-cover" />
  if (kind === 'diagram') return <PalletizingDiagram />
  return null
}
