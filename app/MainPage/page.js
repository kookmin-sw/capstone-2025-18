"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        return <p className="text-center text-gray-600">위클리 화면</p>;
      case "calendar":
        return <p className="text-center text-gray-600">캘린더 화면</p>;
      case "analysis":
        return <p className="text-center text-gray-600">사진 분석 화면</p>;
      default:
        return null;
    }
  };

  return (
    <div className="w-80 mx-auto min-h-screen bg-neutral-100 flex flex-col justify-between">
      <div className="bg-black text-white text-center py-3 rounded-b-lg">
        <h2 className="text-lg font-bold">Tm:ta</h2>
      </div>

      <div className="flex-grow flex items-center justify-center">
        {renderContent()}
      </div>

      <div className="flex justify-around bg-white py-2 border-t border-gray-300 rounded-t-lg">
        {["weekly", "calendar", "group", "analysis"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`flex flex-col items-center text-xs ${
              selectedTab === tab
                ? "text-orange-500 font-bold"
                : "text-gray-400"
            }`}
          >
            <span className="text-lg">
              {tab === "weekly" && "W"}
              {tab === "calendar" && "📅"}
              {tab === "group" && "👥"}
              {tab === "analysis" && "📷"}
            </span>
            <span>
              {tab === "weekly" && "위클리"}
              {tab === "calendar" && "캘린더"}
              {tab === "group" && "그룹"}
              {tab === "analysis" && "사진 분석"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
