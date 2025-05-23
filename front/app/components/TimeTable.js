'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Image from 'next/image';
import moment from 'moment';
import api from '@/lib/api';
import './TimeTable.css';
import AddEventModal from './AddEventModal';
import MiniCalendar from './MiniCalendar';

const hours = Array.from({ length: 24 }, (_, i) => `${i}`);
const days = ['일', '월', '화', '수', '목', '금', '토'];

const defaultTags = [
  { name: '기본', color: '#acacac', id: 'default-tag' }
];

const TimeTable = () => {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalDefaults, setModalDefaults] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentDate, setCurrentDate] = useState(moment());
  
  const handleAddEvent = () => {
    setModalDefaults(null);
    setEditingIndex(null);
    setShowModal(true);
  };

  let hasDefaultCreated = false;
  const fetchTags = async () => {
    try {
      const res = await api.get('/tags'); // 자동으로 credentials 포함
      const data = res.data;
      console.log(res.status);
      console.log(res.data);
      if (!Array.isArray(res.data)) {
        console.warn("서버 응답이 배열이 아님:", res.data);
        return;
      }
      const hasDefault = data.some(
        t => t.name?.trim() === "기본" && t.color?.toLowerCase() === "#acacac"
      );
      console.log("태그 응답:", data);


      if (!hasDefault && !hasDefaultCreated) {
        hasDefaultCreated = true;
        const postRes = await api.post('/tags', {
          name: '기본',
          color: '#acacac'
        });
        console.log("add default");
        const posted = postRes.data;
        const refreshed = await api.get('/tags'); 
        setTags(refreshed.data);
        window.location.reload();
      } else {
        setTags(data);
      }


      setTags(data.map(tag => ({
        id: tag._id || tag.id,
        name: tag.name,
        color: tag.color
      })));
    } catch (err) {
      console.error("태그 목록 불러오기 실패:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    console.log('events:', events);
  }, [events]);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      const startOfWeek = selectedDate.clone().startOf('week').format('YYYY-MM-DD');
      try {
        const res = await api.get(`/schedules/weekly?start=${startOfWeek}`);
        const schedules = res.data;
        console.log(res);

        const parsed = schedules.map(s => {
          const start = moment(s.start);
          const end = moment(s.end);
          return {
            title: s.title,
            day: start.day(),
            startHour: start.hour(),
            startMinute: start.minute(),
            endHour: end.hour(),
            endMinute: end.minute(),
            tag: s.tags[0] || { name: '기본', color: '#ccc' } // 첫 태그만 적용
          };
        });

        setEvents(parsed);
      } catch (err) {
        console.error("주간 일정 불러오기 실패:", err);
      }
    };

    fetchEvents();

  }, [selectedDate]);



  const handleSaveEvent = async (event) => {
    try {
      const weeklyStart = `${String(event.startHour).padStart(2, '0')}:${String(event.startMinute).padStart(2, '0')}`;
      const weeklyEnd = `${String(event.endHour).padStart(2, '0')}:${String(event.endMinute).padStart(2, '0')}`;
      const dayStr = `${event.day}`;
      const tagName = event.tag.name;
      const tagColor = event.tag.color;

      const payload = {
        title: event.title,
        type: 'weekly',
        weeklyStart,
        weeklyEnd,
        daysOfWeek: dayStr,
        tagNames: tagName,
        tagColors: tagColor
      };

      await api.post('/schedules', payload);

      // 성공 시 로컬 추가
      setEvents(prev => [...prev, event]);
      setShowModal(false);
      setEditingIndex(null);

      console.log("success to add weekly");
    } catch (err) {
      console.error("일정 저장 실패", err.response?.data || err.message);
    }
  };

  const handleAddTag = async (newTag) => {
    try {
      // 서버에 태그 POST
      await fetch("http://localhost:8080/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newTag.name,
          color: newTag.color
        })
      });

      // POST 성공 후 전체 태그 목록 다시 
      await fetchTags(); 
    } catch (err) {
      console.error("태그 추가 실패", err);
    }
  };


  const toggleTagFilter = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCalendarToggle = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCalendarPosition({ x: rect.left, y: rect.bottom });
    setShowCalendar(!showCalendar);
  };

  const handleCellMouseDown = (e, dayIdx, minuteIdx) => {
    if (e.target.closest('.event-block')) return;
    setIsDragging(true);
    setDragStart({ day: dayIdx, minute: minuteIdx });
    setDragEnd({ day: dayIdx, minute: minuteIdx });
  };

  const handleCellMouseEnter = (dayIdx, minuteIdx) => {
    if (isDragging) {
      setDragEnd({ day: dayIdx, minute : minuteIdx });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd && dragStart.day === dragEnd.day) {
      const day = dragStart.day;
      const startMinute = Math.min(dragStart.minute, dragEnd.minute);
      const endMinute = Math.max(dragStart.minute, dragEnd.minute);
      const startHour = Math.floor(startMinute / 6);
      const startMin = (startMinute % 6)*10;
      const endMin = (endMinute % 6)*10 + 10;
      const endHour = Math.floor((endMinute+1) / 6);

      // console.log(dragStart.minute,startMinute, startHour, startMin);
      // console.log(dragEnd.minute, endMinute, endHour, endMin);

      setModalDefaults({ 
        defaultDay: day, 
        defaultStart: startHour, 
        defaultEnd: endHour,
        defaultStartMinute: startMin,
        defaultEndMinute: endMin
      });
      setEditingIndex(null);
      setShowModal(true);
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleEventClick = (e, index) => {
    e.stopPropagation();
    const ev = events[index];
    setModalDefaults({
      defaultDay: ev.day,
      defaultStart: ev.startHour,
      defaultEnd: ev.endHour,
      defaultStartMinute: ev.startMin,
      defaultEndMinute: ev.endMin,
      defaultTitle: ev.title,
      defaultTag: ev.tag
    });
    setEditingIndex(index);
    setShowModal(true);
  };

  const getWeekDates = () => {
    const startOfWeek = selectedDate.clone().startOf('week');
    return days.map((_, i) => startOfWeek.clone().add(i, 'days'));
  };

  
  const getOverlappingEvents = (dayEvents) => {
    const sorted = [...dayEvents].sort((a, b) => {
      const aStart = a.startHour * 60 + (a.startMinute || 0);
      const bStart = b.startHour * 60 + (b.startMinute || 0);
      return aStart - bStart;
    });

    const layout = [];

    for (const ev of sorted) {
      const evStart = ev.startHour * 60 + (ev.startMinute || 0);
      const evEnd = ev.endHour * 60 + (ev.endMinute || 0);
      let placed = false;

      for (const column of layout) {
        const overlap = column.some(e => {
          const eStart = e.startHour * 60 + (e.startMinute || 0);
          const eEnd = e.endHour * 60 + (e.endMinute || 0);
          return !(evEnd <= eStart || evStart >= eEnd);
        });
        if (!overlap) {
          column.push(ev);
          placed = true;
          break;
        }
      }

      if (!placed) layout.push([ev]);
    }
    // console.log('layout', layout);
    return layout;
  };

  const isDraggingOver = (dIdx, mIdx) => {
    if (!isDragging || dragStart.day !== dIdx) return false;
    const start = Math.min(dragStart.minute, dragEnd.minute);
    const end = Math.max(dragStart.minute, dragEnd.minute);
    return mIdx >= start && mIdx <= end;
  };

  const icon_plus_thin = `/icons/plus-thin.png`;

  return (
    <div className="timetable-container" onMouseUp={handleMouseUp}>
      <div className="timetable-header">
        <div className="timetable-display-date"  onClick={handleCalendarToggle}>
          <h2>{getWeekDates()[0].format('YYYY년 MM월')}</h2>
          <button onClick={handleCalendarToggle} className="timetable-show-calendar">▼</button>
        </div>
        <button className="timetable-add-event-btn" onClick={handleAddEvent}>
          <Image src={icon_plus_thin} alt='add event btn' width={20} height={20} />
        </button>
        {showCalendar && (
          <div
            className="calendar-popup"
            style={{ position: 'absolute', top:0, scale:0.8, left:0}}
          >
            <MiniCalendar
              currentDate={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setCurrentDate(date);
                setShowCalendar(true);
              }}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        )}
        <div className="tag-filter-buttons">
          {tags.map((tag, i) => (
            <button
              key={tag.id || tag._id || `${tag.name}-${i}`}
              className={`tag-option-btn ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
              style={{ backgroundColor: tag.color }}
              onClick={() => toggleTagFilter(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div className="timetable-scroll-wrapper">
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
          {Array.from({ length: 24 }, (_, hIdx) => (
            <React.Fragment key={hIdx}>
              <div className="time-cell">
                {hIdx.toString().padStart(2, '0')}
              </div>
              {days.map((_, dIdx) => {
                const visibleEvents = events.filter(ev => ev.day === dIdx && (selectedTags.length === 0 || selectedTags.includes(ev.tag.id)));
                const layout = getOverlappingEvents(visibleEvents);

                // console.log('visibleEvents', visibleEvents);

                return (
                  <div
                    key={`${dIdx}-${hIdx}`}
                    className="hour-cell"
                    style={{ position: 'relative' }}
                  >
                    {Array.from({ length: 6 }, (_, m) => {
                      const minuteIndex = hIdx * 6 + m;
                      return (
                        <div
                          key={minuteIndex}
                          className={`minute-cell ${isDraggingOver(dIdx, minuteIndex) ? 'selected' : ''}`}
                          onMouseDown={(e) => handleCellMouseDown(e, dIdx, minuteIndex)}
                          onMouseEnter={() => handleCellMouseEnter(dIdx, minuteIndex)}
                        />
                      );
                    })}
                    {layout.map((column, colIdx) =>
                      column.map((ev, i) => {
                        const evStart = ev.startHour * 60 + (ev.startMinute || 0);
                        const evEnd = ev.endHour * 60 + (ev.endMinute || 0);
                        const topIndex = Math.floor(evStart / 10);
                        
                        if (ev.startHour !== hIdx) return null;
                        const height = ((evEnd - evStart) / 10) * 10;
                        // console.log("mapping-sm",ev.startMinute);
                        // console.log("mapping-ti",topIndex);
                        return (
                          <div
                            key={`${i}-${colIdx}`}
                            className="event-block"
                            style={{
                              position: 'absolute',
                              top: `${(ev.startMinute || 0)}px`,
                              height: `${height}px`,
                              width: `calc(${100 / layout.length}% - 4px)`,
                              left: `calc(${(100 / layout.length) * colIdx}% + 2px)`,
                              backgroundColor: ev.tag?.color || '#ccc',
                              fontSize: '0.8rem'
                            }}
                            onClick={(e) => handleEventClick(e, events.indexOf(ev))}
                          >
                            {ev.title}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {showModal && (
        <AddEventModal
          onClose={() => setShowModal(false)}
          onSave={handleSaveEvent}
          tags={tags}
          onAddTag={handleAddTag}
          {...modalDefaults}
        />
      )}
    </div>
  );
};

export default TimeTable;