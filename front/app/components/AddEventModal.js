'use client';
import React, { useState, useEffect } from 'react';
import './AddEventModal.css';

const COLOR_PALETTE = ['#d3d3d3', '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#9775fa', '#f783ac'];
const DAYS = ['일','월', '화', '수', '목', '금', '토', ];

const AddEventModal = ({ onClose, onSave, tags, onAddTag, defaultDay, defaultStart, defaultEnd, defaultTitle, defaultTag = null }) => {
  const [title, setTitle] = useState('');
  const [daysSelected, setDaysSelected] = useState([]);
  const [start, setStart] = useState(defaultStart ?? 0);
  const [end, setEnd] = useState(defaultEnd ?? 1);
  const [tagIndex, setTagIndex] = useState(0);
  const [showTagCreator, setShowTagCreator] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(COLOR_PALETTE[0]);

  useEffect(() => {
    if (typeof defaultTitle === 'string') setTitle(defaultTitle);
  }, [defaultTitle]);

  useEffect(() => {
    if (typeof defaultDay === 'number') setDaysSelected([defaultDay]);
    else setDaysSelected([]);
  }, [defaultDay]);

  useEffect(() => {
    if (defaultTag) {
      const found = tags.findIndex(t => t.name === defaultTag.name && t.color === defaultTag.color);
      if (found !== -1) setTagIndex(found);
    }
  }, [defaultTag, tags]);

  const handleSubmit = () => {
    if (!title || start >= end || daysSelected.length === 0) return;
    daysSelected.forEach(day => {
      onSave({ title, day, startHour: start, endHour: end, tag: tags[tagIndex] });
    });
    onClose();
  };

  const handleAddNewTag = () => {
    if (newTagName && newTagColor) {
      const newTag = { name: newTagName, color: newTagColor, id: crypto.randomUUID() };
      onAddTag(newTag); // 상위로 딱 한 번만 전달!
      setTagIndex(tags.length); // 다음 인덱스
      setNewTagName('');
      setNewTagColor(COLOR_PALETTE[0]);
      setShowTagCreator(false);
    }
  };

  const toggleDay = (index) => {
    setDaysSelected(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const isEditing = typeof defaultTitle === 'string' && defaultTitle.trim().length > 0;
  const isFromDrag = defaultDay === 'drag';

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{isEditing ? '일정 수정' : '일정 추가'}</h3>

        <label>제목</label>
        <input value={title} onChange={e => setTitle(e.target.value)} />

        {!isFromDrag && (
          <>
            <label>요일</label>
            <div className="day-selector">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  className={`day-btn ${daysSelected.includes(i) ? 'selected' : ''}`}
                  onClick={() => toggleDay(i)}
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}

        <label>시작 시간</label>
        <select value={start} onChange={e => setStart(parseInt(e.target.value))}>
          {Array.from({ length: 25 }, (_, i) => (
            <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
          ))}
        </select>

        <label>종료 시간</label>
        <select value={end} onChange={e => setEnd(parseInt(e.target.value))}>
          {Array.from({ length: 25 }, (_, i) => (
            <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
          ))}
        </select>

        <div className="tag-options">
          {tags.map((tag, i) => (
            <button
              key={i}
              className={`tag-btn ${tagIndex === i ? 'selected' : ''}`}
              style={{ backgroundColor: tag.color }}
              onClick={() => setTagIndex(i)}
            >
              {tag.name}
            </button>
          ))}
          <button className="add-tag-btn" onClick={() => setShowTagCreator(true)}>+ 태그 추가</button>
        </div>

        {showTagCreator && (
          <div className="tag-creator">
            <input
              type="text"
              placeholder="태그 이름"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
            />
            <div className="color-palette">
              {COLOR_PALETTE.map(color => (
                <div
                  key={color}
                  className={`color-swatch ${newTagColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewTagColor(color)}
                />
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={handleAddNewTag}>태그 생성</button>
              <button onClick={() => setShowTagCreator(false)}>취소</button>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={handleSubmit}>확인</button>
          <button onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;
