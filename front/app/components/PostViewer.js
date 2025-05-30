"use client";
import './GroupPopup.css';

export default function PostViewer({
  post,
  selectedVotes,
  setSelectedVotes,
  onClose,
  onDelete,
  onEdit,
}) {
  const handleVoteChange = (optionId) => {
    setSelectedVotes(
      selectedVotes.includes(optionId)
        ? selectedVotes.filter((id) => id !== optionId)
        : [...selectedVotes, optionId]
    );
  };

  const submitVote = () => {
    const selectedTexts = post.voteOptions
      ?.filter((opt) => selectedVotes.includes(opt.id))
      .map((opt) => opt.text);
    alert(`선택한 항목: ${selectedTexts?.join(", ")}`);
    onClose();
    setSelectedVotes([]);
  };

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <h3 className="popup-title">{post.title}</h3>
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>

        {post.isVote && post.voteOptions && (
          <div>
            <p className="font-semibold mb-2">🗳️ 투표 항목</p>
            <ul className="space-y-2">
              {post.voteOptions.map((option, idx) => (
                <li key={idx}>
                  <label
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                      selectedVotes.includes(option.id)
                        ? "border-blue-500 bg-blue-100"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="popup-input"
                      checked={selectedVotes.includes(option.id)}
                      onChange={() => handleVoteChange(option.id)}
                    />
                    <span className="text-sm">{option.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {post.isVote && (
          <div className="flex justify-end">
            <button
              onClick={submitVote}
              className="bg-orange-500 text-white px-4 py-1 rounded mt-2"
            >
              투표 제출
            </button>
          </div>
        )}

        <div className="flex justify-between">
          <button onClick={onDelete} className="popup-btn cancel">삭제</button>
          <button onClick={onEdit} className="popup-btn confirm">수정</button>
          <button onClick={onClose} className="popup-btn">닫기</button>
        </div>
      </div>
    </div>
  );
}