"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "../components/UserContext";
import GroupList from "../components/GroupList";
import Profile from "../components/Profile";
import GroupCreatePopup from "../components/GroupCreatePopup";
import GroupJoinPopup from "../components/GroupJoinPopup";
import GroupExitPopup from "../components/GroupExitPopup";
import './group.css';

export default function GroupPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  const [groups, setGroups] = useState([]);
  const [nickname, setNickname] = useState("그루비");
  const [hasProfileImage, setHasProfileImage] = useState(true);
  const [openGroup, setOpenGroup] = useState(null);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!loading && user) {
      fetch("http://localhost:8080/groups", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          setGroups(data);
        })
        .catch((err) => {
          console.error("그룹 목록 불러오기 실패", err);
        });
    }
  }, [user, loading]);

  const toggleGroup = (id) => {
    setOpenGroup(openGroup === id ? null : id);
  };

  const exitGroup = async () => {
    try {
      const res = await fetch(`http://localhost:8080/groups/${openGroup}/leave`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setGroups(groups.filter((group) => group.groupId !== openGroup));
        setShowExitPopup(false);
        setOpenGroup(null);
      } else {
        alert("그룹 나가기 실패");
      }
    } catch (err) {
      console.error("그룹 나가기 중 오류:", err);
    }
  };

  const joinGroup = () => {
    setShowJoinPopup(false);
  };

  const createGroup = async () => {
    const groupName = newGroupName.trim() || "새 그룹";

    try {
      const res = await fetch("http://localhost:8080/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName }),
        credentials: "include",
      });

      if (res.ok) {
        const createdGroup = await res.json();
        setGroups([...groups, {
            groupId: createdGroup.groupId,
            groupName: groupName,
            inviteCode: createdGroup.inviteCode,
            role: "admin",
            joinedAt: new Date().toISOString()
        }]);
        setShowCreatePopup(false);
        setNewGroupName("");
      } else {
        alert("그룹 생성 실패");
      }
    } catch (err) {
      console.error("그룹 생성 중 오류:", err);
    }
  };


  const moveToIndividualPage = (group) => {
    router.push(
      `/IndividualPage?id=${group.id}&name=${encodeURIComponent(group.name)}&code=${group.code}`
    );
  };

  const icon_person = `/icons/person.png`;
  const icon_back_black = `/icons/back-black.png`;
  const icon_search = `/icons/search.png`;
  const icon_plus = `/icons/plus.png`
  return (
    <div className="group-page-container">
      <div className="group-page-header">
        <button
          onClick={() => router.push("/")}
          aria-label="뒤로가기"
        >
          <img
            src={icon_back_black}
            className="header-icon" 
          />
        </button>
        <h2 className="text-center font-bold">내 그룹</h2>
        <button
          onClick={() => {
            setShowProfilePopup(true);
            setTimeout(() => setProfileVisible(true), 10);
          }}
        >
          <img src={icon_person} className="header-icon" />
        </button>
      </div>

      <GroupList
        groups={groups}
        openGroup={openGroup}
        toggleGroup={toggleGroup}
        moveToIndividualPage={moveToIndividualPage}
        openExitPopup={() => setShowExitPopup(true)}
      />

      <div className="fixed bottom-0 left-0 w-full z-10">
        <div className="w-80 mx-auto px-4 py-3 flex justify-between">
          <button onClick={() => setShowJoinPopup(true)} className="groupList-btn">
            <img src={icon_search} />
            그룹 찾기
          </button>
          <button onClick={() => setShowCreatePopup(true)} className="groupList-btn">
            <img src={icon_plus} />
            그룹 생성
          </button>
        </div>
      </div>

      {showProfilePopup && (
        <Profile
          visible={profileVisible}
          nickname={nickname}
          setNickname={setNickname}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          setShowProfilePopup={setShowProfilePopup}
          setProfileVisible={setProfileVisible}
          hasProfileImage={hasProfileImage}
          setHasProfileImage={setHasProfileImage}
        />
      )}

      {showCreatePopup && (
        <GroupCreatePopup
          value={newGroupName}
          onChange={setNewGroupName}
          onCancel={() => setShowCreatePopup(false)}
          onCreate={createGroup}
        />
      )}

      {showJoinPopup && (
        <GroupJoinPopup
          onCancel={() => setShowJoinPopup(false)}
          onJoin={joinGroup}
        />
      )}

      {showExitPopup && (
        <GroupExitPopup
          onCancel={() => setShowExitPopup(false)}
          onExit={exitGroup}
        />
      )}
    </div>
  );
}
