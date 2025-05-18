'use client';
import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import './MiniCalendar.css'; 

const MiniCalendar = ({ currentDate, onSelect, onClose }) => {
  const [viewingMonth, setViewingMonth] = useState(currentDate.clone());
  const startOfMonth = viewingMonth.clone().startOf('month');
  const endOfMonth = viewingMonth.clone().endOf('month');
  const today = moment();
  const selected = currentDate;

  const days = [];
  const startDayOfWeek = startOfMonth.day(); // Sunday = 0
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= endOfMonth.date(); i++) {
    days.push(moment(viewingMonth).date(i));
  }

  useEffect(() => {
    setViewingMonth(currentDate.clone());
  }, [currentDate]);

  const pickerRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const goPrevMonth = () => {
    setViewingMonth(prev => prev.clone().subtract(1, 'month'));
  };

  const goNextMonth = () => {
    setViewingMonth(prev => prev.clone().add(1, 'month'));
  };

  const handleXBtn = () => {
    onClose(); // ✅ 함수 호출로 수정
  };

  return (
    <div className="mini-calendar" ref={pickerRef}>
      <button className="mini-calendar-close" onClick={handleXBtn}>×</button>

      <div className="mini-calendar-nav">
        <button onClick={goPrevMonth}>◀</button>
        <span>{viewingMonth.format('YYYY년 M월')}</span>
        <button onClick={goNextMonth}>▶</button>
      </div>

      <div className="mini-calendar-header-row">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, idx) => (
          <div key={idx} className="mini-day-name">{d}</div>
        ))}
      </div>

      <div className="mini-calendar-grid">
        {days.map((day, idx) => {
          const isToday = day && day.isSame(today, 'day');
          const isSelected = day && day.isSame(selected, 'day');
          return (
            <div
              key={idx}
              className='mini-day-cell'
              onClick={() => day && onSelect(day.clone())}
            >
              {day ? <span className="mini-day-text">{day.date()}</span> : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;