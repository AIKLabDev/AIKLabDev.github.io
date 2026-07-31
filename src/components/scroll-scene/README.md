# 스크롤 3D 히어로 — A/B 실험

## 현재 실험: 섹션 스냅 (`hero_scroll_snap`)

| | `flow` (연속) | `snap` (섹션 스냅) |
| --- | --- | --- |
| 스크롤 | 브라우저 기본. 휠을 굴린 만큼 진행 | 휠·키·스와이프 **한 번에 한 섹션** |
| 이동 | 즉시 반영 | 0.7초 이징으로 다음 섹션 중앙까지 |
| 기본 스크롤 | 그대로 | `preventDefault` 로 가로챔 |

**비교하려는 것**: 끊어 넘기는 것이 서사를 잘 전달하는가, 아니면 스크롤을
빼앗겨 답답하다고 느끼게 하는가.

진행 표시·건너뛰기·섹션별 길이·섹션 CTA 는 **양쪽 공통**이다. (그 비교는
`hero_scroll_story` 로 이미 끝났고 B안이 채택됐다 — 커밋 8f2db04 참고)

## 변형 강제 지정

```
/?hero=flow    연속 스크롤
/?hero=snap    섹션 스냅
```

한 번 지정하면 `localStorage['aikorea.hero.variant']` 에 저장되어 유지된다.
초기화하려면 그 키를 지운다. 지정도 저장값도 없으면 50/50 무작위 배정.
렌더된 변형은 히어로 섹션의 `data-hero-variant` 속성으로도 확인할 수 있다.

## 스냅 구현에서 실제로 어려운 지점

`useSectionSnap` 이 처리하는 것들. 순서대로 전부 실제 함정이다.

1. **passive 리스너** — `window`·`document`·`body` 의 wheel 리스너는 Chrome 기본이
   passive 라 `preventDefault()` 가 조용히 무시된다. `{ passive: false }` 필수.
2. **트랙패드 관성** — 한 번 튕기면 delta 가 감쇠하며 수십~수백 개가 들어온다.
   "애니메이션 끝나면 해제" 만 하면 해제 직후 잔여 관성이 다음 섹션을 즉시
   트리거해 한 번에 두세 섹션이 넘어간다. → 입력이 조용해질 때까지
   (`snap.quietMs`) 더 잠가둔다. 잠긴 동안 들어오는 입력마다 타이머를 다시 건다.
3. **wheel 만 막으면 안 된다** — 키보드·터치가 네이티브로 돌면 같은 페이지에
   스크롤 모델이 두 개 생긴다. `keydown`(↑↓/PgUp/PgDn/Space)·`touchmove` 도 같이 잡는다.
   `Home`/`End`/`Tab` 은 일부러 두었다 — 탈출 경로까지 막으면 안 된다.
4. **양 끝은 가로채지 않는다** — 첫 섹션에서 위, 마지막 섹션에서 아래는 네이티브에
   넘겨야 히어로 밖으로 정상적으로 나갈 수 있다.
5. **`scroll-behavior: smooth`** — `index.css` 에 걸려 있어서 `scrollTo` 에
   `behavior: 'instant'` 를 명시하지 않으면 브라우저가 자체 애니메이션을 돌려
   우리 rAF 루프와 싸운다.
6. **이중 이징** — 스크롤이 0.7초 이징으로 움직이는데 카메라 감쇠까지 느리면
   끈적하게 느껴진다. `sceneConfig.cameraDamping` 을 11 로 올려 둔 이유다
   (연속 스크롤만 있을 때는 6 이 적당했다).

`prefers-reduced-motion` 사용자는 애초에 3D 히어로를 받지 않으므로 이 훅도
마운트되지 않는다. 스크롤 재킹은 전정기관 증상의 대표적 유발 요인이라
이 폴백이 특히 중요하다.

튜닝 값은 `sceneConfig.snap` (`duration` / `quietMs` / `touchThreshold`).

## 측정 붙이기

3D 히어로가 실제로 렌더된 시점에 **한 번** 노출을 보고한다.
WebGL 미지원·모션저감 사용자는 정적 Hero 로 빠지므로 실험에 포함되지 않는다.

```js
window.addEventListener('experiment:exposure', (e) => {
  // e.detail = { experiment: 'hero_scroll_snap', variant: 'snap', source: 'assigned' }
})
// window.dataLayer 가 있으면 { event: 'experiment_exposure', ... } 로도 push 된다
```

`source` 는 배정 경로: `url`(강제 지정) / `stored`(재방문) / `assigned`(신규).
**분석 시 `url` 은 제외한다** — 내부 리뷰용 트래픽이다.

전환 지표는 아직 없다. 히어로 CTA 클릭·`#positions` 도달·지원 완료 중
무엇을 볼지 정해지면 같은 방식으로 이벤트를 추가한다.

## 주의

- 변형은 **마운트 때 한 번만** 정해진다. 도중에 바꾸면 문서 높이·스크롤 동작이
  달라져 보고 있던 위치가 튄다.
- 섹션의 진행률 구간(`range`)은 `vh` 길이에서 **계산된다**. 데이터에 손으로 적지
  않는다 — 길이와 구간을 따로 관리하면 언젠가 반드시 어긋난다.
- 스냅 목표는 각 섹션 구간의 **중앙**(`at`)이다. 마지막 섹션 중앙 이후 남는
  구간(약 7%)은 네이티브 스크롤로 빠져나간다 — 서사가 끝난 뒤라 의도된 동작이다.
