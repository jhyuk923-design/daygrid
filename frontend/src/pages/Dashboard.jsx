import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';
import * as api from '../services/api.js';
import Calendar from '../components/Calendar.jsx';
import EventModal from '../components/EventModal.jsx';
import TodayCard from '../components/TodayCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import { todayStr, currentYearMonth, addMonths, monthLabel } from '../dateUtils.js';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const showToast = useToast();

  const initial = currentYearMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [filters, setFilters] = useState({ category: 'all', status: 'all', search: '' });

  const today = todayStr();

  // 달이 바뀔 때만 서버에 요청한다 (한 달치 데이터를 한 번에 가져옴).
  const loadEvents = useCallback(async (y, m) => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await api.fetchEvents(y, m);
      setEvents(data.events);
    } catch (err) {
      setLoadError(err.message || '일정을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents(year, month);
  }, [year, month, loadEvents]);

  function goToMonth(y, m) {
    setYear(y);
    setMonth(m);
    setSelectedDate(null);
  }

  function handlePrev() {
    const { year: y, month: m } = addMonths(year, month, -1);
    goToMonth(y, m);
  }
  function handleNext() {
    const { year: y, month: m } = addMonths(year, month, 1);
    goToMonth(y, m);
  }
  function handleToday() {
    const { year: y, month: m } = currentYearMonth();
    goToMonth(y, m);
    setSelectedDate(today);
  }

  // 검색/카테고리/완료 필터는 이미 받아온 월간 데이터에서 프론트에서 처리한다.
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filters.category !== 'all' && ev.category !== filters.category) return false;
      if (filters.status === 'completed' && !ev.completed) return false;
      if (filters.status === 'incomplete' && ev.completed) return false;
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        const hay = `${ev.title} ${ev.memo || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, filters]);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of filteredEvents) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [filteredEvents]);

  const todayEvents = useMemo(() => events.filter((ev) => ev.date === today), [events, today]);

  const selectedEvents = selectedDate ? events.filter((ev) => ev.date === selectedDate) : [];

  async function handleCreate(payload) {
    try {
      const created = await api.createEvent(payload);
      // 현재 보고 있는 달의 데이터라면 화면에도 바로 반영한다.
      if (created.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)) {
        setEvents((prev) => [...prev, created]);
      }
      showToast('일정이 추가되었습니다.', 'success');
    } catch (err) {
      showToast(err.message || '일정 추가에 실패했습니다.', 'error');
      throw err;
    }
  }

  async function handleUpdate(id, payload) {
    try {
      const updated = await api.updateEvent(id, payload);
      const stillInMonth = updated.date.startsWith(`${year}-${String(month).padStart(2, '0')}`);
      setEvents((prev) => {
        const withoutOld = prev.filter((e) => e.id !== id);
        if (!stillInMonth) return withoutOld;
        return [...withoutOld, { ...updated, id }];
      });
      showToast('일정이 수정되었습니다.', 'success');
    } catch (err) {
      showToast(err.message || '일정 수정에 실패했습니다.', 'error');
      throw err;
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      showToast('일정이 삭제되었습니다.', 'success');
    } catch (err) {
      showToast(err.message || '일정 삭제에 실패했습니다.', 'error');
    }
  }

  async function handleToggle(id) {
    try {
      const result = await api.toggleEvent(id);
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, completed: result.completed } : e)));
    } catch (err) {
      showToast(err.message || '상태 변경에 실패했습니다.', 'error');
    }
  }

  async function handleLogout() {
    await logout();
    showToast('로그아웃되었습니다.', 'success');
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="logo">DayGrid</span>
          <div className="month-nav">
            <button className="icon-btn" onClick={handlePrev} aria-label="이전 달">
              &#8592;
            </button>
            <span className="month-label">{monthLabel(year, month)}</span>
            <button className="icon-btn" onClick={handleNext} aria-label="다음 달">
              &#8594;
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleToday}>
              오늘
            </button>
          </div>
        </div>
        <div className="header-right">
          <span className="user-name">{user?.name}님</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <aside className="dashboard-side">
          <TodayCard todayEvents={todayEvents} onClickToday={handleToday} />
          <FilterBar filters={filters} onChange={setFilters} />
        </aside>

        <section className="dashboard-calendar">
          {loading && <div className="loading-bar">불러오는 중...</div>}
          {loadError && (
            <div className="error-banner">
              {loadError}{' '}
              <button className="btn btn-ghost btn-sm" onClick={() => loadEvents(year, month)}>
                다시 시도
              </button>
            </div>
          )}
          <Calendar
            year={year}
            month={month}
            eventsByDate={eventsByDate}
            todayStr={today}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </section>
      </main>

      {selectedDate && (
        <EventModal
          date={selectedDate}
          events={selectedEvents}
          onClose={() => setSelectedDate(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}
