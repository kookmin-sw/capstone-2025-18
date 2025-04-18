'use client'
import React, { useState, useEffect } from "react";
import moment from "moment";
import "./Calendar.css";

const SelectDate = ({ selectedDate, onSelect, onClose }) => {
  const [currentDate, setCurrentDate] = useState(moment(selectedDate));
  const [isStart, setIsStart] = useState(true);
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(currentDate);
  const [selectedDays, setSelectedDays] = useState({ start: startDate, end: endDate });

  useEffect(() => {
    generateDatePicker();
    setSelectedDays({ start: startDate, end: endDate });
    console.log(startDate);
    // console.log(endDate);
  }, [startDate, endDate]);

  const generateDatePicker = () => {
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

  const handleStartDay = (day) => {
    const newStartDate = moment(currentDate).date(day);
    setStartDate(newStartDate);
    setSelectedDays({ ...selectedDays, start: newStartDate });
  };
  const handleEndDay = (day) => {
    setEndDate(moment(currentDate).date(day));
  };

  return (
    <div className="calendar-container">
      <div className="selected-container">
        <div onClick={() => setIsStart(true)}>
          <div className={`selected-label ${isStart ? 'selected-active' : 'selected-inactive'}`}>시작</div>
          <div className={`selected-value ${isStart ? 'selected-active' : 'selected-inactive'}`}>{startDate.format('MM월 DD일')}</div>
        </div>
        <div onClick={() => setIsStart(false)}>
          <div className={`selected-label ${!isStart ? 'selected-active' : 'selected-inactive'}`}>끝</div>
          <div className={`selected-value ${!isStart ? 'selected-active' : 'selected-inactive'}`}>{endDate.format('MM월 DD일')}</div>
        </div>
      </div>
      <div className="calendar-header">
        <button onClick={prevMonth} className="nav-btn">&#9665;</button>
        <h2>{currentDate.format("YYYY년 MM월")}</h2>
        <button onClick={nextMonth} className="nav-btn">&#9655;</button>
      </div>
      
      <div className="calendar-grid">
        {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
          <div key={index}>
            {day}
          </div>
        ))}
        {generateDatePicker().map((day, index) => {
          const isSelectedStart = startDate.isSame(moment(currentDate).set("date", day), "day");
          const isSelectedEnd = endDate.isSame(moment(currentDate).set("date", day), "day");
          
          return(
            <div key={index}>
              {isStart ? 
                <div
                  key={index}
                  className={`day day-large ${day ? "active" : "empty"} 
                    ${isSelectedStart ? "today" : ""} 
                    ${index % 7 === 0 ? "sunday" : index % 7 === 6 ? "saturday" : ""}`}
                  onClick={() => handleStartDay(day)}
              
                > 
                  <span className="day-text">{day}</span>
                  {isSelectedStart && <span className="selected-circle"></span>}
                </div>
                :
                <div
                  key={index}
                  className={`day day-large ${day ? "active" : "empty"} 
                    ${isSelectedEnd ? "today" : ""} 
                    ${index % 7 === 0 ? "sunday" : index % 7 === 6 ? "saturday" : ""}`}
                  onClick={() => handleEndDay(day)}
                > 
                  <span className="day-text">{day}</span>
                  {isSelectedEnd && <span className="today-circle"></span>}
                </div>
              }
            </div>
          );
        })}
      </div>
      <button onClick={onClose}>닫기</button>
    </div>
  );
};

export default SelectDate;
