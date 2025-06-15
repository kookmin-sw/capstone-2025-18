import React from 'react';
import './EventListModal.css';

const EventListModal = ({ events, onClose, onAdd, onEdit }) => {
  return (
    <div className="event-list-modal-overlay">
      <div className="event-list-modal-content">
        <div className="event-list-header">
          <h3>이벤트 목록</h3>
          <button onClick={onClose}>닫기</button>
        </div>

        {events.length === 0 ? (
          <p>이날짜에 이벤트가 없습니다.</p>
        ) : (
          <ul className="event-list">
            {events.map((ev, idx) => (
              <li key={ev.id || `${ev.title}-${idx}`} onClick={() => onEdit(ev)}>
                <span className="event-tag" style={{ backgroundColor: ev.tag.color }} />
                {ev.title}
              </li>
            ))}
          </ul>
        )}

        <button className="event-list-add-btn" onClick={onAdd}>＋</button>
      </div>
    </div>
  );
};

export default EventListModal;
