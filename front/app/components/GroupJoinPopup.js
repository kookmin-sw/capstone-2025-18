"use client";

import { useState } from "react";
import './GroupPopup.css';

export default function GroupJoinPopup({ onJoin, onCancel }) {
  const [code, setCode] = useState("");

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <p className="popup-title">참여 코드를 입력해주세요</p>
        <input
          type="text"
          placeholder="예: A1B2C3"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="popup-input"
        />
        <div className="popup-buttons">
          <button onClick={onCancel} className="popup-btn cancel">
            취소
          </button>
          <button onClick={() => onJoin(code.trim())} className="popup-btn confirm">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
