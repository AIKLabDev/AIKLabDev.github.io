import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  /**
   * 사내망 공유를 기본값으로 둔다 — 리뷰용으로 다른 PC에서 열어야 하는 일이 잦다.
   * 매번 `npm run dev -- --host --port 7777` 을 외우게 하는 대신 여기에 박는다.
   *
   * host: true = 0.0.0.0 바인딩 (기본값 localhost 는 그 PC에서만 열린다)
   * strictPort = 포트가 점유돼 있으면 조용히 다른 포트로 옮기지 말고 실패시킨다.
   *              공유한 주소가 말없이 바뀌는 것보다, 못 뜨고 이유를 말하는 편이 낫다.
   */
  server: {
    host: true,
    port: 7777,
    strictPort: true,
  },

  // 빌드본 확인(`npm run preview`)도 같은 조건으로 맞춘다
  preview: {
    host: true,
    port: 7777,
    strictPort: true,
  },
})
