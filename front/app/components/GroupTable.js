'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import moment from 'moment';
import './GroupTable.css';
import './TimeTable.css';
import MiniCalendar from './MiniCalendar';
import api from '@/lib/api';

const hours = Array.from({ length: 24 }, (_, i) => `${i}`);
const days = ['일', '월', '화', '수', '목', '금', '토'];
const heartSrc = `/icons/heart.png`;

const GroupTable = ({ groupId, blockLength = 1 }) => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [fixedSelection, setFixedSelection] = useState(null);
  const [tempSelection, setTempSelection] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ x: 0, y: 0 });
  const [unavailableBlocks, setUnavailableBlocks] = useState([]);
  const [voteActive, setVoteActive] = useState(false);
  const [myVote, setMyVote] = useState(null);
  // console.log("groupId in GroupTable:", groupId);
  useEffect(() => {
    if (!groupId|| groupId.length !== 24) {
      console.warn("Invalid groupId:", groupId);
      return;
    } 

    const fetchUnavailableBlocks = async () => {
      try {
        const start = selectedDate.clone().startOf('week').format('YYYY-MM-DD');
        const res = await api.get(`/groups/${groupId}/weekly-schedules?start=${start}`);
        const blocks = res.data.map(item => {
          const start = moment(item.start);
          const end = moment(item.end);
          return {
            day: start.day(),
            start: start.hour(),
            end: end.hour()
          };
        });
        setUnavailableBlocks(blocks);
      } catch (err) {
        console.error('불가능 시간 로딩 실패', err);
      }
    };

    const fetchVoteStatus = async () => {
      try {
        const res = await api.get(`/groups/${groupId}/vote/status`);
        console.log(res.status);
        if (res.status == 200) {
          setVoteActive(true);
           console.log(voteActive);

          if (res.data.myVote) {
            const d = moment(res.data.myVote.start);
            setFixedSelection({ day: d.day(), hour: d.hour() });
          }
        }
      } catch {
        setVoteActive(false);
      }
    };

    fetchUnavailableBlocks();
    fetchVoteStatus();
  }, [groupId, selectedDate]);

  const getUnavailableRangeMap = () => {
    const map = {};
    unavailableBlocks.forEach(({ day, start, end }) => {
      for (let h = start; h < end; h++) {
        if (!map[day]) map[day] = [];
        map[day].push(h);
      }
    });
    return map;
  };

  const isStartAvailable = (dIdx, hIdx) => {
    const unavailableMap = getUnavailableRangeMap();
    for (let i = 0; i < blockLength; i++) {
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
      const bottom = fixedSelection.hour + blockLength - 1;
      if (hIdx === top) classes.push('fixed-radius-top');
      else if (hIdx === bottom) classes.push('fixed-radius-bottom');
      else if (hIdx > top && hIdx < bottom) classes.push('fixed-radius-middle');
      console.log(hIdx);
    }
    if (tempSelection && tempSelection.day === dIdx) {
      const top = tempSelection.hour;
      const bottom = tempSelection.hour + blockLength - 1;
      if (hIdx === top) classes.push('selected-border-top');
      else if (hIdx === bottom) classes.push('selected-border-bottom');
      else if (hIdx > top && hIdx < bottom) classes.push('selected-border-middle');
    }
    return classes.join(' ');
  };

  const handleCellClick = (dIdx, hIdx) => {
    if (!isStartAvailable(dIdx, hIdx)) return;
    const map = getUnavailableRangeMap();
    if (map[dIdx]?.includes(hIdx)) return;
    if (fixedSelection && fixedSelection.day === dIdx && hIdx >= fixedSelection.hour && hIdx < fixedSelection.hour + blockLength) {
      setFixedSelection(null);
      setTempSelection(null);
      return;
    }
    setTempSelection({ day: dIdx, hour: hIdx });
  };

  const confirmSelection = async () => {
    if (!tempSelection || !groupId) return;
    if (!voteActive) {
      alert('투표가 아직 시작되지 않았습니다. 그룹장이 투표를 시작해야 합니다.');
      return;
    }
    try {
      const weekStart = selectedDate.clone().startOf('week');
      const selected = weekStart.clone().add(tempSelection.day, 'days').set({ hour: tempSelection.hour, minute: 0, second: 0 });
      const end = selected.clone().add(blockLength, 'hours');

      await api.post(`/groups/${groupId}/vote`, {
        start: selected.toISOString(),
        end: end.toISOString()
      });

      setFixedSelection(tempSelection);
      setTempSelection(null);
    } catch (err) {
      if (existing) {
        return res.status(200).json({ message: "이미 진행 중인 투표가 있습니다.", alreadyStarted: true });
      } else {
        console.error('선택 전송 실패', err);
      }
    }
  };

  const cancelSelection = async () => {
    try {
      await api.delete(`/groups/${groupId}/vote/delete`);
      setFixedSelection(null);
      setTempSelection(null);
    } catch (err) {
      console.error('취소 실패:', err.response?.data || err.message);
    }
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
        <Image src={iconSrc} width={35} height={35} alt="group btn"className='group-btn-icon' />
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

  const handleDateClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCalendarPosition({ x: rect.left, y: rect.bottom });
    setShowCalendar(!showCalendar);
  };
  console.log("투표 상태",voteActive);

  return (
    <div className="timetable-container group-container">
      <div className="group-calendar-header-bar">
        <button className="group-calendar-nav-btn" onClick={goToPrevWeek}>◀</button>
        <h2 onClick={handleDateClick}>{selectedDate.format('YYYY년 MM월')}</h2>
        <button className="group-calendar-nav-btn" onClick={goToNextWeek}>▶</button>

        {showCalendar && (
          <div
            className="calendar-popup"
            style={{ position: 'absolute', top: calendarPosition.y }}
          >
            <MiniCalendar
              currentDate={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setShowCalendar(false);
              }}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        )}
      </div>
      
      <div className="grouptable-scroll-wrapper">
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
                      <Image
                        src={heartSrc}
                        alt="heart"
                        width={30} height={30}
                        style={{
                          position: 'absolute',
                          top: '-14px',
                          right: '-14px',
                          zIndex: '1000'
                        }}
                      />
                    )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
      {voteActive ? renderActionButton() : null}
    </div>
  );
};

export default GroupTable;
