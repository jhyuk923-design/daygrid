import React, { useMemo } from 'react';
import DayCell from './DayCell.jsx';
import { WEEKDAYS } from '../constants.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateStr(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

// year, month(1~12) 기준으로 6주(42칸) 캘린더 그리드를 만든다.
function buildGrid(year, month) {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay(); // 0=일요일
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  const cells = [];

  for (let i = 0; i < startWeekday; i++) {
    const day = daysInPrevMonth - startWeekday + 1 + i;
    const prevMonthDate = new Date(Date.UTC(year, month - 2, day));
    cells.push({
      day,
      dateStr: toDateStr(prevMonthDate.getUTCFullYear(), prevMonthDate.getUTCMonth() + 1, day),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, dateStr: toDateStr(year, month, day), isCurrentMonth: true });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const nextMonthDate = new Date(Date.UTC(year, month, nextDay));
    cells.push({
      day: nextDay,
      dateStr: toDateStr(nextMonthDate.getUTCFullYear(), nextMonthDate.getUTCMonth() + 1, nextDay),
      isCurrentMonth: false,
    });
    nextDay += 1;
    if (cells.length >= 42) break;
  }

  return cells;
}

export default function Calendar({ year, month, eventsByDate, todayStr, selectedDate, onSelectDate }) {
  const cells = useMemo(() => buildGrid(year, month), [year, month]);

  return (
    <div className="calendar">
      <div className="calendar-weekdays">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`weekday${i === 0 ? ' weekday-sun' : ''}${i === 6 ? ' weekday-sat' : ''}`}>
            {w}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => (
          <DayCell
            key={cell.dateStr + (cell.isCurrentMonth ? '' : '-o')}
            day={cell.day}
            dateStr={cell.dateStr}
            events={eventsByDate[cell.dateStr] || []}
            isToday={cell.dateStr === todayStr}
            isSelected={cell.dateStr === selectedDate}
            isCurrentMonth={cell.isCurrentMonth}
            onClick={onSelectDate}
          />
        ))}
      </div>
    </div>
  );
}
