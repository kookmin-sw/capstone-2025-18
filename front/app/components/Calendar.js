'use client'
import React, { useState, useEffect } from "react";
import moment from "moment";
import EventModal from "./EventModal";
import MiniCalendar from "./MiniCalendar";
import "./Calendar.css";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, events]);

  useEffect(() => {
    fetchMonthlySchedules();
  }, [currentDate]);

  const fetchMonthlySchedules = async () =>
  {
    const year = currentDate.year();
    const month = currentDate.month() + 1;
    const url = `http://localhost:8080/schedules/monthly?year=${year}&month=${month}`;

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    const data = await res.json();

    const parsed = data.map(item => ({
      title: item.title,
      date: moment(item.start),
      tag: item.tags?.[0] || { name: '기본', color: '#ccc' }
    }));

    setEvents(parsed);
  };

  const registerMonthlySchedule = async (event) =>
  {
    const formData = {
      title: event.title,
      type: 'monthly',
      monthlyStart: event.start.format('YYYY-MM-DDTHH:mm'),
      monthlyEnd: event.end.format('YYYY-MM-DDTHH:mm'),
      tagNames: event.tag.name,
      tagColors: event.tag.color
    };

    const res = await fetch('http://localhost:8080/schedules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg);
    }

    fetchMonthlySchedules();
    setShowModal(false);
  };


  const generateCalendar = () => {
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
  };

  const prevMonth = () => {
    setCurrentDate(currentDate.clone().subtract(1, "month"));
  };

  const nextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, "month"));
  };

  const handleDayClick = async (day) => {
    const user = await checkAuth();
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setSelectedDate(moment(currentDate).date(day));
    setShowModal(true);
  };

  const handleSaveEvent = (event) => {
    setEvents([...events, event]);
  };

  const checkAuth = async () => {
    const res = await fetch('http://localhost:8080/isAuth', {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) {
      if (res.status === 401) return false;
    }

    const data = await res.json();
    return true;
  };

  const [calendarPosition, setCalendarPosition] = useState({ x: 0, y: 0 });
  const [showCalendar, setShowCalendar] = useState(false);
  const handleDateClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCalendarPosition({ x: rect.left, y: rect.bottom });
    setShowCalendar(!showCalendar);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-btn">&#9664;</button>
        <h2 onClick={handleDateClick}>{currentDate.format("YYYY년 MM월")}</h2>
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
              {hasEvent && <div className="event-bar"></div>}
            </div>
          );
        })}
      </div>
      {showModal && (
        <EventModal
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onSave={registerMonthlySchedule}
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
    </div>
  );
};

export default Calendar;
