'use client'
import React, { useState } from 'react';
import moment from 'moment';
import './TimeTable.css';
import AddEventModal from './AddEventModal';
import MiniCalendar from './MiniCalendar';

const hours = Array.from({ length: 24 }, (_, i) => `${i}`);
const days = ['일', '월', '화', '수', '목', '금', '토'];

const defaultTags = [
  { name: '기본', color: '#acacac', id: 'default-tag' }
];

const TimeTable = () => {
  const [events, setEvents] = useState([]);
  const [tags, setTags] = useState(defaultTags);
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

  const handleSaveEvent = (event) => {
    if (editingIndex !== null) {
      const newEvents = [...events];
      newEvents[editingIndex] = event;
      setEvents(newEvents);
    } else {
      setEvents(prev => [...prev, event]);
    }
    setEditingIndex(null);
    setShowModal(false);
  };

  const handleAddTag = (newTag) => {
    setTags(prev => [...prev, newTag]);
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

  const handleCellMouseDown = (e, dayIdx, hourIdx) => {
    if (e.target.closest('.event-block')) return;
    setIsDragging(true);
    setDragStart({ day: dayIdx, hour: hourIdx });
    setDragEnd({ day: dayIdx, hour: hourIdx });
  };

  const handleCellMouseEnter = (dayIdx, hourIdx) => {
    if (isDragging) {
      setDragEnd({ day: dayIdx, hour: hourIdx });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd && dragStart.day === dragEnd.day) {
      const day = dragStart.day;
      const startHour = Math.min(dragStart.hour, dragEnd.hour);
      const endHour = Math.max(dragStart.hour, dragEnd.hour) + 1;
      setModalDefaults({ defaultDay: day, defaultStart: startHour, defaultEnd: endHour });
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
    const layout = [];
    dayEvents.forEach((event) => {
      let placed = false;
      for (let i = 0; i < layout.length; i++) {
        if (!layout[i].some(e => !(event.endHour <= e.startHour || event.startHour >= e.endHour))) {
          layout[i].push(event);
          placed = true;
          break;
        }
      }
      if (!placed) layout.push([event]);
    });
    return layout;
  };

  const isDraggingOver = (dIdx, hIdx) => {
    if (!isDragging || dragStart.day !== dIdx) return false;
    const start = Math.min(dragStart.hour, dragEnd.hour);
    const end = Math.max(dragStart.hour, dragEnd.hour);
    return hIdx >= start && hIdx <= end;
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
          <img src={icon_plus_thin} />
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
          {tags.map((tag) => (
            <button
              key={tag.id}
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
          {hours.map((hour, hIdx) => (
            <React.Fragment key={hour}>
              <div className="time-cell">{hour}</div>
              {days.map((_, dIdx) => {
                const visibleEvents = events.filter(ev => ev.day === dIdx && (selectedTags.length === 0 || selectedTags.includes(ev.tag.id)));
                const layout = getOverlappingEvents(visibleEvents);
                return (
                  <div
                    key={`${dIdx}-${hIdx}`}
                    className={`cell ${isDraggingOver(dIdx, hIdx) ? 'selected' : ''}`}
                    onMouseDown={(e) => handleCellMouseDown(e, dIdx, hIdx)}
                    onMouseEnter={() => handleCellMouseEnter(dIdx, hIdx)}
                  >
                    {layout.map((column, colIdx) =>
                      column.map((ev, i) => (
                        hIdx === ev.startHour && (
                          <div
                            key={`${i}-${colIdx}`}
                            className="event-block"
                            style={{
                              height: (ev.endHour - ev.startHour) * 40,
                              width: `calc(${100 / layout.length}% - 4px)` ,
                              left: `calc(${(100 / layout.length) * colIdx}% + 2px)` ,
                              backgroundColor: ev.tag?.color || '#ccc'
                            }}
                            onClick={(e) => handleEventClick(e, events.indexOf(ev))}
                          >
                            {ev.title}
                          </div>
                        )
                      ))
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