// /api/events/* 라우트: 일정 CRUD
// 모든 핸들러는 이미 인증(로그인)된 사용자(user)를 전달받는다.
// 인가(authorization) 원칙: 조회/수정/삭제 시 항상 "id + userId"로 조건을 걸어
// 다른 사용자의 일정에는 절대 접근할 수 없도록 한다.

import { json, errorResponse, serverError } from '../utils/response.js';
import { validateEventInput } from '../utils/validate.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

// year, month(1~12)로 해당 월의 시작일/종료일(YYYY-MM-DD)을 계산한다.
function monthRange(year, month) {
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { start, end };
}

// GET /api/events?year=YYYY&month=M
// 전체 테이블을 읽지 않고, 해당 월의 데이터만 인덱스(userId, date)를 이용해 조회한다.
export async function handleListEvents(request, user, env) {
  const url = new URL(request.url);
  const now = new Date();
  const year = Number(url.searchParams.get('year')) || now.getUTCFullYear();
  const month = Number(url.searchParams.get('month')) || now.getUTCMonth() + 1;

  if (!Number.isInteger(year) || year < 1970 || year > 9999) {
    return errorResponse('year 값이 올바르지 않습니다.', 400);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return errorResponse('month 값은 1~12 사이여야 합니다.', 400);
  }

  const { start, end } = monthRange(year, month);

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, title, date, startTime, endTime, category, memo, completed, createdAt, updatedAt
       FROM events
       WHERE userId = ? AND date >= ? AND date <= ?
       ORDER BY date ASC, startTime ASC`
    )
      .bind(user.id, start, end)
      .all();

    return json({
      year,
      month,
      events: results.map((e) => ({ ...e, completed: !!e.completed })),
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function handleGetEvent(request, user, env, id) {
  try {
    const event = await env.DB.prepare(
      `SELECT id, title, date, startTime, endTime, category, memo, completed, createdAt, updatedAt
       FROM events WHERE id = ? AND userId = ?`
    )
      .bind(id, user.id)
      .first();

    if (!event) return errorResponse('일정을 찾을 수 없습니다.', 404);
    return json({ ...event, completed: !!event.completed });
  } catch (err) {
    return serverError(err);
  }
}

export async function handleCreateEvent(request, user, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('요청 본문이 올바른 JSON이 아닙니다.', 400);
  }

  const { valid, errors, data } = validateEventInput(body);
  if (!valid) return errorResponse(errors.join(' '), 400);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO events (id, userId, title, date, startTime, endTime, category, memo, completed, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
      .bind(id, user.id, data.title, data.date, data.startTime, data.endTime, data.category, data.memo, now, now)
      .run();

    return json(
      {
        id,
        userId: user.id,
        title: data.title,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        category: data.category,
        memo: data.memo,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      201
    );
  } catch (err) {
    return serverError(err);
  }
}

export async function handleUpdateEvent(request, user, env, id) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('요청 본문이 올바른 JSON이 아닙니다.', 400);
  }

  const { valid, errors, data } = validateEventInput(body);
  if (!valid) return errorResponse(errors.join(' '), 400);

  try {
    const existing = await env.DB.prepare('SELECT id FROM events WHERE id = ? AND userId = ?')
      .bind(id, user.id)
      .first();
    if (!existing) return errorResponse('일정을 찾을 수 없습니다.', 404);

    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE events
       SET title = ?, date = ?, startTime = ?, endTime = ?, category = ?, memo = ?, updatedAt = ?
       WHERE id = ? AND userId = ?`
    )
      .bind(data.title, data.date, data.startTime, data.endTime, data.category, data.memo, now, id, user.id)
      .run();

    return json({ id, ...data, updatedAt: now });
  } catch (err) {
    return serverError(err);
  }
}

export async function handleDeleteEvent(request, user, env, id) {
  try {
    const result = await env.DB.prepare('DELETE FROM events WHERE id = ? AND userId = ?')
      .bind(id, user.id)
      .run();

    if (!result.meta || result.meta.changes === 0) {
      return errorResponse('일정을 찾을 수 없습니다.', 404);
    }

    return json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

export async function handleToggleEvent(request, user, env, id) {
  try {
    const existing = await env.DB.prepare(
      'SELECT id, completed FROM events WHERE id = ? AND userId = ?'
    )
      .bind(id, user.id)
      .first();
    if (!existing) return errorResponse('일정을 찾을 수 없습니다.', 404);

    const newCompleted = existing.completed ? 0 : 1;
    const now = new Date().toISOString();

    await env.DB.prepare('UPDATE events SET completed = ?, updatedAt = ? WHERE id = ? AND userId = ?')
      .bind(newCompleted, now, id, user.id)
      .run();

    return json({ id, completed: !!newCompleted, updatedAt: now });
  } catch (err) {
    return serverError(err);
  }
}
