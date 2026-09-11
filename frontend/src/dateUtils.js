export function pad(n) {
  return String(n).padStart(2, '0');
}

// 사용자의 로컬 시간대 기준 오늘 날짜 문자열 (YYYY-MM-DD).
export function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function addMonths(year, month, delta) {
  const total = (year * 12 + (month - 1)) + delta;
  const newYear = Math.floor(total / 12);
  const newMonth = (total % 12) + 1;
  return { year: newYear, month: newMonth };
}

export function monthLabel(year, month) {
  return `${year}년 ${month}월`;
}
