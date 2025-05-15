"use client";

export default function GroupJoinPopup({ onJoin, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center">
      <div className="bg-white text-black p-4 rounded-lg">
        <p className="mb-4">참여 코드를 입력해주세요</p>
        <input
          type="text"
          placeholder="예: A1B2C"
          className="w-full border border-gray-400 p-2 rounded mb-3 text-sm"
        />
        <div className="flex justify-between">
          <button onClick={onCancel} className="bg-gray-400 px-3 py-1 rounded">
            취소
          </button>
          <button onClick={onJoin} className="bg-red-500 text-white px-3 py-1 rounded">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
