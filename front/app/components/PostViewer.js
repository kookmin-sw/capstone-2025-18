"use client";

import { useEffect } from "react";
import { useState } from "react";
import "./GroupPopup.css";

export default function PostViewer({
  post,
  comments,
  selectedVotes,
  setSelectedVotes,
  onClose,
  onDelete,
  onEdit,
  refreshPost,
}) {
  const [newComment, setNewComment] = useState("");

  const handleVoteChange = (optionId) => {
    setSelectedVotes(
      selectedVotes.includes(optionId)
        ? selectedVotes.filter((id) => id !== optionId)
        : [...selectedVotes, optionId]
    );
  };

  useEffect(() => {
    setSelectedVotes(post.myVotes || []);
  }, [post]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return alert("댓글을 입력해주세요.");

    const res = await fetch(`http://localhost:8080/posts/${post._id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: newComment.trim() })
    });

    const data = await res.json();
    if (res.ok) {
      alert("댓글 등록 완료!");
      setNewComment("");
      if (refreshPost) refreshPost();
    } else {
      alert(data.message || "댓글 등록 실패");
    }
  };

  const submitVote = async () => {
    if (!selectedVotes.length) return alert("1개 이상 선택해주세요");

    const res = await fetch(`http://localhost:8080/posts/${post._id}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ selectedOptionIds: selectedVotes })
    });

    const data = await res.json();

    if (res.ok) {
      alert("투표 완료!");
      refreshPost();
    } else {
      alert(data.message || "투표 실패");
    }
  };


  return (
    <div className="popup-overlay">
      <div className="popup-box w-[90%] max-w-md text-left">
        <h3 className="popup-title">
          {post.is_notice && <p>📌 {post.title}</p>}
          {!(post.is_notice) && <p>{post.title}</p>}
        </h3>
        <hr className="my-4" />
        <p className="text-sm whitespace-pre-wrap mb-4">{post.content}</p>

        <hr className="my-4" />

        {post.voteOptions?.length > 0 && (
          <div className="mb-4">
            <p className="font-semibold mb-1">🗳️ 투표 항목</p>
            <ul className="space-y-2">
              {post.voteOptions.map((opt) => (
                <li key={opt.id}>
                  <label className="flex justify-between items-center">
                    <div>
                      <input
                        type="checkbox"
                        checked={selectedVotes.includes(opt.id)}
                        onChange={() => handleVoteChange(opt.id)}
                      />
                      <span className="ml-2">{opt.text}</span>
                    </div>
                    <span className="text-sm text-gray-600">{opt.voteCount}표</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {post.voteOptions?.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={submitVote}
              className="bg-orange-500 text-white px-4 py-1 rounded mt-2"
            >
              투표 제출
            </button>
          </div>
        )}

        
        <div className="flex justify-end space-x-2 mt-4">
          <button onClick={onEdit} className="px-3 py-1 rounded bg-blue-500 text-white text-sm">수정</button>
          <button onClick={onDelete} className="px-3 py-1 rounded bg-red-500 text-white text-sm">삭제</button>
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-300 text-sm">닫기</button>
        </div>

        <hr className="my-4" />

        <div className="mt-4">
          <p className="font-semibold mb-2">댓글</p>
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {comments.slice().reverse().map((comment) => (
              <li key={comment._id} className="text-sm bg-gray-100 p-2 rounded">
                {comment.content}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3">
          <textarea
            rows={2}
            className="w-full border p-2 rounded text-sm"
            placeholder="댓글을 입력하세요"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            onClick={handleSubmitComment}
            className="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded float-right"
          >
            댓글 등록
          </button>
        </div>
      </div>
    </div>
  );
}
