"use client";
import React, { useState } from "react";
import api from '@/lib/api';
import moment from "moment";
import Image from 'next/image';
import SelectedDate from "./SelectedDate";
import './AddEventModal.css';
import './Calendar.css';


const COLOR_PALETTE = ['#d3d3d3', '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7', '#9775fa', '#f783ac'];


export default function EventModal({ onClose, onSave, tags, onAddTag, clickedDate, editingEvent, isEdit}) {
  const [eventName, setEventName] = useState(editingEvent?.title || "");
  const [startDate, setStartDate] = useState(editingEvent?.start ? moment(editingEvent.start) : clickedDate);
  const [endDate, setEndDate] = useState(editingEvent?.end ? moment(editingEvent.end) : clickedDate);
  const [tagIndex, setTagIndex] = useState(() => {
    if (!editingEvent) return 0;
    return tags.findIndex(t => t.name === editingEvent.tag?.name);
  });

  const [activeTab, setActiveTab] = useState("start");
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [showTagCreator, setShowTagCreator] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(COLOR_PALETTE[0]);

  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState(0);

  const handleSave = async () => {
    if (!eventName.trim()) return alert("이벤트 이름을 입력하세요");
    const start = startDate.clone().set({ hour: startHour, minute: startMinute });
    const end = endDate.clone().set({ hour: endHour, minute: endMinute });
    // onSave({ name: eventName, start: start.toISOString(), end: end.toISOString() });
    const eventData = {
      title: eventName,
      type: 'monthly', 
      monthlyStart: start.toISOString(),
      monthlyEnd: end.toISOString(),
      
      tagNames: [event.tag.name].join(','),
      tagColors: [event.tag.color].join(',')
    };

    if (isEdit && editingEvent?.id) {
      // PUT
      try {
        await api.put(`/schedules/${editingEvent.id}`, eventData);
        console.log("수정 완료");
      } catch (err) {
        console.error("수정 실패", err);
      }
    } else {
      // POST
      onSave(eventData);  // 상위에서 POST 처리
    }
    onClose();
  };

  const handleCalendar = () => {
    setShowCalendar(!showCalendar);
  }

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

  const handleDelete = async () => {
    if (!editingEvent?.id) return alert("이벤트 ID 없음");

    try {
      await api.delete(`/schedules/${editingEvent.id}`);
      alert("삭제 완료");
      onClose(); // 닫기
    } catch (err) {
      console.error("삭제 실패", err);
      alert("삭제 실패");
    }
  };


  const icon_check_black = `/icons/check_black.png`;
  const icon_cancel_black = `/icons/cancel_black.png`;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-actions">
            <button onClick={onClose}>
              <Image src={icon_cancel_black} alt="close modal" width={20} height={20} className='modal-close-btn'/>
            </button>
            <h4 onClick={handleCalendar} className="modal-title">
              {isEdit ? "이벤트 수정" : activeTab === "start" ? startDate.format("YYYY-MM-DD") : endDate.format("YYYY-MM-DD")}
            </h4>
            <button onClick={handleSave}>
              <Image src={icon_check_black} alt="save btn" width={20} height={20} className='modal-submit-btn' />
            </button>
        </div>
        <div className="event-modal-scroll">
              <input
              type="text"
              placeholder="이벤트 이름"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="modal-input"
            />
              {showCalendar && (
                <div className="calendar-row">
                  <SelectedDate
                    selectedDate={activeTab === "start" ? startDate : endDate}
                    onSelect={(date) => {
                      if (activeTab === "start") setStartDate(date);
                      else setEndDate(date);
                      setShowCalendar(false);
                    }}
                    onActive={activeTab}
                  />
                </div>
              )}

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

            <div className="time-toggle">
              <label>
                시간 설정
              </label>
              <button onClick={() => setTimeEnabled(!timeEnabled)}>{timeEnabled ? "끄기" : "켜기"}</button>
            </div>

            {timeEnabled && (
              <div className="time-row">
                <div className="time-block">
                  <p>시작 시간</p>
                  <div className="time-selector">
                    <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}>
                      {Array.from({ length: 24 }, (_, i) => (
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

                {/* <div className="time-separator">─</div> */}

                <div className="time-block">
                  <p>종료 시간</p>
                  <div className="time-selector">
                    <select value={endHour} onChange={(e) => setEndHour(Number(e.target.value))}>
                      {Array.from({ length: 24 }, (_, i) => (
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
            )}
          </div>
          {isEdit && (
            <button className="delete-btn" onClick={handleDelete}>
              삭제
            </button>
          )}
        </div>
    </div>
  );
}
