"use client";

import { useState, useEffect } from "react";

export default function PostEditor({
  mode,
  initialValues = {},
  onSubmit,
  onCancel,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isNotice, setIsNotice] = useState(false);
  const [isVote, setIsVote] = useState(false);
  const [voteOptions, setVoteOptions] = useState([]);

  // 최초 or initialValues 변경 시 초기화
  useEffect(() => {
    
    setTitle(initialValues.title ?? "");
    setContent(initialValues.content ?? "");
    setIsNotice(initialValues.isNotice ?? false);
    setIsVote(initialValues.isVote ?? false);
    setVoteOptions(initialValues.voteOptions ?? []);
  }, [initialValues]);

  return (
    <div className="popup-box">
      <input
        type="text"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="popup-input"
        style={{ padding: "0.3rem 1rem" }}
      />

      <textarea
        placeholder="내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="popup-textarea"
        style={{ padding: "1rem" }}
      />

      <div className="popup-vote">
        <label className="popup-checkbox">
          <input
            type="checkbox"
            checked={isNotice}
            onChange={() => setIsNotice(!isNotice)}
          />
          공지
        </label>
        <label className="popup-checkbox">
          <input
            type="checkbox"
            checked={isVote}
            onChange={() => setIsVote(!isVote)}
          />
          투표
        </label>
      </div>

      {isVote && (
        <div className="flex flex-col gap-1 mt-2">
          {voteOptions.map((option, index) => (
            <div key={option.id || index} className="flex items-center">
              <input
                type="text"
                placeholder={`항목 ${index + 1}`}
                value={option.text ?? ""}
                onChange={(e) => {
                  const updated = voteOptions.map((opt) =>
                    opt.id === option.id ? { ...opt, text: e.target.value } : opt
                  );
                  setVoteOptions(updated);
                }}
                className="border border-gray-400 px-2 py-1 rounded text-sm flex-grow"
              />
              {voteOptions.length > 2 && (
                <button
                  onClick={() =>
                    setVoteOptions(voteOptions.filter((opt) => opt.id !== option.id))
                  }
                  className="text-red-500 text-lg"
                  title="삭제"
                >
                  ➖
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() =>
              setVoteOptions([
                ...voteOptions,
                { id: crypto.randomUUID(), text: "" },
              ])
            }
            className="text-sm text-blue-600 self-start mt-1"
          >
            ➕ 항목 추가
          </button>
        </div>
      )}

      <div className="flex justify-between">
        <button className="popup-btn cancel" onClick={onCancel}>
          취소
        </button>
        <button
          className="popup-btn confirm"
          onClick={() => {
            onSubmit({
              id:
                mode === "edit" && initialValues.id
                  ? initialValues.id
                  : crypto.randomUUID(),
              title: title.trim() || "제목 없음",
              content,
              isNotice,
              isVote,
              voteOptions: isVote
                ? voteOptions.map((opt, index) => ({
                    id: opt.id,
                    text: opt.text.trim() || `항목 ${index + 1}`,
                  }))
                : [],
            });
          }}
        >
          {mode === "edit" ? "저장" : "작성"}
        </button>
      </div>
    </div>
  );
}
