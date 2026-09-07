// 백엔드 utils/validate.js의 CATEGORIES와 반드시 일치해야 한다.
export const CATEGORIES = [
  { value: 'study', label: '공부', color: '#4F46E5' },
  { value: 'work', label: '업무', color: '#0EA5E9' },
  { value: 'exercise', label: '운동', color: '#16A34A' },
  { value: 'music', label: '음악', color: '#D946EF' },
  { value: 'appointment', label: '약속', color: '#F59E0B' },
  { value: 'etc', label: '기타', color: '#6B7280' },
];

export function getCategory(value) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];
}

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
