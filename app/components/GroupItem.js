"use client";

export default function GroupItem({
  group,
  openGroup,
  toggleGroup,
  moveToIndividualPage,
  openExitPopup,
}) {
  return (
    <div className="mb-1 bg-gray-800 p-2 rounded-lg">
      <button
        onClick={() => toggleGroup(group.id)}
        className="w-full p-1 flex justify-between items-center"
      >
        {group.name} <span>{group.members}</span>
      </button>
      {openGroup === group.id && (
        <div>
          <p className="text-xs text-gray-300 mb-2 text-center">
            참여 코드: <span className="font-mono">{group.code}</span>
          </p>
          <div className="mt-1 flex justify-between">
            <button
              onClick={openExitPopup}
              className="bg-red-500 text-white px-2 py-1 text-xs rounded"
            >
              그룹에서 나가기
            </button>
            <button
              onClick={() => moveToIndividualPage(group)}
              className="bg-yellow-500 text-white px-2 py-1 text-xs rounded"
            >
              그룹 페이지로 이동
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
