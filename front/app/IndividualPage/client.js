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
  const [editGroupName, setEditGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);

  const [myUserId, setMyUserId] = useState("");
  const [ownerId, setOwnerId] = useState("");

  const [blockLength, setBlockLength] = useState(1);
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);

  const [allTags, setAllTags] = useState([]);
  const [sharedTagIds, setSharedTagIds] = useState([]);

  const [selectedTab, setSelectedTab] = useState("timetable");
  
  const [posts, setPosts] = useState([]);
  const [voteActive, setVoteActive] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedVotes, setSelectedVotes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [showSettingPopup, setShowSettingPopup] = useState(false);
  const [showWritePopup, setShowWritePopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const icon_pencil = `/icons/pencil.png`;
  const icon_setting = `/icons/setting.png`;
  const icon_back = `/icons/back.png`;
  const icon_back_black = `/icons/back-black.png`;

  console.log("렌더링 시 voteActive =", voteActive);
  useEffect(() => {
    if (groupId === "error") return;

    const fetchGroup = async () => {
      try {
        const res = await api.get(`/groups/${groupId}`);
        setGroupName(res.data.groupName);
        setEditGroupName(res.data.groupName);
        setGroupCode(res.data.inviteCode);
        setGroupMembers(res.data.members ?? []);
        setOwnerId(res.data.ownerId);
        setDurationHours(res.data.meetingDuration?.hours || 1);
        setDurationMinutes(res.data.meetingDuration?.minutes || 0);
        setBlockLength(res.data.meetingDuration?.hours || 1);
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

    const fetchAuth = async () => {
      try {
        const res = await api.get(`/isAuth`);
        setMyUserId(res.data.user._id);
      } catch (err) {
        console.error("내 사용자 정보 조회 실패", err);
      }
    };

    const fetchTags = async () => {
      try {
        const res = await api.get('/tags');
        setAllTags(res.data);
      } catch (err) {
        console.error("태그 조회 실패", err);
      }
    };

    const fetchSharedTagIds = async () => {
      try {
        const res = await api.get(`/groups/${groupId}/share-tags`);
        setSharedTagIds(res.data.sharedTagIds);
      } catch (err) {
        console.error("공유 태그 조회 실패", err);
      }
    };
    const fetchVoteStatus = async () => {
      try {
        const res = await api.get(`/groups/${groupId}/vote/status`);
        if (res.status === 200) {
          setVoteActive(true);
        } else {
          setVoteActive(false);
        }
      } catch (err) {
        console.warn("투표 상태 조회 실패:", err.response?.status || err.message);
        setVoteActive(false);
      }
    };


    fetchGroup();
    fetchPosts();
    fetchAuth();
    fetchTags();
    fetchSharedTagIds();
    fetchVoteStatus();
  }, [groupId]);
  // console.log(groupMembers);
  const toggleTag = (tagId) => {
    setSharedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
    // window.location.reload();
  };

  const submitSharedTags = async () => {
    try {
      await api.post(`/groups/${groupId}/share-tags`, { tagIds: sharedTagIds });
      console.log("공유 태그 설정 완료");
    } catch (err) {
      console.error("공유 태그 설정 실패");
    }
  };

  const handleGroupNameSave = async () => {
    try {
      setGroupName(editGroupName);
      await api.put(`/groups/${groupId}`, { groupName: editGroupName });
    } catch (err) {
      console.error("그룹 이름 저장 실패", err);
    }
  };

  const handleCloseVote = async () => {
    try {
      const res = await api.post(`/groups/${groupId}/vote/close`);
      console.log(res.data.message);
      setVoteActive(false);
    } catch (err) {
      console.error("투표 종료 실패");
    }
  };

  const handleDurationSave = async () => {
    try {
      await api.put(`/groups/${groupId}/meeting-duration`, {
        hours: durationHours,
        minutes: durationMinutes
      });
      setBlockLength(durationHours);
      console.log("회의 길이 저장 완료");
      // setShowSettingPopup(false);
    } catch (err) {
      console.error("회의 길이 저장 실패", err);
    }
  };

  const handleStartVote = async () => {
    try {
      await api.post(`/groups/${groupId}/vote/start`);
      console.log("투표가 시작되었습니다.");
      setShowSettingPopup(false);
      window.location.reload();
    } catch (err) {
      console.error("투표 시작 실패");
    }
  };

  const handleTransferOwner = async (targetUserId) => {
    try {
      await api.post(`/groups/${groupId}/transfer`, { targetUserId });
      console.log("그룹장을 성공적으로 넘겼습니다.");
      location.reload();
    } catch (err) {
      console.error("그룹장 넘기기에 실패했습니다.");
    }
  };

  const handleKickMember = async (targetUserId) => {
    try {
      await api.post(`/groups/${groupId}/kick`, { targetUserId });
      console.log("강퇴 완료");
      location.reload();
    } catch (err) {
      console.error("강퇴 실패");
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
  
  useEffect(() => {
    console.log("voteActive changed:", voteActive);
  }, [voteActive]);

  return (
      <div className="relative mx-auto mx-h-screen bg-neutral-100 flex flex-col">
        <div className="group-header">
          <button onClick={() => router.back()}>
            <Image src={icon_back} alt="back btn" width={18} height={30} className="group-header-icon" />
          </button>
          <h2 className="text-sm font-bold">{groupName}</h2>
          <button onClick={() => setShowSettingPopup(true)}>
            <Image src={icon_setting} alt="setting btn"  width={30} height={30} className="group-header-icon" />
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
            <Image src={icon_pencil}  width={30} height={30} alt="write btn"/>
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
              width={30} height={30}
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
              width={30} height={30}
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
                  <Image src={icon_back_black} alt="back btn" width={18} height={30} className="setting-back-icon" />
                </button>
                <h3 className="settings-title">그룹 설정</h3>
              </div>

              <div className="settings-label">그룹 이름</div>
              <div className="settings-duration-selects">
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="settings-input"
                />
                <button onClick={handleGroupNameSave} className="settings-btn secondary">
                    바꾸기
                </button>
              </div>
              <div className="settings-label">일정 길이</div>
              <div className="settings-duration-selects">
                <select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))}>
                  {[1, 2, 3, 4].map((i) => (
                    <option key={i} value={i}>{i}시간</option>
                  ))}
                </select>
                <button onClick={handleDurationSave} className="settings-btn secondary">
                  길이 저장
                </button>
              </div>
            
              <div className='settings-share'>
                <div className='settings-share-header'>
                  <div className="settings-label">공유할 태그 선택</div>
                  <button onClick={submitSharedTags} className="settings-share-btn">공유 태그 저장</button>
                </div>
                  <div className="settings-tag-filter-buttons">
                    {allTags.map(tag => (
                      <button
                        key={tag._id}              
                        className={`settings-tag-option-btn ${sharedTagIds.includes(tag._id) ? 'selected' : ''}`}
                        style={{ backgroundColor: tag.color }}
                        onClick={() => toggleTag(tag._id)}
                      >
                        {tag.name}
                      </button>
                    ))}
                    
                  </div>
              </div>

            <div className="settings-label">참여 코드: {groupCode}</div>
            <div className="settings-label">그룹 멤버</div>
            <div className="settings-members-list">
              {groupMembers.map((member) => (
                <div key={member.userId} className="settings-label">
                  {member.userId === ownerId && "👑 "}{member.username}
                  {myUserId === ownerId && member.userId !== myUserId && (
                    <div className="settings-label">
                      <button onClick={() => handleTransferOwner(member.userId)} className="settings-btn">그룹장 넘기기</button>
                      <button onClick={() => handleKickMember(member.userId)} className="settings-btn">강퇴</button>
                    </div>
                  )}
                </div>
              ))}
            </div>


              <div className="settings-buttons">
                {voteActive ? (
                  <button
                    onClick={handleCloseVote}
                    className="settings-btn primary"
                    style={{ backgroundColor: "#adadad", color: "white" }}
                  >
                    투표 종료
                  </button>
                ) : (
                  <button onClick={handleStartVote} className="settings-btn primary">
                    투표 시작
                  </button>
                )}
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
