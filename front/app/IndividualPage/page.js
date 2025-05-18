"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import PostEditor from "../components/PostEditor";
import PostList from "../components/PostList";
import PostViewer from "../components/PostViewer";
import GroupTable from "../components/GroupTable";
import "./page.css"; 

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
  const icon_pencil = `/icons/pencil.png`;
  const icon_setting = `/icons/setting.png`;
  const icon_back = `/icons/back.png`;
  const icon_back_black = `/icons/back-black.png`;

  return (
    <div className="relative w-80 mx-auto mx-h-screen bg-neutral-100 flex flex-col">
      <div className="group-header">
        <button onClick={() => router.back()}>
          <img
            src={icon_back}
            className="group-header-icon"
          />
        </button>
        <h2 className="text-sm font-bold">{editGroupName}</h2>
        <button onClick={() => setShowSettingPopup(true)}>
          <img
            src={icon_setting}
            className="group-header-icon"
          />
        </button>
      </div>

      <div className="group-content">
        {selectedTab === "timetable" ? (
          <GroupTable />
        ) : (
          <PostList posts={posts} onSelect={(post) => setSelectedPost(post)} />
        )}
      </div>

      {selectedTab === "board" && (
        <button
          className="group-pencil-back"
          onClick={() => setShowWritePopup(true)}
        >
          <img
            src={icon_pencil}
          />
        </button>
      )}

      <div className="group-tabbar">
        <button
          onClick={() => setSelectedTab("timetable")}
          className={`${ selectedTab === "timetable" ? "active" : "" }`}
        >
          <img
            src={
              selectedTab === "timetable"
                ? "/icons/calendar-active.png"
                : "/icons/calendar.png"
            }
            alt="시간표"
            className="tab-icon"
          />
          <span>시간표</span>
        </button>

        <button
          onClick={() => setSelectedTab("board")}
          className={`${selectedTab === "board" ? "active" : "" }`}
        >
          <img
            src={
              selectedTab === "board"
                ? "/icons/board-active.png"
                : "/icons/board.png"
            }
            alt="게시판"
            className="tab-icon"
          />
          <span>게시판</span>
        </button>
      </div>

      {showSettingPopup && (
        <div className="settings-popup-overlay">
          <div className="settings-popup-box">
            <div className="settings-header"> 
              <button
                onClick={() => setShowSettingPopup(false)}
                aria-label="뒤로가기"
              >
                <img
                  src={icon_back_black}
                  className="setting-back-icon" 
                />
              </button>
              <h3 className="settings-title">그룹 설정</h3>

            </div>
            
            <div className="settings-label">그룹 이름</div>
            <input
              type="text"
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              className="settings-input"
            />

            <div className="settings-label">참여 코드: {groupCode}</div>

            <div className="settings-label">회의 길이</div>
            <div className="settings-duration-selects">
              <select defaultValue="0">
                {[0, 1, 2, 3, 4].map((i) => (
                  <option key={i} value={i}>{i}시간</option>
                ))}
              </select>
              <select defaultValue="0">
                <option value="0">0분</option>
                <option value="30">30분</option>
              </select>
            </div>

            <div className="settings-label">
              그룹 멤버 
                <div>그루비</div>
                <div>은소리</div>
                <div>그루비룸</div>
            </div>

            <div className="settings-buttons">
              <button className="settings-btn primary">회의 투표 시작</button>
              {/* <button
                onClick={() => setShowSettingPopup(false)}
                className="settings-btn secondary"
              >
                뒤로가기
              </button> */}
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
