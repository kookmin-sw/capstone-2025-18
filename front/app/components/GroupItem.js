"use client";
import './GroupItem.css';

export default function GroupItem({
  group,
  openGroup,
  toggleGroup,
  moveToIndividualPage,
  openExitPopup,
}) {
  return (
    <div className="group-item-container">
      <button
        onClick={() => toggleGroup(group.id)}
        className="group-item-header"
      >
        {group.name} <span>{group.members}</span>
      </button>
      {openGroup === group.id && (
        <div>
          <p className="group-code-text">
            참여 코드: <span className="group-code-mono">{group.code}</span>
          </p>
          <div className="group-item-actions">
            <button
              onClick={() => openExitPopup(group.id)}
              className="group-exit-btn"
            >
              그룹에서 나가기
            </button>
            <button
              onClick={() => moveToIndividualPage(group)}
              className="group-move-btn"
            >
              그룹 페이지로 이동
            </button>
          </div>
        </div>
      )}
    </div>
  );
}