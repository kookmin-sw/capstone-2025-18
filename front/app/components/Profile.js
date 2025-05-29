"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginPopup from "./LoginPopup";
import "./Profile.css";

export default function Profile({
  visible,
  nickname, setNickname,
  selectedImage, setSelectedImage,
  setShowProfilePopup, setProfileVisible,
  hasProfileImage, setHasProfileImage,
}) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8080/user/profile", {
          credentials: "include"
        });

        if (res.ok) {
          const data = await res.json();
          if (data.profileImage) {
            setSelectedImage(data.profileImage);
            setHasProfileImage(true);
          } else {
            setSelectedImage(null);
            setHasProfileImage(false);
          }
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("프로필 불러오기 실패:", err);
        setIsLoggedIn(false);
      }
    };

    fetchProfile();
  }, []);

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
        console.log("프로필이 저장되었습니다.");
        setShowProfilePopup(false);
      } else {
        console.error("프로필 저장 실패");
      }
    } catch (err) {
      console.error("프로필 저장 실패:", err);
    }
  };

  const handleLogout = async () => {
    await fetch("http://localhost:8080/logout", { method: "GET", credentials: "include" });
    setNickname("");
    setSelectedImage(null);
    setHasProfileImage(false);
    setIsLoggedIn(false);
    router.push("/login");
  };

  const handleLoginSuccess = () => {
    setShowLoginPopup(false);
    window.location.reload();
  };

  return (
    <div className="profile-overlay" onClick={() => setShowProfilePopup(false)}>
      <div className="profile-container">
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
        <div className={`profile-panel ${visible ? 'show' : 'hide'}`}>
          <button
            onClick={() => {
              setProfileVisible(false);
              setTimeout(() => setShowProfilePopup(false), 300);
            }}
            className="profile-close-btn"
          >
            🅧
          </button>

          <p className="profile-title">{nickname}님의 프로필</p>

          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {hasProfileImage ? (
                <img
                  src={selectedImage || "/profile.png"}
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
              className="profile-upload"
            >
              프로필 사진 업로드
            </button>
            <button
              onClick={() => {
                setSelectedImage(null);
                setHasProfileImage(false);
              }}
              className="profile-remove"
            >
              프로필 사진 지우기
            </button>
          </div>

          <div className="profile-form">
            <input
              type="text"
              placeholder="닉네임을 입력하세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="profile-input"
            />

            <button
              onClick={saveProfile}
              className="profile-save-btn"
            >
              변경 사항 저장
            </button>

            {isLoggedIn ? (
              <button onClick={handleLogout} className="profile-action-btn">
                로그아웃
              </button>
            ) : (
              <button
                onClick={() => setShowLoginPopup(true)}
                className="profile-action-btn"
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
            onLoginFail={() => {}}
          />
        )}
      </div>
    </div>

  );
}
