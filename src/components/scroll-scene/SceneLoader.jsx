import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { sceneConfig } from '../../data/scrollScene'

/**
 * 첫 접속 로딩 화면.
 *
 * 판정 기준이 "에셋 로드 완료" 가 아니라 **첫 프레임이 실제로 그려졌는가** 인 것이
 * 핵심이다. useProgress 만 보면 placeholder 처럼 받을 파일이 없는 경우 처음부터
 * 완료로 나오고, 그러면 셰이더 컴파일·환경맵 굽는 동안 어두운 빈 화면이 그대로
 * 노출된다. 실제 모델을 붙이면 두 조건이 모두 필요해진다.
 *
 * 헤더보다 아래에 깔린다(z-40 < 헤더 z-50). 의도적이다 — 로고를 여기서 또 그리면
 * 상단 로고와 중복되므로, 상단 것을 그대로 살리고 로더는 배경만 덮는다.
 * 히어로에서는 어차피 메뉴가 감춰져 있어 로딩 중에 누를 것도 없다.
 *
 * fixed 가 아니라 absolute 인 것이 중요하다. fixed 로 두면 화면 전체를 덮는데,
 * 새로고침할 때 브라우저가 스크롤 위치를 복원하므로 히어로를 한참 지나 실제
 * 콘텐츠를 읽던 사람의 화면까지 통째로 덮어버린다(스크롤 잠금까지 걸려서
 * 페이지가 고장난 것으로 보였다). absolute 면 히어로 sticky 박스 안에 갇히므로
 * 히어로가 화면 밖일 때는 자연히 보이지 않는다.
 *
 * 표시는 화면 가운데가 아니라 좌하단 — 로딩이 끝나면 같은 자리에 진행 표시
 * (01 / 08)가 들어선다. 같은 자리가 "불러오는 중" 에서 "몇 번째" 로 이어진다.
 */
export default function SceneLoader({ ready }) {
  const { active, progress } = useProgress()

  // 최소 노출 시간이 지났는가. 준비가 순식간에 끝나도 이만큼은 보여준다 —
  // 바로 사라지면 로딩 화면이 깜빡인 것처럼 보여 오히려 산만하다.
  const [minElapsed, setMinElapsed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), sceneConfig.loading.minMs)
    return () => clearTimeout(t)
  }, [])

  // 안전장치: 무슨 일이 있어도 사용자를 로딩 화면에 가두지 않는다.
  // 첫 프레임 신호가 오지 않는 상황(렌더 루프 정지 등)이 실제로 존재한다.
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), sceneConfig.loading.maxMs)
    return () => clearTimeout(t)
  }, [])

  const hidden = (ready && !active && minElapsed) || timedOut

  // 로딩 중에는 스크롤을 잠근다 — 풀리는 순간 서사 한가운데 서 있으면 곤란하다
  useEffect(() => {
    if (hidden) return
    const el = document.documentElement
    el.style.overflow = 'hidden'
    return () => {
      el.style.overflow = ''
    }
  }, [hidden])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!hidden}
      className={`absolute inset-0 z-40 bg-ink-950 transition-opacity duration-500 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* 하안선 — 진행 표시(SceneProgress)의 막대와 같은 자리다 */}
      <div className="absolute inset-x-0 bottom-0 h-px overflow-hidden bg-white/10">
        {progress > 0 ? (
          <div
            className="h-full bg-accent-400/70 transition-[width] duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        ) : (
          <div
            className="h-full w-1/5 bg-accent-400/70"
            style={{ animation: 'loading-sweep 1.4s ease-in-out infinite' }}
          />
        )}
      </div>

      <div className="container-page absolute inset-x-0 bottom-0 flex items-center gap-3 pb-6">
        <span className="font-mono text-[0.625rem] tracking-[0.3em] text-brand-100/45 uppercase">Loading</span>
        {progress > 0 && (
          <span className="font-mono text-[0.625rem] text-accent-400 tabular-nums">{Math.round(progress)}%</span>
        )}
      </div>
    </div>
  )
}
