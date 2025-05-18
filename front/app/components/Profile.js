"use client";

import { useEffect } from "react";
import { useState } from "react";
import { useUser } from "./UserContext";
import LoginPopup from "./LoginPopup";

export default function Profile({
  visible,
  nickname, setNickname,
  selectedImage, setSelectedImage,
  setShowProfilePopup, setProfileVisible,
  hasProfileImage, setHasProfileImage,
}) {
  const {user, setUser} = useUser();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8080/user/profile", {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setNickname(data.nickname || "그루비");
          if (data.profileImage) {
            setSelectedImage(data.profileImage);
            setHasProfileImage(true);
          } else {
            setSelectedImage(null);
            setHasProfileImage(false);
          }
        }
      } catch (err) {
        console.error("프로필 불러오기 실패:", err);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setNickname("그루비");
      setSelectedImage(null);
      setHasProfileImage(false);
    }
  }, [user]);

  const saveProfile = async () => {
    try {
      const res = await fetch("http://localhost:8080/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nickname,
          profileImage: hasProfileImage ? selectedImage : ""
        })
      });
      if (res.ok) {
        alert("프로필이 저장되었습니다.");
      } else {
        alert("프로필 저장 실패");
      }
    } catch (err) {
      console.error("프로필 저장 실패:", err);
    }
  };

  const handleLogout = async () => {
    await fetch("http://localhost:8080/logout", {method: "GET", credentials: "include"});
    setUser(null);
    setNickname("그루비");
    setSelectedImage(null);
    setHasProfileImage(false);
  };

  const handleLoginSuccess = () => {
    setShowLoginPopup(false);
  };

  return (
    <div className="absolute top-0 right-0 h-full w-3/4 z-50 overflow-hidden">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="profileUpload"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
            setHasProfileImage(true);
          }
        }}
      />
      <div
        className={`h-full bg-white text-black p-6 shadow-lg transition-transform duration-300 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={() => {
            setProfileVisible(false);
            setTimeout(() => setShowProfilePopup(false), 300);
          }}
          className="absolute top-4 right-4 text-sm text-gray-500 hover:text-black"
        >
          🅧
        </button>
        <p className="text-center font-semibold mb-6 text-lg">{nickname || "그루비"}님의 프로필</p>
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-gray-300 rounded-full mb-3 overflow-hidden flex items-center justify-center text-black text-sm font-semibold">
            {hasProfileImage ? (
              <img
                src={selectedImage || "/profile.png"}
                className="object-cover w-full h-full"
                onError={() => {
                  setHasProfileImage(false);
                  setSelectedImage(null);
                }}
                alt="프로필"
              />
            ) : (
              <span>{nickname?.charAt(0) || "?"}</span>
            )}
          </div>
          <button
            onClick={() => document.getElementById("profileUpload")?.click()}
            className="text-sm text-blue-600 underline"
          >
            프로필 사진 업로드
          </button>
          <button
            onClick={() => {
              setSelectedImage(null);
              setHasProfileImage(false);
            }}
            className="text-sm text-red-500 underline mt-1"
          >
            프로필 사진 지우기
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-4 px-2">
          <input
            type="text"
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full border border-gray-400 p-2 rounded text-sm"
          />
          <button
            onClick={saveProfile}
            className="group-btn"
            style={{ borderRadius: "50px" }}
          >
            프로필 저장
          </button>
          {user ? (
            <button
              onClick={handleLogout}
              className="group-btn"
              style={{ borderRadius: "50px" }}
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={() => setShowLoginPopup(true)}
              className="group-btn"
              style={{ borderRadius: "50px" }}
            >
              로그인
            </button>
          )}
        </div>
      </div>

      {showLoginPopup && (
        <LoginPopup
          onClose={() => setShowLoginPopup(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
