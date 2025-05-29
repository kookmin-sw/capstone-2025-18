'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import './AddEventModal.css';

const COLOR_PALETTE = ['#d3d3d3', '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#9775fa', '#f783ac'];
const DAYS = ['일','월', '화', '수', '목', '금', '토', ];

const AddEventModal = ({ onClose, onSave, tags, onAddTag, defaultDay, defaultStart, defaultEnd, defaultTitle, defaultStartMinute, defaultEndMinute, defaultTag = null }) => {
  const [title, setTitle] = useState('');
  const [daysSelected, setDaysSelected] = useState([]);
  const [start, setStart] = useState(defaultStart ?? 0);
  const [end, setEnd] = useState(defaultEnd ?? 1);
  
  const [tagIndex, setTagIndex] = useState(0);
  const [showTagCreator, setShowTagCreator] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(COLOR_PALETTE[0]);

  const [startMinute, setStartMinute] = useState(defaultStartMinute ?? 0);
  const [endMinute, setEndMinute] = useState(defaultEndMinute ?? 0);


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

  const handleSubmit = (e) => {
    e.preventDefault();

    const isTimeInvalid =
      start > end ||
      (start === end && startMinute >= endMinute);

    if (!title || isTimeInvalid || daysSelected.length === 0) {
      console.warn("조건 불만족으로 저장 중단");
      return;
    }

    const eventsToSave = daysSelected.map(day => ({
      title,
      day,
      startHour: start,
      startMinute,
      endHour: end,
      endMinute,
      tag: tags[tagIndex],
    }));

    eventsToSave.forEach(ev => onSave(ev));

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

  const icon_check_black = `/icons/check_black.png`;
  const icon_cancel_black = `/icons/cancel_black.png`;

  return (
    <div className="modal-overlay">
      <div className="modal-content">

        <div className="modal-actions" onClick={onClose}>
          <button onClick={onClose}>
            <Image src={icon_cancel_black} alt="close btn" width={20} height={20} className='modal-close-btn'/>
          </button>
          <h3>{isEditing ? '일정 수정' : '일정 추가'}</h3>
          <button onClick={handleSubmit}>
            <Image src={icon_check_black} alt='save btn' width={20} height={20} className='modal-submit-btn' />
          </button>
        </div>

        <div className='add-input-section'>
          <label> 제목</label>
          <input value={title} onChange={e => setTitle(e.target.value)} />

          {!isFromDrag && (
            <>
              <label> 요일</label>
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
          
          <div className='add-event-time'> 
            <div className='add-event-time-start'>
              <label>시작 시간</label>

              <div className="time-selector">
                <select value={start} onChange={e => setStart(parseInt(e.target.value))}>
                  {Array.from({ length: 25 }, (_, i) => (
                      <option key={i} value={i}>{i}시</option>
                  ))}
                </select>
                <select value={startMinute} onChange={(e) => setStartMinute(Number(e.target.value))}>
                  {[0, 10, 20, 30, 40, 50].map((m) => (
                    <option key={m} value={m}>{m}분</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className='add-event-time-end'>
              <label>종료 시간</label>
              <div className="time-selector">
                <select value={end} onChange={e => setEnd(parseInt(e.target.value))}>
                  {Array.from({ length: 25 }, (_, i) => (
                    <option key={i} value={i}>{i}시</option>
                  ))}
                </select>
                <select value={endMinute} onChange={(e) => setEndMinute(Number(e.target.value))}>
                  {[0, 10, 20, 30, 40, 50].map((m) => (
                    <option key={m} value={m}>{m}분</option>
                  ))}
                </select>
              </div>
            </div>
            

          </div>

          <div className="tag-options">
            <div className="tag-options">
              {tags.map((tag, i) => (
                <button
                  key={tag.id ?? tag._id ?? `${tag.name}-${i}`}
                  className={`tag-btn ${tagIndex === i ? 'selected' : ''}`}
                  style={{ backgroundColor: tag.color }}
                  onClick={() => setTagIndex(i)}
                >
                  {tag.name}
                </button>
              ))}
              <button className="add-tag-btn" onClick={() => setShowTagCreator(true)}>+ 태그 추가</button>
            </div>
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
                <button onClick={() => setShowTagCreator(false)}>
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default AddEventModal;
