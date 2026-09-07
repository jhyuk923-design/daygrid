import React, { useState } from 'react';
import EventForm from './EventForm.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import CategoryTag from './CategoryTag.jsx';

export default function EventModal({
  date,
  events,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onToggle,
}) {
  const [mode, setMode] = useState('list'); // 'list' | 'add' | 'edit'
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(payload) {
    setSubmitting(true);
    try {
      await onCreate(payload);
      setMode('list');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(payload) {
    setSubmitting(true);
    try {
      await onUpdate(editingEvent.id, payload);
      setMode('list');
      setEditingEvent(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await onDelete(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{date}</h2>
          <button className="modal-close" onClick={onClose} aria-label="닫기">
            &times;
          </button>
        </div>

        {mode === 'list' && (
          <>
            <div className="event-list">
              {events.length === 0 && <p className="empty-state">등록된 일정이 없습니다.</p>}
              {events.map((ev) => (
                <div key={ev.id} className={`event-item${ev.completed ? ' event-item-done' : ''}`}>
                  <input
                    type="checkbox"
                    checked={ev.completed}
                    onChange={() => onToggle(ev.id)}
                    aria-label="완료 여부"
                  />
                  <div className="event-item-body">
                    <div className="event-item-title-row">
                      <span className="event-item-title">{ev.title}</span>
                      <CategoryTag category={ev.category} small />
                    </div>
                    {(ev.startTime || ev.endTime) && (
                      <div className="event-item-time">
                        {ev.startTime || '--:--'} ~ {ev.endTime || '--:--'}
                      </div>
                    )}
                    {ev.memo && <div className="event-item-memo">{ev.memo}</div>}
                  </div>
                  <div className="event-item-actions">
                    <button
                      className="icon-btn"
                      onClick={() => {
                        setEditingEvent(ev);
                        setMode('edit');
                      }}
                      aria-label="수정"
                    >
                      수정
                    </button>
                    <button className="icon-btn icon-btn-danger" onClick={() => setDeleteTarget(ev)} aria-label="삭제">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-primary btn-block" onClick={() => setMode('add')}>
              + 일정 추가
            </button>
          </>
        )}

        {mode === 'add' && (
          <EventForm
            initial={{ date }}
            submitting={submitting}
            onSubmit={handleCreate}
            onCancel={() => setMode('list')}
          />
        )}

        {mode === 'edit' && editingEvent && (
          <EventForm
            initial={editingEvent}
            submitting={submitting}
            onSubmit={handleUpdate}
            onCancel={() => {
              setMode('list');
              setEditingEvent(null);
            }}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="일정 삭제"
        message="정말 이 일정을 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
