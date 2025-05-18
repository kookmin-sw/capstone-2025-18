"use client";
import './GroupPopup.css';

export default function GroupJoinPopup({ onJoin, onCancel }) {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <p className="popup-title">참여 코드를 입력해주세요</p>
        <input
          type="text"
          placeholder="예: A1B2C"
          className="popup-input"
        />
        <div className="popup-buttons">
          <button onClick={onCancel} className="popup-btn cancel">
            취소
          </button>
          <button onClick={onJoin} className="popup-btn confirm">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
