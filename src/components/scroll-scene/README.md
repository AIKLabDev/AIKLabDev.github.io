# 스크롤 3D 히어로 — A/B 실험

## 변형

| | A (기준안) | B (web.auto 형) |
| --- | --- | --- |
| 섹션 스크롤 길이 | 균일 90svh (총 720svh) | 섹션별 75~110svh (총 745svh) |
| 진행 표시 | 없음 (SCROLL 유도만) | `SCROLL TO EXPLORE 02 / 08` + 하단 진행 막대 |
| 건너뛰기 | 없음 | `소개 건너뛰기` → `#about` |
| 섹션별 CTA | 없음 | 섹션마다 링크 1개 |
| 마지막 CTA | 있음 | 있음 (동일) |

**비교하려는 것**: 7화면이 넘는 스크롤 서사에서 진행 상황을 알려주고 빠져나갈 길을
주는 것이 이탈을 줄이는가, 아니면 오히려 건너뛰게 만드는가.

정의 위치는 `src/data/scrollScene.js` 의 `heroVariants`.

## 변형 강제 지정

```
/?hero=A     기준안
/?hero=B     web.auto 형
```

한 번 지정하면 `localStorage['aikorea.hero.variant']` 에 저장되어 유지된다.
초기화하려면 그 키를 지우면 된다. 지정도 저장값도 없으면 50/50 무작위 배정.

렌더된 변형은 히어로 섹션의 `data-hero-variant` 속성으로도 확인할 수 있다.

## 측정 붙이기

3D 히어로가 실제로 렌더된 시점에 **한 번** 노출을 보고한다.
WebGL 미지원·`prefers-reduced-motion` 사용자는 정적 Hero 로 빠지므로
실험에 포함되지 않는다(포함하면 결과가 오염된다).

분석 도구는 코드가 고르지 않는다. 둘 중 편한 쪽에 연결한다.

```js
// 1) 커스텀 이벤트
window.addEventListener('experiment:exposure', (e) => {
  // e.detail = { experiment: 'hero_scroll_story', variant: 'B', source: 'assigned' }
})

// 2) GTM dataLayer — window.dataLayer 가 있으면 자동으로 push 된다
//    { event: 'experiment_exposure', experiment, variant, source }
```

`source` 는 배정 경로다: `url`(강제 지정) / `stored`(재방문) / `assigned`(신규 배정).
**분석할 때 `url` 은 제외해야 한다** — 내부 리뷰용으로 강제 지정한 트래픽이다.

전환 지표는 아직 붙이지 않았다. 히어로 CTA 클릭·`#positions` 도달·지원 완료 중
무엇을 볼지 정해지면 같은 방식으로 이벤트를 추가하면 된다.

## 주의

- 변형은 **마운트 때 한 번만** 정해진다. 도중에 바꾸면 문서 높이가 달라져
  보고 있던 스크롤 위치가 튄다.
- 섹션의 진행률 구간(`range`)은 `vh` 길이에서 **계산된다**. 데이터에 손으로
  적지 않는다 — 길이와 구간을 따로 관리하면 언젠가 반드시 어긋난다.
- A 와 B 는 문서 높이가 다르다(720 vs 745svh). 스크롤 깊이(px)를 그대로
  비교하면 안 되고, 비율이나 도달 섹션으로 비교해야 한다.
