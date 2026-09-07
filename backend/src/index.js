// DayGrid Worker 진입점.
// - /api/* 요청: 아래 라우터가 직접 처리한다 (인증/인가/DB 접근).
// - 그 외 요청: 프론트엔드 정적 파일(frontend/dist, ASSETS 바인딩)을 그대로 서빙한다.
//   덕분에 프론트엔드와 백엔드가 같은 Cloudflare 도메인에서 동작해 CORS 문제가 없다.

import { errorResponse, serverError } from './utils/response.js';
import { getCurrentUser } from './middleware/auth.js';
import { handleRegister, handleLogin, handleMe, handleLogout } from './routes/auth.js';
import {
  handleListEvents,
  handleGetEvent,
  handleCreateEvent,
  handleUpdateEvent,
  handleDeleteEvent,
  handleToggleEvent,
} from './routes/events.js';

async function handleApi(request, env) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  // ---- 인증 관련 (로그인 불필요) ----
  if (pathname === '/api/auth/register' && method === 'POST') {
    return handleRegister(request, env);
  }
  if (pathname === '/api/auth/login' && method === 'POST') {
    return handleLogin(request, env);
  }
  if (pathname === '/api/auth/me' && method === 'GET') {
    return handleMe(request, env);
  }
  if (pathname === '/api/auth/logout' && method === 'POST') {
    return handleLogout(request, env);
  }

  // ---- 일정 관련 (로그인 필요) ----
  if (pathname.startsWith('/api/events')) {
    const user = await getCurrentUser(request, env);
    if (!user) return errorResponse('로그인이 필요합니다.', 401);

    if (pathname === '/api/events' && method === 'GET') {
      return handleListEvents(request, user, env);
    }
    if (pathname === '/api/events' && method === 'POST') {
      return handleCreateEvent(request, user, env);
    }

    const toggleMatch = pathname.match(/^\/api\/events\/([^/]+)\/toggle$/);
    if (toggleMatch && method === 'PATCH') {
      return handleToggleEvent(request, user, env, toggleMatch[1]);
    }

    const idMatch = pathname.match(/^\/api\/events\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];
      if (method === 'GET') return handleGetEvent(request, user, env, id);
      if (method === 'PUT') return handleUpdateEvent(request, user, env, id);
      if (method === 'DELETE') return handleDeleteEvent(request, user, env, id);
    }
  }

  return errorResponse('요청한 API를 찾을 수 없습니다.', 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env);
      } catch (err) {
        return serverError(err);
      }
    }

    // 정적 프론트엔드 서빙 (React SPA). ASSETS 바인딩이 없는 순수 `wrangler dev`
    // 단독 실행 환경(프론트를 따로 Vite로 띄우는 개발 모드)에서는 안내 메시지를 보여준다.
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response(
      'DayGrid API 서버가 실행 중입니다. 프론트엔드는 frontend 폴더에서 별도로 실행하세요 (npm run dev).',
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  },
};
