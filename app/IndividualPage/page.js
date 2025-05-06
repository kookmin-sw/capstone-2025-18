"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import PostEditor from "../components/PostEditor";
import PostList from "../components/PostList";
import PostViewer from "../components/PostViewer";
import Timetable from "../components/Timetable";

export default function IndividualPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("id") || "error";
  const groupName = searchParams.get("name") || "error";
  const groupCode = searchParams.get("code") || "error";

  const [selectedTab, setSelectedTab] = useState("timetable");
  const [showSettingPopup, setShowSettingPopup] = useState(false);
  const [editGroupName, setEditGroupName] = useState(groupName);
  const [posts, setPosts] = useState([]);
  const [showWritePopup, setShowWritePopup] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedVotes, setSelectedVotes] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="relative w-80 mx-auto min-h-screen bg-neutral-100 flex flex-col">
      <div className="bg-black text-white flex items-center justify-between px-3 py-2 rounded-b-lg">
        <button onClick={() => router.back()}>←</button>
        <h2 className="text-sm font-bold">{editGroupName}</h2>
        <button onClick={() => setShowSettingPopup(true)}>⚙</button>
      </div>

      <div className="flex-grow relative">
        {selectedTab === "timetable" ? (
          <Timetable />
        ) : (
          <PostList posts={posts} onSelect={(post) => setSelectedPost(post)} />
        )}
      </div>

      {selectedTab === "board" && (
        <button
          className="absolute bottom-14 right-2 bg-orange-500 text-white text-xl p-3 rounded-full shadow-md z-40"
          onClick={() => setShowWritePopup(true)}
        >
          ✏️
        </button>
      )}

      <div className="flex justify-around bg-white py-2 rounded-t-lg border-t border-gray-300">
        <button
          onClick={() => setSelectedTab("timetable")}
          className={`flex flex-col items-center text-xs ${
            selectedTab === "timetable" ? "text-orange-500 font-bold" : "text-gray-400"
          }`}
        >
          📅 <span>시간표</span>
        </button>
        <button
          onClick={() => setSelectedTab("board")}
          className={`flex flex-col items-center text-xs ${
            selectedTab === "board" ? "text-orange-500 font-bold" : "text-gray-400"
          }`}
        >
          📢 <span>게시판</span>
        </button>
      </div>

      {showSettingPopup && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white text-black p-5 rounded-xl w-72">
            <h3 className="text-lg font-bold mb-4 text-center">그룹 설정</h3>
            <div className="mb-2">
              <p className="text-sm font-semibold">그룹 이름</p>
              <input
                type="text"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="w-full border border-gray-400 px-2 py-1 text-sm rounded"
              />
            </div>
            <div className="mb-2">
              <p className="text-sm font-semibold">참여 코드: {groupCode}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm font-semibold mb-1">회의 길이</p>
              <div className="flex gap-2">
                <select className="w-1/2 border border-gray-400 rounded px-2 py-1 text-sm" defaultValue="0">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <option key={i} value={i}>{i}시간</option>
                  ))}
                </select>
                <select className="w-1/2 border border-gray-400 rounded px-2 py-1 text-sm" defaultValue="0">
                  <option value="0">0분</option>
                  <option value="30">30분</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button className="bg-orange-500 text-white rounded py-2 text-sm">회의 투표 시작</button>
              <button
                onClick={() => setShowSettingPopup(false)}
                className="bg-gray-300 text-black rounded py-2 text-sm"
              >
                뒤로가기
              </button>
            </div>
          </div>
        </div>
      )}

      {showWritePopup && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <PostEditor
            mode="create"
            initialValues={{
              title: "",
              content: "",
              isNotice: false,
              isVote: false,
              voteOptions: [
                { id: crypto.randomUUID(), text: "" },
                { id: crypto.randomUUID(), text: "" },
              ],
            }}
            onSubmit={(newPost) => {
              setPosts([newPost, ...posts]);
              setShowWritePopup(false);
            }}
            onCancel={() => setShowWritePopup(false)}
          />
        </div>
      )}

      {selectedPost && !isEditing && (
        <PostViewer
          post={selectedPost}
          selectedVotes={selectedVotes}
          setSelectedVotes={setSelectedVotes}
          onClose={() => {
            setSelectedPost(null);
            setSelectedVotes([]);
          }}
          onDelete={() => setShowDeleteConfirm(true)}
          onEdit={() => setIsEditing(true)}
        />
      )}

      {selectedPost && isEditing && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <PostEditor
            mode="edit"
            initialValues={{
              id: selectedPost.id,
              title: selectedPost.title,
              content: selectedPost.content,
              isNotice: selectedPost.isNotice,
              isVote: selectedPost.isVote,
              voteOptions: selectedPost.voteOptions ?? [],
            }}
            onSubmit={(updatedPost) => {
              setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
              setSelectedPost(null);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      )}

      {showDeleteConfirm && selectedPost && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white text-black p-4 rounded-lg w-72 space-y-4 text-center">
            <p className="text-sm">정말 이 게시글을 삭제하시겠습니까?</p>
            <div className="flex justify-between">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-300 text-black px-4 py-1 rounded"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setPosts(posts.filter((post) => post.id !== selectedPost.id));
                  setSelectedPost(null);
                  setShowDeleteConfirm(false);
                }}
                className="bg-red-500 text-white px-4 py-1 rounded"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
