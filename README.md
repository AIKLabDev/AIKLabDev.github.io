# AIKOREA 채용 사이트

```bash
npm install
npm run dev      # http://localhost:7777 (사내망 노출됨)
```

## ⚠️ 미디어 파일은 레포에 없다

사진·영상(`public/media/`)은 **버전 관리하지 않는다.** 별도로 전달받아 직접 넣어야 한다.

```
public/media/          ← 여기 (dist/media 아님. 빌드 때 지워진다)
```

없으면 히어로 배경과 프로젝트 섹션이 빈 채로 뜬다. 에러는 나지 않으므로
"왜 이미지가 안 보이지" 로 시간을 버리기 쉽다. 참고로 개발 서버는 없는 경로에
404 가 아니라 `index.html` 을 200 으로 돌려주므로, 이미지 주소를 직접 열었을 때
**페이지가 통째로 뜨면 파일이 없는 것**이다.

코드가 요구하는 파일:

```
hero-forklift.jpg          정적 폴백 히어로 배경 + og:image
forklift-real.webm  + .jpg 자동재생 루프 + 포스터
mecanum-real.webm   + .jpg 자동재생 루프 + 포스터
isaacsim-warehouse.jpg
fleet-surround.jpg
camera-calibration.jpg
```

3D 히어로에 대해서는 `src/components/scroll-scene/README.md` 참고.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
