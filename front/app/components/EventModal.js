'use client'
import React, { useState, useEffect } from "react";
import moment from "moment";
import SelectDate from "./SelectedDate";
import "./Calendar.css";
import WheelPicker from "./WheelPicker";

const EventModal = ({ selectedDate, events, onClose, onSave }) => {
  const [eventName, setEventName] = useState("");
  const [eventStart, setEventStart] = useState(selectedDate);
  const [eventEnd, setEventEnd] = useState(selectedDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSelectingStartDate, setIsSelectingStartDate] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isTimeEnabled, setIsTimeEnabled] = useState(false);
  const [startTime, setStartTime] = useState({ hour: 9, minute: 0, period: "AM" });
  const [endTime, setEndTime] = useState({ hour: 10, minute: 0, period: "AM" });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.modal-content')) {
        const confirmCancel = window.confirm("작업을 취소하시겠습니까?");
        if (confirmCancel) onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    if (eventName && eventStart && eventEnd) {
      onSave({ name: eventName, start: eventStart, end: eventEnd, startTime: isTimeEnabled ? startTime : null, endTime: isTimeEnabled ? endTime : null });
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
      
        {(events || []).map((event, index) => (
          <div key={index} className="event-item">{event.name}</div>
        ))}
        <button onClick={() => setShowDatePicker(true)}>
          <h3> {eventStart.isSame(eventEnd, 'day') ? moment(eventStart).format('YYYY-MM-DD') : `${moment(eventStart).format('YYYY-MM-DD')} ~ ${moment(eventEnd).format('YYYY-MM-DD')}`} </h3>
        </button>

        
        {showDatePicker && (
          <SelectDate
            selectedDate={isSelectingStartDate ? eventStart : eventEnd}
            onSelect={(date) => {
              isSelectingStartDate ? setEventStart(date) : setEventEnd(date);
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )}
        <div className="toggle-container" onClick={() => setIsTimeEnabled(!isTimeEnabled)}>
          <div className={`toggle ${isTimeEnabled ? "on" : "off"}`}></div>
          <span>시간 설정</span>
        </div>
        {isTimeEnabled && (
          <div className="time-picker">
            <div>
              <WheelPicker onTimeChange={() => {
                      // setStartHour(start); 
                      // setEndHour(end); 
                  }} />
            </div>
          </div>
        )}
        <button onClick={handleSave}>확인</button>
        <button onClick={onClose}>취소</button>
      </div>
    </div>
  );
};

export default EventModal;