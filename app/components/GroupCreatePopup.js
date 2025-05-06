"use client";

export default function GroupCreatePopup({ value, onChange, onCancel, onCreate }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center">
      <div className="bg-white text-black p-4 rounded-lg w-72">
        <p className="mb-3 font-semibold text-center">그룹 이름을 입력해주세요</p>
        <input
          type="text"
          placeholder="그루비룸"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-400 p-2 rounded mb-3 text-sm"
        />
        <div className="flex justify-between">
          <button onClick={onCancel} className="bg-gray-400 px-3 py-1 rounded">
            취소
          </button>
          <button onClick={onCreate} className="bg-orange-500 text-white px-3 py-1 rounded">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
