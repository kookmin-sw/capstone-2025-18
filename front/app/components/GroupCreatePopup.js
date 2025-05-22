"use client";
import './GroupPopup.css';

const GroupCreatePopup =  ({ value, onChange, onCancel, onCreate }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <p className="popup-title">그룹 이름을 입력해주세요</p>
        <input
          type="text"
          placeholder="그루비룸"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="popup-input"
        />
        <div className="popup-buttons">
          <button onClick={onCancel} className="popup-btn cancel">취소</button>
          <button onClick={onCreate} className="popup-btn confirm">확인</button>
        </div>
      </div>
    </div>
  );
}

export default GroupCreatePopup;