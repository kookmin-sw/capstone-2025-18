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
<<<<<<< HEAD
        onClick={() => toggleGroup(group.groupId)}
        className="w-full p-1 flex justify-between items-center"
=======
        onClick={() => toggleGroup(group.id)}
        className="group-item-header"
>>>>>>> 8284eaff72a4e62ee4be18a3d2c41beaad1d55f2
      >
        {group.groupName}
      </button>

      {openGroup === group.groupId && (
        <div>
<<<<<<< HEAD
          <p className="text-xs text-gray-300 mb-2 text-center">
            참여 코드: <span className="font-mono">{group.inviteCode}</span>
          </p>

          <div className="mt-1 flex justify-between">
=======
          <p className="group-code-text">
            참여 코드: <span className="group-code-mono">{group.code}</span>
          </p>
          <div className="group-item-actions">
>>>>>>> 8284eaff72a4e62ee4be18a3d2c41beaad1d55f2
            <button
              onClick={openExitPopup}
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
