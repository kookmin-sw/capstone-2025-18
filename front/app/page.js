"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TimeTable from "./components/TimeTable";
import Calendar from "./components/Calendar";
import "./page.css"; // 상위 page.css 경로

export default function MainPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("weekly");

  const handleTabClick = (tab) => {
    if (tab === "group") {
      router.push("/GroupPage");
    } else {
      setSelectedTab(tab);
    }
  };

  const renderContent = () => {
    switch (selectedTab) {
      case "weekly":
        return <TimeTable />;
      case "calendar":
        return <Calendar />;
      case "analysis":
        return <p className="text-center text-gray-600">사진 분석 화면</p>;
      default:
        return null;
    }
  };

  const tabConfig = {
    weekly: "위클리",
    calendar: "캘린더",
    group: "그룹",
    analysis: "사진 분석",
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Tm:ta</h2>
      </div>

      <div className="page-content">
        {renderContent()}
      </div>

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
              <img
                src={iconSrc}
                alt={`${tab} icon`}
                className="tab-icon"
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
