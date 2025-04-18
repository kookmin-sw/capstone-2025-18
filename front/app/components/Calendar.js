'use client'
import React, { useState, useEffect } from "react";
import moment from "moment";
import EventModal from "./EventModal"; // 일정 추가 모듈 불러오기
import "./Calendar.css";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, events]);

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

  const handleDayClick = (day) => {
    setSelectedDate(moment(currentDate).date(day));
    setShowModal(true);
  };

  const handleSaveEvent = (event) => {
    setEvents([...events, event]);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-btn">&#9665;</button>
        <h2>{currentDate.format("YYYY년 MM월")}</h2>
        <button onClick={nextMonth} className="nav-btn">&#9655;</button>
      </div>
      <div className="calendar-grid">
        {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
          <div key={index} className="day-name cat-icon">
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
    </div>
  );
};

export default Calendar;
