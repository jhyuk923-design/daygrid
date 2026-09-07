// 인증(Authentication) 관련 미들웨어.
// 요청의 쿠키에서 세션 id를 꺼내 D1의 sessions 테이블과 대조하고,
// 유효하면 해당 세션의 사용자(userId)를 돌려준다.

export const SESSION_COOKIE_NAME = 'daygrid_session';

export function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const cookies = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

// 요청이 https로 들어왔는지 확인해 Secure 쿠키 속성을 붙일지 결정한다.
// (로컬 http 개발 환경에서는 Secure를 붙이면 브라우저가 쿠키를 거부하기 때문)
export function isHttps(request) {
  return new URL(request.url).protocol === 'https:';
}

export function buildSessionCookie(request, token, maxAgeSeconds) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isHttps(request)) parts.push('Secure');
  return parts.join('; ');
}

export function buildClearSessionCookie(request) {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isHttps(request)) parts.push('Secure');
  return parts.join('; ');
}

// 현재 요청을 보낸 사용자를 조회한다. 로그인하지 않았거나 세션이 만료되었으면 null.
export async function getCurrentUser(request, env) {
  const cookies = parseCookies(request);
  const sessionId = cookies[SESSION_COOKIE_NAME];
  if (!sessionId) return null;

  const session = await env.DB.prepare(
    'SELECT id, userId, expiresAt FROM sessions WHERE id = ?'
  )
    .bind(sessionId)
    .first();

  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    // 만료된 세션은 정리한다.
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    return null;
  }

  const user = await env.DB.prepare('SELECT id, name, email FROM users WHERE id = ?')
    .bind(session.userId)
    .first();

  return user || null;
}
