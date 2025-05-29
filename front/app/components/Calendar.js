'use client'
import React, { useState, useEffect,useCallback } from "react";
import moment from "moment";
import api from '@/lib/api';
import EventModal from "./EventModal";
import EventListModal from "./EventListModal";
import MiniCalendar from "./MiniCalendar";
import "./Calendar.css";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [showModal, setShowModal] = useState(false);
  
  const [editingEvent, setEditingEvent] = useState(null);

  const [events, setEvents] = useState([]);
  const [tags, setTags] = useState([]);
  const [modalDefaults, setModalDefaults] = useState(null);

  const [showEventListModal, setShowEventListModal] = useState(false);
  const [eventsForSelectedDate, setEventsForSelectedDate] = useState([]);

    
  const generateCalendar = useCallback(() => {
    const startOfMonth = currentDate.clone().startOf("month");
    const endOfMonth = currentDate.clone().endOf("month");
    const startDay = startOfMonth.day();
    const totalDays = endOfMonth.date();

    let days = [];
    for (let i = 0; i < startDay; i++) {
      days.push("");
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }, [currentDate]);


  useEffect(() => {
    generateCalendar();
    console.log("초기 : ", selectedDate);
  }, [generateCalendar]);

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

      console.log("월간 태그 응답:", data);
      
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
    console.log('Monthly events:', events);
  }, [events]);

  const fetchEvents = async () => {
    const startOfMonth = selectedDate.clone().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = selectedDate.clone().endOf('month').format('YYYY-MM-DD');

    const year = selectedDate.year();
    const month = selectedDate.month() + 1;
    try {
      const res = await api.get(`/schedules/monthly?year=${year}&month=${month}`);
      const schedules = res.data;

      const parsed = schedules.map(s => {
        const start = moment(s.start);
        const end = moment(s.end);
        return {
          title: s.title,
          start: start.toISOString(),
          end: end.toISOString(),
          tag: s.tags[0] || { name: '기본', color: '#acacac' },

        };
      });

      console.log("월간 일정 응답:", schedules);
      setEvents(parsed);
    } catch (err) {
      console.error("월간 일정 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    fetchTags();
    fetchEvents();
  }, []);
  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const prevMonth = () => {
    const newDate = currentDate.clone().subtract(1, "month");
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const nextMonth = () => {
    const newDate = currentDate.clone().add(1, "month");
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const handleDayClick = (day) => {
    const clickedDate = moment(currentDate).startOf('month').date(day);
    setSelectedDate(clickedDate);

    const matchedEvents = events.filter(e =>
      moment(e.start).isSame(clickedDate, 'day')
    );

    if (matchedEvents.length > 0) {
      setEventsForSelectedDate(matchedEvents);
      setShowEventListModal(true); // 🆕 목록 모달 열기
    } else {
      setModalDefaults({ clickedDate });
      setShowModal(true); // 기존 모달
      setEditingEvent(null);
    }
  };

  const handleSaveEvent = async (event) => {
    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent.id ? { ...e, ...event } : e));
    } else {
      
       try {
            const response = await api.post('/schedules', {
              title: event.title,
              type: 'monthly', 
              monthlyStart: event.monthlyStart,
              monthlyEnd: event.monthlyEnd,
              tagNames: [event.tag.name].join(','),
              tagColors: [event.tag.color].join(',')
            });
      
            if (response) {
              console.log('일정 등록 완료', event);
              await fetchEvents();
              // onClose();
            }

            setEvents(prev => [...prev, {
              title: event.title,
              start: event.monthlyStart,
              end: event.monthlyEnd,
              tag: event.tag,
            }]);
          } catch (error) {
            // alert('일정 등록 실패');
            console.error('Error:', error);
          }
    }
    setShowModal(false);
  };

  const handleEventClick = (event) => {
    const clickedDate = moment(event.start);  // 이벤트 시작 날짜 기반
    const matchedEvents = events.filter(e =>
      moment(e.start).isSame(clickedDate, 'day')
    );

    setSelectedDate(clickedDate);                 // 날짜 설정
    setEventsForSelectedDate(matchedEvents);      // 그 날짜 이벤트 목록 저장
    setShowEventListModal(true);                  // 리스트 모달 표시
  };


  const handleEventEdit = (event) => {
    setModalDefaults({
      clickedDate: moment(event.start),
      ...event,
    });
    setEditingEvent(event);
    setShowModal(true);
    setShowEventListModal(false);
  };

  const handleEventDelete = async (event) => {
    try {
      await api.delete(`/schedules/${event.id || event._id}`);
      await fetchEvents();
      setEventsForSelectedDate(prev => prev.filter(e => e !== event));
    } catch (err) {
      console.error("삭제 실패:", err);
    }
  };



  const [calendarPosition, setCalendarPosition] = useState({ x: 0, y: 0 });
  const [showCalendar, setShowCalendar] = useState(false);
  const handleDateClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCalendarPosition({ x: rect.left, y: rect.bottom });
    setShowCalendar(!showCalendar);
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


  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-btn">&#9664;</button>
        <h1 onClick={handleDateClick}>{currentDate.format("YYYY년 MM월")}</h1>
        <button onClick={nextMonth} className="nav-btn">&#9654;</button>
      </div>
      <div className="calendar-grid">
        {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
          <div key={index} className="day-name">
            {day}
          </div>
        ))}
        {generateCalendar().map((day, index) => {
          const isToday = moment().isSame(currentDate.clone().date(day), "day");
          const hasEvent = events.some(event =>
            moment(event.start).date() <= day && moment(event.end).date() >= day
          );
          return (
            <div
              key={index}
              className={`day day-large ${day ? "active" : "empty"} ${isToday ? "today" : ""} ${index % 7 === 0 ? "sunday" : index % 7 === 6 ? "saturday" : ""}`}
              onClick={() => handleDayClick(day)}
            >
              <span className="day-text">{day}</span>
              {isToday && <span className="today-circle"></span>}
              {hasEvent && (
                <div className="calendar-event-bar">
                  {events
                    .filter(event => moment(event.start).date() === day)
                    .map(event => (
                      <div
                        key={`${event.id || event._id || event.title}-${index}`}
                        className="calendar-event-block"
                        style={{ backgroundColor: event.tag.color }}
                        onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
              )}
            </div>
          );
        })}
      </div>
      {showModal && (
        <EventModal
          selectedDate={selectedDate}
          isEdit={!!editingEvent}
          editingEvent = {editingEvent}
          onClose={() => setShowModal(false)}
          onSave={handleSaveEvent}
          tags={tags}
          onAddTag={handleAddTag}
          {...modalDefaults}
        />
      )}
      {showCalendar && (
          <div
            className="calendar-popup"
            style={{ position: 'absolute', top: calendarPosition.y}}
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
        {showEventListModal && (
          <EventListModal
            date={selectedDate}
            events={eventsForSelectedDate}
            onEdit={handleEventEdit}
            onAdd={() => {
              setEditingEvent(null);
              setShowEventListModal(false);
              setShowModal(true);
            }}
            onDelete={handleEventDelete}
            onClose={() => setShowEventListModal(false)}
          />
        )}

    </div>
  );
};

export default Calendar;
