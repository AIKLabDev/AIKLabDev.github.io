import { useProgress } from '@react-three/drei'

/**
 * 3D 에셋 로딩 표시. Canvas 밖에서 쓴다 —
 * useProgress 는 THREE.DefaultLoadingManager 를 구독하므로 위치 제약이 없다.
 * placeholder 프로토타입에는 로드할 파일이 없어 표시 없이 지나간다.
 */
export default function SceneLoader() {
  const { active, progress } = useProgress()

  return (
    <div
      role="status"
      aria-live="polite"
      className={`absolute inset-0 z-20 grid place-items-center bg-ink-950 transition-opacity duration-500 ${
        active ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div className="flex w-48 flex-col items-center gap-3">
        <span className="font-mono text-2xl font-bold text-white tabular-nums">{Math.round(progress)}%</span>
        <span className="h-px w-full overflow-hidden bg-white/15">
          <span
            className="block h-full bg-accent-400 transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </span>
        <span className="text-xs tracking-wide text-brand-100/60">3D 장면을 불러오는 중</span>
      </div>
    </div>
  )
}
