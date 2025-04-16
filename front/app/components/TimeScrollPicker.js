
'use client';
import React, { useState, useEffect, useRef } from 'react';
import './TimeScrollPicker.css';

const TimeScrollPicker = ({ onTimeChange }) => {
  const now = new Date();
  const currentHour = now.getHours();
  const [startTime, setStartTime] = useState(currentHour);
  const [endTime, setEndTime] = useState(currentHour + 1 > 24 ? 24 : currentHour + 1);

  const handleStartChange = (e) => {
    const newStart = parseInt(e.target.value);
    setStartTime(newStart);
    if (newStart >= endTime) {
      const newEnd = newStart + 1 > 24 ? 24 : newStart + 1;
      setEndTime(newEnd);
    }
    onTimeChange(newStart, endTime);
  };

  const handleEndChange = (e) => {
    const newEnd = parseInt(e.target.value);
    if (newEnd > startTime) {
      setEndTime(newEnd);
      onTimeChange(startTime, newEnd);
    }
  };

  return (
    <div className="time-scroll-wrapper">
      <div className="time-column">
        <label>시작 시간</label>
        <select value={startTime} onChange={handleStartChange}>
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
          ))}
        </select>
      </div>
      <div className="time-column">
        <label>종료 시간</label>
        <select value={endTime} onChange={handleEndChange}>
          {Array.from({ length: 25 - startTime - 1 }, (_, i) => {
            const hour = startTime + 1 + i;
            return <option key={hour} value={hour}>{`${hour.toString().padStart(2, '0')}:00`}</option>;
          })}
        </select>
      </div>
    </div>
  );
};

export default TimeScrollPicker;
