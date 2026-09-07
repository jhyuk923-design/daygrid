import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 개발 환경에서 프론트(5173)와 백엔드 Worker(8787)가 다른 포트라서 발생하는
// CORS/쿠키 문제를 피하기 위해, /api 요청을 wrangler dev 서버로 프록시한다.
// 이렇게 하면 브라우저 입장에서는 항상 같은 오리진(same-origin)으로 보인다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
});
