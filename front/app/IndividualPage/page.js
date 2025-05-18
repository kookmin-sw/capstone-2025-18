"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";
import PostEditor from "../components/PostEditor";
import PostList from "../components/PostList";
import PostViewer from "../components/PostViewer";
import GroupTable from "../components/GroupTable";
import "./page.css"; 

export default function IndividualPage() {
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState("timetable");
  const [showSettingPopup, setShowSettingPopup] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [members, setMembers] = useState([]);
  const [ownerId, setOwnerId] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [posts, setPosts] = useState([]);
  const [showWritePopup, setShowWritePopup] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostDelete, setSelectedPostDelete] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [selectedVotes, setSelectedVotes] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const icon_pencil = `/icons/pencil.png`;
  const icon_setting = `/icons/setting.png`;
  const icon_back = `/icons/back.png`;
  const icon_back_black = `/icons/back-black.png`;


  useEffect(() => {
    if (groupId) {
      fetchTags();
      fetchSharedTagIds();
    }
  }, [groupId]);

  const [allTags, setAllTags] = useState([]);
  const [sharedTagIds, setSharedTagIds] = useState([]);

  const fetchTags = async () => {
    const res = await fetch(`http://localhost:8080/tags`, {
      credentials: "include",
    });
    const tags = await res.json();
    setAllTags(tags);
  };

  const fetchSharedTagIds = async () => {
    const res = await fetch(`http://localhost:8080/groups/${groupId}/share-tags`, {
      credentials: "include",
    });
    const data = await res.json();
    setSharedTagIds(data.sharedTagIds);
  };

  const toggleTag = (tagId) => {
    setSharedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const submitSharedTags = async () => {
    const res = await fetch(`http://localhost:8080/groups/${groupId}/share-tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tagIds: sharedTagIds }),
    });

    if (res.ok) {
      alert("공유 태그 설정 완료");
    } else {
      alert("공유 태그 설정 실패");
    }
  };

  useEffect(() => {
    const storageId = sessionStorage.getItem("selectedGroupId");
    if (!storageId) {
      alert("그룹 정보가 없습니다. 다시 선택해주세요.");
      router.push("/GroupPage");
      return;
    }

    fetch(`http://localhost:8080/groups/${storageId}`, {credentials: "include"})
      .then((res) => res.json())
      .then((data) => {
        setGroupId(storageId);
        setEditGroupName(data.groupName);
        setGroupCode(data.inviteCode);
        setMembers(data.members || []);
        setOwnerId(data.ownerId);

        fetch("http://localhost:8080/isAuth", { credentials: "include" })
          .then((res) => res.json())
          .then((auth) => {setMyUserId(auth.user._id);});
      })
      .catch((err) => {
        console.error("그룹 정보 불러오기 실패", err);
      });
  }, []);


  useEffect(() => {
    if (groupId && selectedTab === "board") {
      fetchPosts();
    }
  }, [groupId, selectedTab]);

  const fetchPosts = async () => {
    const res = await fetch(`http://localhost:8080/groups/${groupId}/posts`, {
      credentials: "include"
    });

    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    } else {
      console.error("게시글 목록 조회 실패");
    }
  };
  const handleTransferOwner = async (targetUserId) => {
    const res = await fetch(`http://localhost:8080/groups/${groupId}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ targetUserId })
    });

    const data = await res.json();

    if (res.ok) {
      alert("그룹장을 성공적으로 넘겼습니다.");
      window.location.reload();
    } else {
      alert(data.message || "그룹장 넘기기에 실패했습니다.");
    }
  };

  const handleKickMember = async (targetUserId) => {
    const res = await fetch(`http://localhost:8080/groups/${groupId}/kick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ targetUserId })
    });

    const data = await res.json();

    if (res.ok) {
      alert("해당 멤버를 성공적으로 강퇴했습니다.");
      window.location.reload();
    } else {
      alert(data.message || "강퇴에 실패했습니다.");
    }
  };

  const handleUpdateGroupName = async () => {
    if (!editGroupName.trim()) {
      alert("그룹 이름이 없습니다!");
      return;
    }

    const res = await fetch(`http://localhost:8080/groups/${groupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ groupName: editGroupName.trim() }),
    });
    alert("그룹 명 변경 완료!");
  };

  const handlePostSubmit = async (form) => {
    const res = await fetch(`http://localhost:8080/groups/${groupId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: form.title,
        content: form.content,
        isNotice: form.isNotice,
        isVote: form.isVote,
        voteOptions: form.voteOptions || []
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert("게시글 작성 성공!");
      setShowWritePopup(false);
      await fetchPosts();
    } else {
      alert(data.message || "작성 실패");
    }
  };

  const handlePostUpdate = async (form) => {
    const res = await fetch(`http://localhost:8080/posts/${form.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: form.title,
        content: form.content,
        isNotice: form.isNotice,
        isVote: form.isVote,
        voteOptions: form.voteOptions || []
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert("게시글 수정 성공!");
      await fetchPosts();
      setSelectedPost(null);
      setIsEditing(false);
    } else {
      alert(data.message || "수정 실패");
    }
  };

  const handlePostDelete = async () => {
    const res = await fetch(`http://localhost:8080/posts/${selectedPostDelete._id}`, {
      method: "DELETE",
      credentials: "include"
    });

    const data = await res.json();

    if (res.ok) {
      alert("게시글 삭제 완료");
      await fetchPosts();
      setSelectedPost(null);
      setShowDeleteConfirm(false);
    } else {
      alert(data.message || "삭제 실패");
    }
  };

  const handlePostSelect = async (post) => {
    const res = await fetch(`http://localhost:8080/posts/${post._id}`, {
      credentials: "include"
    });

    const data = await res.json();

    if (res.ok) {
      setSelectedPost(data.post);
      setPostComments(data.comments || []);
    } else {
      alert("게시글 상세 조회 실패");
    }
  };


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
          <PostList posts={posts} onSelect={(post) => handlePostSelect(post)} />
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
              <div className="settings-row">
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="settings-input"
                />
                <button
                  onClick={handleUpdateGroupName}
                  className="settings-name-button"
                >
                  이름 변경
                </button>
              </div>
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

            <div className="settings-label">공유할 태그 선택</div>
            <div className="settings-label">
              {allTags.map(tag => (
                <button
                  key={tag._id}
                  className={`tag-select-btn ${sharedTagIds.includes(tag._id) ? 'selected' : ''}`}
                  style={{ backgroundColor: tag.color }}
                  onClick={() => toggleTag(tag._id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>

            <button onClick={submitSharedTags} className="settings-btn primary">공유 태그 저장</button>


            <div className="settings-label">그룹 멤버</div>
            <div className="settings-members-list">
              {members.map((member) => (
                <div key={member.userId} className="settings-label">
                  {member.userId === ownerId && "👑 "}
                  {member.username}
                  {myUserId === ownerId && member.userId !== myUserId && (
                    <div className="settings-label">
                      <button
                        onClick={() => handleTransferOwner(member.userId)}
                        className="settings-btn"
                      >
                        그룹장 넘기기
                      </button>
                      <button
                        onClick={() => handleKickMember(member.userId)}
                        className="settings-btn"
                      >
                        강퇴
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
            onSubmit={handlePostSubmit}
            onCancel={() => setShowWritePopup(false)}
          />
        </div>
      )}

      {selectedPost && !isEditing && (
        <PostViewer
          post={selectedPost}
          comments={postComments}
          selectedVotes={selectedVotes}
          setSelectedVotes={setSelectedVotes}
          onClose={() => {
            setSelectedPost(null);
            setSelectedVotes([]);
          }}
          onDelete={() => {
            setSelectedPostDelete(selectedPost);
            setSelectedPost(null);
            setShowDeleteConfirm(true);
          }}
          onEdit={() => setIsEditing(true)}
          refreshPost={() => handlePostSelect(selectedPost)}
        />
      )}

      {selectedPost && isEditing && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <PostEditor
            mode="edit"
            initialValues={{
              id: selectedPost._id,
              title: selectedPost.title,
              content: selectedPost.content,
              isNotice: selectedPost.isNotice,
              isVote: selectedPost.isVote,
              voteOptions: selectedPost.voteOptions ?? [],
            }}
            onSubmit={handlePostUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      )}

      {selectedPostDelete && showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-60">
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
                onClick={handlePostDelete}
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
