"use client";

export default function GroupExitPopup({ onExit, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center">
      <div className="bg-white text-black p-4 rounded-lg">
        <p className="mb-4">정말 그룹에서 나가시겠습니까?</p>
        <div className="flex justify-between">
          <button onClick={onCancel} className="bg-gray-400 px-3 py-1 rounded">
            취소
          </button>
          <button onClick={onExit} className="bg-red-500 text-white px-3 py-1 rounded">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
