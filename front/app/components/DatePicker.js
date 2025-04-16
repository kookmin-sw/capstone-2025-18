import React, { useState } from "react";
import moment from "moment";
import "./Calendar.css";

const DatePicker = ({ selectedDate, onSelect, onClose }) => {
  const [currentDate, setCurrentDate] = useState(moment(selectedDate));

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

  return (
    <div className="datepicker-overlay">
      <div className="datepicker-container">
        <div className="datepicker-header">
          <button onClick={prevMonth} className="nav-btn">&#9665;</button>
          <h2>{currentDate.format("YYYY년 MM월")}</h2>
          <button onClick={nextMonth} className="nav-btn">&#9655;</button>
        </div>
        <div className="datepicker-grid">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
            <div key={index} className="day-name">{day}</div>
          ))}
          {generateCalendar().map((day, index) => {
            const isSelected = moment(selectedDate).isSame(currentDate.clone().date(day), "day");
            return (
              <div
                key={index}
                className={`day ${day ? "active" : "empty"} ${isSelected ? "selected-date" : ""}`}
                onClick={() => onSelect(currentDate.clone().date(day))}
              >
                {day}
              </div>
            );
          })}
        </div>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

export default DatePicker;
