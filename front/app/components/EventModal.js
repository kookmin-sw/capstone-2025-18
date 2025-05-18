'use client';
import React, { useState, useEffect } from "react";
import moment from "moment";
import SelectDate from "./SelectedDate";
import "./Calendar.css";

const EventModal = ({ selectedDate, events, onClose, onSave }) => {
  const [eventName, setEventName] = useState("");
  const [eventStart, setEventStart] = useState(selectedDate);
  const [eventEnd, setEventEnd] = useState(selectedDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSelectingStartDate, setIsSelectingStartDate] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isTimeEnabled, setIsTimeEnabled] = useState(false);

  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState(0);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.modal-content')) {
        const confirmCancel = window.confirm("작업을 취소하시겠습니까?");
        if (confirmCancel) onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    //if (!eventName || !eventStart || !eventEnd) return;
    if (!eventStart || !eventEnd) return;
    setEventName("test");

    const fullStart = isTimeEnabled
      ? moment(eventStart).set({ hour: startHour, minute: startMinute, second: 0 })
      : moment(eventStart).startOf('day');

    const fullEnd = isTimeEnabled
      ? moment(eventEnd).set({ hour: endHour, minute: endMinute, second: 0 })
      : moment(eventEnd).endOf('day');

    const defaultTag = { name: "기본", color: "#999999" };

    onSave({
      title: eventName,
      start: fullStart,
      end: fullEnd,
      tag: defaultTag
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {(events || []).map((event, index) => (
          <div key={index} className="event-item">{event.name}</div>
        ))}
        <button onClick={() => setShowDatePicker(true)}>
          <h3>
            {eventStart.isSame(eventEnd, 'day') ? moment(eventStart).format('YYYY-MM-DD') :
              `${moment(eventStart).format('YYYY-MM-DD')} ~ ${moment(eventEnd).format('YYYY-MM-DD')}`}
          </h3>
        </button>

        {showDatePicker && (
          <SelectDate
            selectedDate={isSelectingStartDate ? eventStart : eventEnd}
            onSelect={(date) => {
              isSelectingStartDate ? setEventStart(date) : setEventEnd(date);
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )}

        <div className="toggle-container" onClick={() => setIsTimeEnabled(!isTimeEnabled)}>
          <div className={`toggle ${isTimeEnabled ? "on" : "off"}`}></div>
          <span>시간 설정</span>
        </div>

        {isTimeEnabled && (
          <div className="time-picker">
            <label>시작 시간</label>
            <div className="time-picker-row">
              <select value={startHour} onChange={(e) => setStartHour(parseInt(e.target.value))}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')} 시</option>
                ))}
              </select>
              <select value={startMinute} onChange={(e) => setStartMinute(parseInt(e.target.value))}>
                {[0, 10, 20, 30, 40, 50].map((m) => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')} 분</option>
                ))}
              </select>
            </div>

            <label>종료 시간</label>
            <div className="time-picker-row">
              <select value={endHour} onChange={(e) => setEndHour(parseInt(e.target.value))}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')} 시</option>
                ))}
              </select>
              <select value={endMinute} onChange={(e) => setEndMinute(parseInt(e.target.value))}>
                {[0, 10, 20, 30, 40, 50].map((m) => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')} 분</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <button onClick={handleSave}>확인</button>
        <button onClick={onClose}>취소</button>
      </div>
    </div>
  );
};

export default EventModal;