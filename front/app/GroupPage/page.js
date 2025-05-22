"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from 'next/image';
import api from "@/lib/api";
import GroupList from "../components/GroupList";
import Profile from "../components/Profile";
import GroupCreatePopup from "../components/GroupCreatePopup";
import GroupJoinPopup from "../components/GroupJoinPopup";
import GroupExitPopup from "../components/GroupExitPopup";
import './group.css';

export default function GroupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("그루비");
  const [groups, setGroups] = useState([]);
  const [openGroup, setOpenGroup] = useState(null);
  const [exitGroupId, setExitGroupId] = useState(null); 
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/me');
        setNickname(res.data.username);
        // console.log(res.data);
      } catch (err) {
        router.push('/login');
        console.error("닉네임 조회 실패", err);
      }
    };

    const fetchGroups = async () => {
      try {
        const res = await api.get('/groups');
        // console.log("aa");
        // console.log(res.data);
        setGroups(res.data.map(group => ({
          id: group.groupId,
          name: group.groupName,
          members: group.memberCount,
          code: group.inviteCode
        })));

      } catch (err) {
        console.error("그룹 목록 불러오기 실패", err);
      }
    };

    fetchUser();
    fetchGroups();
  }, []);

  const toggleGroup = (id) => {
    setOpenGroup(openGroup === id ? null : id);
  };

  const confirmExitGroup = async () => {

  if (!exitGroupId) {
    console.error("exitGroupId가 정의되지 않음");
    return;
  }

    try {
      await api.post(`/groups/${exitGroupId}/leave`);
      setGroups(groups.filter((group) => group.id !== exitGroupId));
      setShowExitPopup(false);
      setExitGroupId(null);
      setOpenGroup(null);
    } catch (err) {
      console.error("그룹 나가기 실패", err);
    }
  };

  const requestExitPopup = (groupId) => {
    setExitGroupId(groupId);
    setShowExitPopup(true);
  };

  const joinGroup = () => {
    setShowJoinPopup(false);
  };

  const createGroup = async () => {
    try {
      const res = await api.post('/groups', { groupName: newGroupName });
      const newGroup = {
        id: res.data.groupId,
        name: newGroupName.trim() || "그루비룸",
        members: 1,
        code: res.data.inviteCode
      };
      setGroups([...groups, newGroup]);
    } catch (err) {
      console.error("그룹 생성 실패", err);
    } finally {
      setShowCreatePopup(false);
      setNewGroupName("");
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
  const icon_plus = `/icons/plus.png`;

  return (
    <div className="group-page-container">
      <div className="group-page-header">
        <button onClick={() => router.push("/")} aria-label="뒤로가기">
          <Image src={icon_back_black} alt="back btn" width={18} height={30} className="header-icon" />
        </button>
        <h2 className="text-center font-bold">내 그룹</h2>
        <button
          onClick={() => {
            setShowProfilePopup(true);
            setTimeout(() => setProfileVisible(true), 10);
          }}
        >
          <Image src={icon_person} alt="person btn" width={30} height={30} className="header-icon" />
        </button>
      </div>

      <GroupList
        groups={groups}
        openGroup={openGroup}
        toggleGroup={toggleGroup}
        moveToIndividualPage={moveToIndividualPage}
        openExitPopup={requestExitPopup}
      />

      <div className="fixed bottom-0 left-0 w-full z-10">
        <div className="w-80 mx-auto px-4 py-3 flex justify-between">
          <button onClick={() => setShowJoinPopup(true)} className="groupList-btn">
            <Image src={icon_search} width={22} height={22} alt="search btn"/>
            그룹 찾기
          </button>
          <button onClick={() => setShowCreatePopup(true)} className="groupList-btn">
            <Image src={icon_plus} width={22} height={22} alt="add btn"/>
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
          hasProfileImage={true}
          setHasProfileImage={() => {}}
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
          onExit={confirmExitGroup}
        />
      )}
    </div>
  );
}