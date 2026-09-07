import React from 'react';
import { CATEGORIES } from '../constants.js';

export default function FilterBar({ filters, onChange }) {
  function setCategory(value) {
    onChange({ ...filters, category: value });
  }
  function setStatus(value) {
    onChange({ ...filters, status: value });
  }
  function setSearch(value) {
    onChange({ ...filters, search: value });
  }

  return (
    <div className="filter-bar">
      <input
        className="filter-search"
        type="text"
        placeholder="제목 또는 메모 검색"
        value={filters.search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="filter-chips">
        <button
          className={`chip${filters.category === 'all' ? ' chip-active' : ''}`}
          onClick={() => setCategory('all')}
        >
          전체
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`chip${filters.category === c.value ? ' chip-active' : ''}`}
            style={filters.category === c.value ? { borderColor: c.color, color: c.color } : undefined}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="filter-status">
        <select value={filters.status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">전체</option>
          <option value="completed">완료</option>
          <option value="incomplete">미완료</option>
        </select>
      </div>
    </div>
  );
}
