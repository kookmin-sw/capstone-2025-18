"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import TimeTable from "./components/TimeTable";
import Calendar from "./components/Calendar";
import Image from 'next/image';
import "./page.css";

export default function MainPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("weekly");
  const [authenticated, setAuthenticated] = useState(null); // null = 체크 중, false = 비로그인, true = 로그인됨

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/me");
        if (res.data.username) {
          setAuthenticated(true);
          console.log(res.data);
        } else {
          setAuthenticated(false);
          router.push("/signup");
        }
      } catch {
        setAuthenticated(false);
        router.push("/signup");
      }
    };
    checkAuth();
  }, [router]);

  const handleTabClick = (tab) => {
    if (tab === "group") {
      router.push("/GroupPage");
    } else {
      setSelectedTab(tab);
    }
  };

  const renderContent = () => {
    switch (selectedTab) {
      case "weekly": return <TimeTable />;
      case "calendar": return <Calendar />;
      case "analysis": return <p className="text-center text-gray-600">사진 분석 화면</p>;
      default: return null;
    }
  };

  const tabConfig = {
    weekly: "위클리",
    calendar: "캘린더",
    group: "그룹",
    analysis: "사진 분석",
  };

  if (authenticated === null) return <p className="text-center p-8">로그인 상태 확인 중...</p>;
  if (!authenticated) return null;
  const earIcon = `/icons/ear-header.png`;
  return (
    <div className="page-container">
      <div className="page-header">
        <Image src={earIcon} alt="header" width={95} height={90} className="ear-left" />
        <h2>Tm:ta</h2>

        <Image src={earIcon} alt="header" width={95} height={90} className="ear-right" />
      </div>
      <div className="page-content">{renderContent()}</div>
      <div className="page-tabbar">
        {Object.entries(tabConfig).map(([tab, label]) => {
          const isActive = selectedTab === tab;
          const iconSrc = `/icons/${tab}${isActive ? "-active" : ""}.png`;
          return (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={isActive ? "active" : ""}
            >
              <Image src={iconSrc} alt={`${tab} icon`} width={24} height={24} className="tab-icon" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
