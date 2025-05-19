"use client";
import React, { useState } from "react";
import moment from "moment";
import SelectedDate from "./SelectedDate";
import './AddEventModal.css';
import './Calendar.css';

export default function EventModal({ onClose, onSave }) {
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState(moment());
  const [endDate, setEndDate] = useState(moment().add(1, "days"));
  const [activeTab, setActiveTab] = useState("start");
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [startHour, setStartHour] = useState(9);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(10);
  const [endMinute, setEndMinute] = useState(0);

  const handleSave = () => {
    if (!eventName.trim()) return alert("이벤트 이름을 입력하세요");
    const start = startDate.clone().set({ hour: startHour, minute: startMinute });
    const end = endDate.clone().set({ hour: endHour, minute: endMinute });
    onSave({ name: eventName, start: start.toISOString(), end: end.toISOString() });
  };

  const handleCalendar = () => {

    setShowCalendar(!showCalendar);
  }


  const icon_check_black = `/icons/check_black.png`;
  const icon_cancel_black = `/icons/cancel_black.png`;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-actions">
            <button onClick={onClose}>
              <img src={icon_cancel_black} className='modal-close-btn'/>
            </button>
            <button onClick={handleSave}>
              <img src={icon_check_black} className='modal-submit-btn' />
            </button>
        </div>
        <h4 onClick={handleCalendar} className="modal-title">
          {activeTab === "start" ? startDate.format("YYYY-MM-DD") : endDate.format("YYYY-MM-DD")}
        </h4>
        <div className="event-modal-scroll">
              <input
              type="text"
              placeholder="이벤트 이름"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="modal-input"
            />
              {showCalendar && (
                <div className="calendar-row">
                  <SelectedDate
                    selectedDate={activeTab === "start" ? startDate : endDate}
                    onSelect={(date) => {
                      if (activeTab === "start") setStartDate(date);
                      else setEndDate(date);
                      setShowCalendar(false);
                    }}
                    onActive={activeTab}
                  />
                </div>
              )}


            <div className="time-toggle">
              <label>
                시간 설정
              </label>
              <button onClick={() => setTimeEnabled(!timeEnabled)}>{timeEnabled ? "끄기" : "켜기"}</button>
            </div>

            {timeEnabled && (
              <div className="time-row">
                <div className="time-block">
                  <p>시작 시간</p>
                  <div className="time-selector">
                    <select value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i}시</option>
                      ))}
                    </select>
                    <select value={startMinute} onChange={(e) => setStartMinute(Number(e.target.value))}>
                      {[0, 10, 20, 30, 40, 50].map((m) => (
                        <option key={m} value={m}>{m}분</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* <div className="time-separator">─</div> */}

                <div className="time-block">
                  <p>종료 시간</p>
                  <div className="time-selector">
                    <select value={endHour} onChange={(e) => setEndHour(Number(e.target.value))}>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i}시</option>
                      ))}
                    </select>
                    <select value={endMinute} onChange={(e) => setEndMinute(Number(e.target.value))}>
                      {[0, 10, 20, 30, 40, 50].map((m) => (
                        <option key={m} value={m}>{m}분</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
