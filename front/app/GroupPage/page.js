"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import GroupList from "../components/GroupList";
import Profile from "../components/Profile";
import GroupCreatePopup from "../components/GroupCreatePopup";
import GroupJoinPopup from "../components/GroupJoinPopup";
import GroupExitPopup from "../components/GroupExitPopup";
import './group.css';

export default function GroupPage() {
  const router = useRouter();

  const [groups, setGroups] = useState([
    { id: crypto.randomUUID(), name: "캡스톤 아자아자", members: 4, code: "ABC12" },
  ]);
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

  const genCode = () => {
    let code;
    const existingCode = groups.map((c) => c.code);
    do {
      code = crypto.randomUUID().replace(/-/g, "").slice(0, 5).toUpperCase();
    } while (existingCode.includes(code));
    return code;
  };

  const toggleGroup = (id) => {
    setOpenGroup(openGroup === id ? null : id);
  };

  const exitGroup = () => {
    setGroups(groups.filter((group) => group.id !== openGroup));
    setShowExitPopup(false);
    setOpenGroup(null);
  };

  const joinGroup = () => {
    setShowJoinPopup(false);
  };

  const createGroup = () => {
    const groupName = newGroupName.trim() || "그루비룸";
    const newGroup = {
      id: crypto.randomUUID(),
      name: groupName,
      members: 1,
      code: genCode(),
    };
    setGroups([...groups, newGroup]);
    setShowCreatePopup(false);
    setNewGroupName("");
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
