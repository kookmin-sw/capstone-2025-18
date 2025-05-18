'use client';
import React, { useState } from 'react';
import moment from 'moment';
import './GroupTable.css';
import './TimeTable.css';
import MiniCalendar from './MiniCalendar';

const hours = Array.from({ length: 24 }, (_, i) => `${i}`);
const days = ['일', '월', '화', '수', '목', '금', '토'];
const heartSrc = `/icons/heart.png`;
const TIME_BLOCK_LENGTH = 3;

const UNAVAILABLE_BLOCKS = [
  { day: 1, start: 10, end: 13 },
  { day: 2, start: 14, end: 16 },
  { day: 3, start: 10, end: 16 },
  { day: 4, start: 0, end: 2 },
  { day: 5, start: 0, end: 2 },
];

const GroupTable = () => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [fixedSelection, setFixedSelection] = useState(null);
  const [tempSelection, setTempSelection] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ x: 0, y: 0 });

  const handleDateClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCalendarPosition({ x: rect.left, y: rect.bottom });
    setShowCalendar(!showCalendar);
  };

  const getUnavailableRangeMap = () => {
    const map = {};
    UNAVAILABLE_BLOCKS.forEach(({ day, start, end }) => {
      for (let h = start; h < end; h++) {
        if (!map[day]) map[day] = [];
        map[day].push(h);
      }
    });
    return map;
  };

  const isStartAvailable = (dIdx, hIdx) => {
    const unavailableMap = getUnavailableRangeMap();
    for (let i = 0; i < TIME_BLOCK_LENGTH; i++) {
      if (unavailableMap[dIdx]?.includes(hIdx + i)) return false;
      if (hIdx + i >= 24) return false;
    }
    return true;
  };

  const getCellClass = (dIdx, hIdx) => {
    const classes = ['cell'];
    const unavailableMap = getUnavailableRangeMap();
    const hours = unavailableMap[dIdx] || [];
    if (hours.includes(hIdx)) {
      const top = Math.min(...hours);
      const bottom = Math.max(...hours);
      classes.push('unavailable');
      if (hIdx === top) classes.push('unavailable-radius-top');
      else if (hIdx === bottom) classes.push('unavailable-radius-bottom');
    }
    if (!isStartAvailable(dIdx, hIdx)) {
      classes.push('not-allowed');
    }
    if (fixedSelection && fixedSelection.day === dIdx) {
      const top = fixedSelection.hour;
      const bottom = fixedSelection.hour + TIME_BLOCK_LENGTH - 1;
      if (hIdx === top) classes.push('fixed-radius-top');
      else if (hIdx === bottom) classes.push('fixed-radius-bottom');
      else if (hIdx > top && hIdx < bottom) classes.push('fixed-radius-middle');
    }
    if (tempSelection && tempSelection.day === dIdx) {
      const top = tempSelection.hour;
      const bottom = tempSelection.hour + TIME_BLOCK_LENGTH - 1;
      if (hIdx === top) classes.push('selected-border-top');
      else if (hIdx === bottom) classes.push('selected-border-bottom');
      else if (hIdx > top && hIdx < bottom) classes.push('selected-border-middle');
    }
    return classes.join(' ');
  };

  const handleCellClick = (dIdx, hIdx) => {
    if (!isStartAvailable(dIdx, hIdx)) return;
    if (getUnavailableRangeMap()[dIdx]?.includes(hIdx)) return;
    if (fixedSelection && fixedSelection.day === dIdx && hIdx >= fixedSelection.hour && hIdx < fixedSelection.hour + TIME_BLOCK_LENGTH) {
      setFixedSelection(null);
      setTempSelection(null);
      return;
    }
    if (fixedSelection) {
      setTempSelection({ day: dIdx, hour: hIdx });
    } else {
      setTempSelection({ day: dIdx, hour: hIdx });
    }
  };

  const confirmSelection = () => {
    if (tempSelection) {
      setFixedSelection(tempSelection);
      setTempSelection(null);
    }
  };

  const cancelSelection = () => {
    setFixedSelection(null);
    setTempSelection(null);
  };

  const renderActionButton = () => {
    let buttonText = 'check';
    let onClick = () => {};
    let color = '#acacac';

    if (tempSelection && !fixedSelection) {
      buttonText = 'check';
      color = '#F5AA22';
      onClick = confirmSelection;
    } else if (tempSelection && fixedSelection) {
      buttonText = 'check';
      color = '#DD6250';
      onClick = confirmSelection;
    } else if (fixedSelection && !tempSelection) {
      buttonText = 'cancel';
      color = '#DD6250';
      onClick = cancelSelection;
    }

    const iconSrc = `/icons/${buttonText}.png`;

    return (
      <button
        style={{ backgroundColor: color, cursor: color === '#ccc' ? 'not-allowed' : 'pointer' }}
        className='group-btn-section'
        disabled={color === '#ccc'}
        onClick={onClick}
      >
        <img src={iconSrc} className='group-btn-icon' />
      </button>
    );
  };

  const getWeekDates = () => {
    const startOfWeek = selectedDate.clone().startOf('week');
    return days.map((_, i) => startOfWeek.clone().add(i, 'days'));
  };

  const goToPrevWeek = () => {
    setSelectedDate(prev => prev.clone().subtract(1, 'week'));
  };

  const goToNextWeek = () => {
    setSelectedDate(prev => prev.clone().add(1, 'week'));
  };

  return (
    <div className="timetable-container group-container">
      <div className="group-calendar-header-bar">
        <button className="group-calendar-nav-btn" onClick={goToPrevWeek}>◀</button>
        <h2 onClick={handleDateClick}>{selectedDate.format('YYYY년 MM월')}</h2>
        <button className="group-calendar-nav-btn" onClick={goToNextWeek}>▶</button>

        {showCalendar && (
          <div
            className="calendar-popup"
            style={{ position: 'absolute', top: calendarPosition.y}}
          >
            <MiniCalendar
              currentDate={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setShowCalendar(true);
              }}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        )}
      </div>

      <div className="timetable-header-grid">
        <div className="corner-cell"></div>
        {getWeekDates().map((date, dIdx) => (
          <div key={dIdx} className="header-cell">
            {days[dIdx]}<br />
            <div className="header-date">{date.format('DD')}</div>
          </div>
        ))}
      </div>

      <div className="timetable-body-grid">
        {hours.map((hour, hIdx) => (
          <React.Fragment key={hour}>
            <div className="time-cell">{hour}</div>
            {days.map((_, dIdx) => (
              <div
                key={`${dIdx}-${hIdx}`}
                className={getCellClass(dIdx, hIdx)}
                onClick={() => handleCellClick(dIdx, hIdx)}
              >
                {fixedSelection &&
                  fixedSelection.day === dIdx &&
                  hIdx === fixedSelection.hour && (
                    <img
                      src={heartSrc}
                      alt="heart"
                      style={{
                        position: 'absolute',
                        top: '-14px',
                        right: '-14px',
                        width: '29px',
                        height: '29px',
                        zIndex: '1000'
                      }}
                    />
                  )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {renderActionButton()}
    </div>
  );
};

export default GroupTable;
