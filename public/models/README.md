# 3D 모델 (.glb)

스크롤 히어로가 쓰는 glTF 모델을 여기에 둔다.

## 교체 절차

1. `.glb` 파일을 이 디렉토리에 넣는다. 예) `forklift.glb`
2. `src/data/scrollScene.js` 의 `scrollModel.path` 를 채운다.

   ```js
   path: '/models/forklift.glb',   // null 이면 절차적 placeholder 가 뜬다
   ```

3. 원점·크기가 맞지 않으면 같은 객체의 `scale` / `position` / `rotation` 으로 보정한다.
4. 애니메이션 클립이 있으면 `animation` 을 설정한다.
   - `mode: 'scrub'` — 스크롤 0~1 을 `range: [시작초, 끝초]` 에 선형 매핑 (기본)
   - `mode: 'segments'` — 섹션마다 다른 시간 구간 재생 (`segments` 가 섹션과 같은 순서)
   - `clip: null` 이면 첫 번째 클립을 쓴다.

## 압축

Draco / meshopt 둘 다 지원한다.

- **Draco**: 디코더가 `public/draco/` 에 복사돼 있어 외부 CDN 없이 동작한다.
  `scrollModel.draco` 가 `'/draco/'` 로 잡혀 있으니 그대로 두면 된다.
- **meshopt**: 디코더가 drei 에 번들돼 있어 별도 파일이 필요 없다.

압축 예시:

```bash
npx gltf-transform optimize input.glb forklift.glb --compress draco --texture-compress webp
```

## 권장 예산

첫 화면에서 바로 받는 에셋이므로 가볍게 유지한다.

| 항목 | 권장 |
| --- | --- |
| 파일 크기 | 3MB 이하 (압축 후) |
| 삼각형 | 15만 이하 |
| 텍스처 | 2048px 이하, WebP/KTX2 |
| 머티리얼 | 10개 이하 |

> `public/` 안의 파일은 Vite 가 해싱하지 않고 그대로 복사한다.
> 즉 파일명이 곧 캐시 키다 — 모델을 갱신할 땐 파일명에 버전을 붙이는 편이 안전하다.
