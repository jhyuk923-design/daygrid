// 백엔드(Cloudflare Worker) REST API와 통신하는 유일한 창구.
// 상대 경로('/api/...')를 사용하므로 개발 환경(Vite 프록시)과 배포 환경
// (같은 Worker가 프론트+백엔드를 서빙)에서 동일한 코드로 동작한다.

const BASE = '/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `요청이 실패했습니다. (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data;
}

// ---- 인증 ----
export function register({ name, email, password, passwordConfirm }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, passwordConfirm }),
  });
}

export function login({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe() {
  return request('/auth/me');
}

export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

// ---- 일정 ----
export function fetchEvents(year, month) {
  return request(`/events?year=${year}&month=${month}`);
}

export function createEvent(payload) {
  return request('/events', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateEvent(id, payload) {
  return request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteEvent(id) {
  return request(`/events/${id}`, { method: 'DELETE' });
}

export function toggleEvent(id) {
  return request(`/events/${id}/toggle`, { method: 'PATCH' });
}

export { ApiError };
