"use client";
import { useState } from "react";

export default function LoginPopup({ onClose, onLoginSuccess, onLoginFail }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // 'login' or 'signup'

  const handleAuth = async () => {
    const url = mode === "login" ? "http://54.180.192.103:8080/login" : "http://54.180.192.103:8080/register";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username,
        password,
      }),
      credentials: "include",
    });

    if (res.ok) {
      if (mode === "login") {
        alert("로그인 성공" + "\n| status: " + res.status + "\n| statusText: " + res.statusText + "\n| url: " + res.url);
        onLoginSuccess();
      } else {
        alert("회원가입 성공" + "\n| status: " + res.status + "\n| statusText: " + res.statusText + "\n| url: " + res.url);
        setMode("login");
      }
    } else {
      if (mode === "login") {
        alert("로그인 실패" + "\n| status: " + res.status + "\n| statusText: " + res.statusText + "\n| url: " + res.url);
        onLoginFail();
      } else {
        alert("회원가입 실패" + "\n| status: " + res.status + "\n| statusText: " + res.statusText + "\n| url: " + res.url);
      }
    }
    
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="relative bg-white p-6 rounded-lg w-80 shadow-md">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black text-sm"
        >
          ❌
        </button>

        <h2 className="text-lg text-black font-semibold mb-4 text-center">
          {mode === "login" ? "로그인" : "회원가입"}
        </h2>

        <input
          type="text"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border text-black border-gray-300 p-2 rounded mb-3 text-sm"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border text-black border-gray-300 p-2 rounded mb-4 text-sm"
        />

        <div className="flex justify-around mb-4">
          <button className="bg-green-500 text-white px-3 py-1 rounded text-xs">네이버</button>
          <button className="bg-yellow-400 text-black px-3 py-1 rounded text-xs">카카오</button>
          <button className="bg-blue-500 text-white px-3 py-1 rounded text-xs">구글</button>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => {mode === "login" ? handleAuth() : setMode("login")}}
            className={`px-4 py-2 rounded text-white text-sm ${
              mode === "login" ? "bg-orange-500" : "bg-gray-400"
            }`}
          >
            로그인
          </button>

          <button
            onClick={() => {mode === "signup" ? handleAuth() : setMode("signup")}}
            className={`px-4 py-2 rounded text-white text-sm ${
              mode === "signup" ? "bg-orange-500" : "bg-gray-400"
            }`}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}