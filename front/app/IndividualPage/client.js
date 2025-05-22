'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import PostEditor from '../components/PostEditor';
import PostList from '../components/PostList';
import PostViewer from '../components/PostViewer';
import GroupTable from '../components/GroupTable';
import './page.css';

export default function IndividualClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get("id") || "error";
  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [blockLength, setBlockLength] = useState(1);
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);

  const [selectedTab, setSelectedTab] = useState("timetable");
  const [showSettingPopup, setShowSettingPopup] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
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

  useEffect(() => {
    if (groupId === "error") return;
    const fetchGroup = async () => {
      try {
        const res = await api.get(`/groups/${groupId}`);
        setGroupName(res.data.groupName);
        setEditGroupName(res.data.groupName);
        setGroupCode(res.data.inviteCode);
        setGroupMembers(res.data.members ?? []);
        const hours = res.data.meetingDuration?.hours || 1;
        const minutes = res.data.meetingDuration?.minutes || 0;
        setBlockLength(hours);
        setDurationHours(hours);
        setDurationMinutes(minutes);
      } catch (err) {
        console.error("그룹 정보 불러오기 실패", err);
      }
    };

    const fetchPosts = async () => {
      try {
        const res = await api.get(`/groups/${groupId}/posts/list`);
        setPosts(res.data);
      } catch (err) {
        console.error("게시글 목록 불러오기 실패", err);
      }
    };

    fetchGroup();
    fetchPosts();
  }, [groupId]);

  const handleGroupNameSave = async () => {
    try {
      setGroupName(editGroupName);
      await api.put(`/groups/${groupId}`, { groupName: editGroupName });
      // console.log(groupName, editGroupName)
    } catch (err) {
      console.error("그룹 이름 저장 실패", err);
    }
  };

  const handleDurationSave = async () => {
    try {
      await api.put(`/groups/${groupId}/meeting-duration`, {
        hours: durationHours,
        minutes: durationMinutes
      });
      setBlockLength(durationHours);
      alert("회의 길이 저장 완료");
      setShowSettingPopup(false);
    } catch (err) {
      console.error("회의 길이 저장 실패", err);
    }
  };

  const handleStartVote = async () => {
    if (voteActive) {
      alert("이미 투표가 시작되었습니다.");
      return;
    }
    try {
      await api.post(`/groups/${groupId}/vote/start`);
      alert("투표가 시작되었습니다.");
      setVoteActive(true);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg === "이미 진행 중인 투표가 있습니다.") {
        alert("이미 투표가 시작되어 있습니다.");
        setVoteActive(true);
      } else {
        console.error("투표 시작 실패", err);
        alert("투표 시작 중 오류가 발생했습니다.");
      }
    }
  };


  const handleDelete = async () => {
    try {
      await api.delete(`/posts/${selectedPost.id}`);
      setPosts(posts.filter((post) => post.id !== selectedPost.id));
      setSelectedPost(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("게시글 삭제 실패", err);
    }
  };

  return (
      <div className="relative w-80 mx-auto mx-h-screen bg-neutral-100 flex flex-col">
        <div className="group-header">
          <button onClick={() => router.back()}>
            <Image src={icon_back} alt="back btn" className="group-header-icon" />
          </button>
          <h2 className="text-sm font-bold">{groupName}</h2>
          <button onClick={() => setShowSettingPopup(true)}>
            <Image src={icon_setting} alt="setting btn" className="group-header-icon" />
          </button>
        </div>

        <div className="group-content">
          {selectedTab === "timetable" ? (
            <GroupTable groupId={groupId} blockLength={blockLength} />
          ) : (
            <PostList posts={posts} onSelect={(post) => setSelectedPost(post)} />
          )}
        </div>

        {selectedTab === "board" && (
          <button className="group-pencil-back" onClick={() => setShowWritePopup(true)}>
            <Image src={icon_pencil} alt="write btn"/>
          </button>
        )}

        <div className="group-tabbar">
          <button
            onClick={() => setSelectedTab("timetable")}
            className={`${selectedTab === "timetable" ? "active" : ""}`}
          >
            <Image
              src={selectedTab === "timetable" ? "/icons/calendar-active.png" : "/icons/calendar.png"}
              alt="시간표"
              className="tab-icon"
            />
            <span>시간표</span>
          </button>

          <button
            onClick={() => setSelectedTab("board")}
            className={`${selectedTab === "board" ? "active" : ""}`}
          >
            <Image
              src={selectedTab === "board" ? "/icons/board-active.png" : "/icons/board.png"}
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
                <button onClick={() => setShowSettingPopup(false)} aria-label="뒤로가기">
                  <Image src={icon_back_black} alt="back btn" className="setting-back-icon" />
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
              <button onClick={handleGroupNameSave} className="settings-btn secondary">
                그룹 이름 저장
              </button>

              <div className="settings-label">참여 코드: {groupCode}</div>

              <div className="settings-label">회의 길이</div>
              <div className="settings-duration-selects">
                <select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((i) => (
                    <option key={i} value={i}>{i}시간</option>
                  ))}
                </select>
                <select value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))}>
                  <option value={0}>0분</option>
                  <option value={30}>30분</option>
                </select>
              </div>
              <button onClick={handleDurationSave} className="settings-btn secondary mt-2">
                회의 길이 저장
              </button>
              <div className="settings-label">
                그룹 멤버
                <ul className="text-sm mt-1 space-y-1">
                  {groupMembers.map((member, idx) => (
                    <div key={idx}>{member.username} ({member.role})</div>
                  ))}

                </ul>
              </div>

              <div className="settings-buttons">
                <button onClick={handleStartVote} className="settings-btn primary">회의 투표 시작</button>
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
                  onClick={handleDelete}
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
