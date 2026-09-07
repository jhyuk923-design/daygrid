// /api/auth/* 라우트: 회원가입, 로그인, 로그인 상태 확인, 로그아웃

import { json, errorResponse, serverError } from '../utils/response.js';
import { hashPassword, verifyPassword, generateToken } from '../utils/password.js';
import { validateRegisterInput, validateLoginInput } from '../utils/validate.js';
import {
  buildSessionCookie,
  buildClearSessionCookie,
  parseCookies,
  SESSION_COOKIE_NAME,
  getCurrentUser,
} from '../middleware/auth.js';

const SESSION_TTL_DAYS_DEFAULT = 7;

function sessionTtlSeconds(env) {
  const days = Number(env.SESSION_TTL_DAYS) || SESSION_TTL_DAYS_DEFAULT;
  return days * 24 * 60 * 60;
}

export async function handleRegister(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('요청 본문이 올바른 JSON이 아닙니다.', 400);
  }

  const { valid, errors, name } = validateRegisterInput(body);
  if (!valid) return errorResponse(errors.join(' '), 400);

  const email = body.email.trim().toLowerCase();

  try {
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first();
    if (existing) {
      return errorResponse('이미 가입된 이메일입니다.', 409);
    }

    const { hash, salt } = await hashPassword(body.password);
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await env.DB.prepare(
      'INSERT INTO users (id, name, email, passwordHash, salt, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(id, name, email, hash, salt, createdAt)
      .run();

    return json({ id, name, email }, 201);
  } catch (err) {
    // UNIQUE 제약 충돌(동시 가입 요청 등)에 대한 방어
    if (String(err && err.message).includes('UNIQUE')) {
      return errorResponse('이미 가입된 이메일입니다.', 409);
    }
    return serverError(err);
  }
}

export async function handleLogin(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('요청 본문이 올바른 JSON이 아닙니다.', 400);
  }

  const { valid, errors } = validateLoginInput(body);
  if (!valid) return errorResponse(errors.join(' '), 400);

  const email = body.email.trim().toLowerCase();

  try {
    const user = await env.DB.prepare(
      'SELECT id, name, email, passwordHash, salt FROM users WHERE email = ?'
    )
      .bind(email)
      .first();

    // 사용자 존재 여부를 노출하지 않기 위해 동일한 오류 메시지 사용
    if (!user) return errorResponse('이메일 또는 비밀번호가 올바르지 않습니다.', 401);

    const ok = await verifyPassword(body.password, user.salt, user.passwordHash);
    if (!ok) return errorResponse('이메일 또는 비밀번호가 올바르지 않습니다.', 401);

    const token = generateToken();
    const ttl = sessionTtlSeconds(env);
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    const createdAt = new Date().toISOString();

    await env.DB.prepare(
      'INSERT INTO sessions (id, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)'
    )
      .bind(token, user.id, expiresAt, createdAt)
      .run();

    return json(
      { id: user.id, name: user.name, email: user.email },
      200,
      { 'Set-Cookie': buildSessionCookie(request, token, ttl) }
    );
  } catch (err) {
    return serverError(err);
  }
}

export async function handleMe(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return errorResponse('로그인이 필요합니다.', 401);
  return json(user);
}

export async function handleLogout(request, env) {
  const cookies = parseCookies(request);
  const sessionId = cookies[SESSION_COOKIE_NAME];

  try {
    if (sessionId) {
      await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    }
    return json({ ok: true }, 200, { 'Set-Cookie': buildClearSessionCookie(request) });
  } catch (err) {
    return serverError(err);
  }
}
