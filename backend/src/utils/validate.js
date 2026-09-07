// 서버 측 입력 검증. 프론트엔드 검증을 신뢰하지 않고 항상 여기서 다시 검사한다.

export const CATEGORIES = ['study', 'work', 'exercise', 'music', 'appointment', 'etc'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_REGEX.test(email);
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8 && password.length <= 200;
}

export function isValidDate(date) {
  if (typeof date !== 'string' || !DATE_REGEX.test(date)) return false;
  const d = new Date(date + 'T00:00:00Z');
  return !Number.isNaN(d.getTime());
}

export function isValidTime(time) {
  if (time === null || time === undefined || time === '') return true; // 선택 항목
  return typeof time === 'string' && TIME_REGEX.test(time);
}

export function isValidCategory(category) {
  return CATEGORIES.includes(category);
}

export function validateRegisterInput(body) {
  const errors = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';

  if (!name || name.length > 50) {
    errors.push('이름을 1~50자로 입력해주세요.');
  }
  if (!isValidEmail(body.email)) {
    errors.push('올바른 이메일 형식이 아닙니다.');
  }
  if (!isValidPassword(body.password)) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
  }
  if (body.password !== body.passwordConfirm) {
    errors.push('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
  }

  return { valid: errors.length === 0, errors, name };
}

export function validateLoginInput(body) {
  const errors = [];
  if (!isValidEmail(body.email)) errors.push('올바른 이메일 형식이 아닙니다.');
  if (typeof body.password !== 'string' || body.password.length === 0) {
    errors.push('비밀번호를 입력해주세요.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateEventInput(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!partial || body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title || title.length > 100) {
      errors.push('제목은 1~100자로 입력해주세요.');
    }
    data.title = title;
  }

  if (!partial || body.date !== undefined) {
    if (!isValidDate(body.date)) errors.push('날짜 형식이 올바르지 않습니다 (YYYY-MM-DD).');
    data.date = body.date;
  }

  if (!partial || body.startTime !== undefined) {
    if (!isValidTime(body.startTime)) errors.push('시작 시간 형식이 올바르지 않습니다 (HH:MM).');
    data.startTime = body.startTime || null;
  }

  if (!partial || body.endTime !== undefined) {
    if (!isValidTime(body.endTime)) errors.push('종료 시간 형식이 올바르지 않습니다 (HH:MM).');
    data.endTime = body.endTime || null;
  }

  if (data.startTime && data.endTime && data.startTime > data.endTime) {
    errors.push('종료 시간은 시작 시간보다 늦어야 합니다.');
  }

  if (!partial || body.category !== undefined) {
    if (!isValidCategory(body.category)) errors.push('올바르지 않은 카테고리입니다.');
    data.category = body.category;
  }

  if (!partial || body.memo !== undefined) {
    const memo = typeof body.memo === 'string' ? body.memo : '';
    if (memo.length > 1000) errors.push('메모는 1000자를 넘을 수 없습니다.');
    data.memo = memo;
  }

  return { valid: errors.length === 0, errors, data };
}
