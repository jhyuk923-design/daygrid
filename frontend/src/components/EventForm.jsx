import React, { useState } from 'react';
import { CATEGORIES } from '../constants.js';

export default function EventForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    date: initial?.date || '',
    startTime: initial?.startTime || '',
    endTime: initial?.endTime || '',
    category: initial?.category || CATEGORIES[0].value,
    memo: initial?.memo || '',
  });
  const [error, setError] = useState('');

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validate() {
    if (!form.title.trim()) return '제목을 입력해주세요.';
    if (!form.date) return '날짜를 선택해주세요.';
    if (form.startTime && form.endTime && form.startTime > form.endTime) {
      return '종료 시간은 시작 시간보다 늦어야 합니다.';
    }
    if (form.memo.length > 1000) return '메모는 1000자를 넘을 수 없습니다.';
    return '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    onSubmit({ ...form, title: form.title.trim() });
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <label>
        제목
        <input value={form.title} onChange={update('title')} maxLength={100} required autoFocus />
      </label>

      <label>
        날짜
        <input type="date" value={form.date} onChange={update('date')} required />
      </label>

      <div className="form-row">
        <label>
          시작 시간
          <input type="time" value={form.startTime} onChange={update('startTime')} />
        </label>
        <label>
          종료 시간
          <input type="time" value={form.endTime} onChange={update('endTime')} />
        </label>
      </div>

      <label>
        카테고리
        <select value={form.category} onChange={update('category')}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        메모
        <textarea value={form.memo} onChange={update('memo')} maxLength={1000} rows={3} />
      </label>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}
