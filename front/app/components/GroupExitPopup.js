"use client";
import './GroupPopup.css';

export default function GroupExitPopup({ onExit, onCancel }) {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <p className="popup-title">정말 그룹에서 나가시겠습니까?</p>
        <div className="popup-buttons">
          <button onClick={onCancel} className="popup-btn cancel">
            취소
          </button>
          <button onClick={onExit} className="popup-btn confirm">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
