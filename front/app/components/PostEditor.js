"use client";

import { useState } from "react";

export default function PostEditor({
  mode,
  initialValues,
  onSubmit,
  onCancel,
}) {
  const [title, setTitle] = useState(initialValues.title);
  const [content, setContent] = useState(initialValues.content);
  const [isNotice, setIsNotice] = useState(initialValues.isNotice);
  const [isVote, setIsVote] = useState(initialValues.isVote);
  const [voteOptions, setVoteOptions] = useState(initialValues.voteOptions);

  return (
    <div className="bg-white text-black rounded-lg w-80 p-4 flex flex-col gap-4">
      <input
        type="text"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border border-gray-400 px-3 py-2 rounded text-sm"
      />

      <textarea
        placeholder="내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="border border-gray-400 px-3 py-2 rounded text-sm resize-none"
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 px-3 py-1 border rounded cursor-pointer">
          <input
            type="checkbox"
            checked={isNotice}
            onChange={() => setIsNotice(!isNotice)}
          />
          공지
        </label>
        <label className="flex items-center gap-2 px-3 py-1 border rounded cursor-pointer">
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
            <div key={option.id} className="flex items-center">
              <input
                type="text"
                placeholder={`항목 ${index + 1}`}
                value={option.text}
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
              setVoteOptions([...voteOptions, { id: crypto.randomUUID(), text: "" }])
            }
            className="text-sm text-blue-600 self-start mt-1"
          >
            ➕ 항목 추가
          </button>
        </div>
      )}

      <div className="flex justify-between">
        <button className="px-3 py-1 bg-gray-300 text-black rounded" onClick={onCancel}>
          취소
        </button>
        <button
          className="px-3 py-1 bg-orange-500 text-white rounded"
          onClick={() => {
            onSubmit({
              id: mode === "edit" && initialValues.id ? initialValues.id : crypto.randomUUID(),
              title: title.trim() || "제목 없음",
              content,
              isNotice,
              isVote,
              voteOptions: isVote
                ? voteOptions.map((opt, index) => ({
                    id: opt.id,
                    text: opt.text.trim() || `항목 ${index + 1}`,
                  }))
                : undefined,
            });
          }}
        >
          {mode === "edit" ? "저장" : "작성"}
        </button>
      </div>
    </div>
  );
}
