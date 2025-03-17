'use client'
import React, { useState, useEffect } from "react";
import moment from "moment";
import "./Calendar.css"; // 스타일 파일 가져오기

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(moment()); // 현재 날짜 상태

  useEffect(() => {
    generateCalendar();
  }, [currentDate]);

  const generateCalendar = () => {
    const startOfMonth = currentDate.clone().startOf("month");
    const endOfMonth = currentDate.clone().endOf("month");
    const startDay = startOfMonth.day(); // 이번 달 1일의 요일 (0 = 일요일)
    const totalDays = endOfMonth.date(); // 이번 달 총 일 수

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

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-btn">&#9665;</button>
        <h2>{currentDate.format("YYYY년 MM월")}</h2>
        <button onClick={nextMonth} className="nav-btn">&#9655;</button>
      </div>
      <div className="calendar-grid">
        {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
          <div key={index} className={`day-name cat-icon`}>
            {day}
          </div>
        ))}
        {generateCalendar().map((day, index) => {
          const isToday = moment().isSame(currentDate.clone().date(day), "day");
          return (
            <div key={index} className={`day day-large ${day ? "active" : "empty"} ${isToday ? "today" : ""} ${index % 7 === 0 ? "sunday" : index % 7 === 6 ? "saturday" : ""}`}>
              <span className="day-text">{day}</span>
              {isToday && <span className="today-circle"></span>} {/* 오늘 날짜 하이라이트 */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;