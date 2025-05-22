"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import api from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      await api.post("/auth/register", { username, email, password });
      router.push("/login");
    } catch (err) {
      setError(err.response?.data?.message || "회원가입 실패");
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `http://localhost:8080/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-100 text-black p-6">
      <h2 className="text-xl font-bold mb-4">회원가입</h2>
      <div className="space-y-4 w-full max-w-xs">
        <input
          type="text"
          placeholder="닉네임"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-gray-400 p-2 rounded text-sm"
        />
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-400 p-2 rounded text-sm"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-400 p-2 rounded text-sm"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={handleSubmit}
          className="w-full bg-yellow-500 text-white p-2 rounded mt-2"
        >
          가입하고 시작하기
        </button>

        <button
          onClick={() => router.push("/login")}
          className="w-full text-sm text-blue-600 underline"
        >
          이미 계정이 있으신가요? 로그인
        </button>

        <div className="text-center text-sm mt-4">또는 소셜 계정으로 가입</div>
        <div className="flex justify-around">
          <button onClick={() => handleSocialLogin("kakao")}> <Image src="/icons/kakao.png" alt="kakao" className="w-8" /></button>
          <button onClick={() => handleSocialLogin("google")}> <Image src="/icons/google.png" alt="google" className="w-8" /></button>
          <button onClick={() => handleSocialLogin("naver")}> <Image src="/icons/naver.png" alt="naver" className="w-8" /></button>
        </div>
      </div>
    </div>
  );
}