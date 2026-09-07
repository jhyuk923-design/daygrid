import React from 'react';
import { getCategory } from '../constants.js';

const MAX_VISIBLE = 3;

export default function DayCell({ day, dateStr, events, isToday, isSelected, isCurrentMonth, onClick }) {
  const visible = events.slice(0, MAX_VISIBLE);
  const overflow = events.length - visible.length;

  return (
    <button
      type="button"
      className={[
        'day-cell',
        !isCurrentMonth ? 'day-cell-muted' : '',
        isToday ? 'day-cell-today' : '',
        isSelected ? 'day-cell-selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onClick(dateStr)}
    >
      <span className="day-number">{day}</span>
      <div className="day-events">
        {visible.map((ev) => {
          const cat = getCategory(ev.category);
          return (
            <span
              key={ev.id}
              className={`day-event-chip${ev.completed ? ' day-event-done' : ''}`}
              style={{ borderLeftColor: cat.color }}
              title={ev.title}
            >
              {ev.title}
            </span>
          );
        })}
        {overflow > 0 && <span className="day-event-more">+{overflow}개 더보기</span>}
      </div>
    </button>
  );
}
