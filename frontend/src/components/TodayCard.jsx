import React, { useMemo } from 'react';

function minutesBetween(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : 0;
}

export default function TodayCard({ todayEvents, onClickToday }) {
  const stats = useMemo(() => {
    const total = todayEvents.length;
    const completed = todayEvents.filter((e) => e.completed).length;
    const minutes = todayEvents.reduce((sum, e) => sum + minutesBetween(e.startTime, e.endTime), 0);
    return { total, completed, remaining: total - completed, minutes };
  }, [todayEvents]);

  return (
    <div className="today-card" onClick={onClickToday} role="button" tabIndex={0}>
      <h3>오늘의 일정 {stats.total}</h3>
      <div className="today-stats">
        <span>완료 {stats.completed}</span>
        <span>남은 일정 {stats.remaining}</span>
        <span>총 예정시간 {stats.minutes}분</span>
      </div>
    </div>
  );
}
