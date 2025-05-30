'use client'
import React, { useState, useEffect,useCallback } from "react";
import moment from "moment";
import EventModal from "./EventModal";
import MiniCalendar from "./MiniCalendar";
import "./Calendar.css";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState([]);

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
  }, [generateCalendar]);

  const prevMonth = () => {
    setCurrentDate(currentDate.clone().subtract(1, "month"));
  };

  const nextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, "month"));
  };

  const handleDayClick = (day) => {
    setSelectedDate(moment(currentDate).date(day));
    setShowModal(true);
  };

  const handleSaveEvent = (event) => {
    setEvents([...events, event]);
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
          onSave={handleSaveEvent}
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
