"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      await api.post("/auth/login", { username: email, password });
      router.push("/");
    } catch (err) {
      setError(err.response?.data?.message || "로그인 실패");
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `http://54.180.192.103:8080/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-100 text-black p-6">
      <h2 className="text-xl font-bold mb-4">로그인</h2>
      <div className="space-y-4 w-full max-w-xs">
        <input
          type="id"
          placeholder="아이디"
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
          로그인하기
        </button>

        <button
          onClick={() => router.push("/signup")}
          className="w-full text-sm text-blue-600 underline"
        >
          아직 계정이 없으신가요? 회원가입
        </button>

        <div className="text-center text-sm mt-4">또는 소셜 계정으로 로그인</div>
        <div className="flex justify-around">
          <button onClick={() => handleSocialLogin("kakao")}>
            <Image src="/icons/kakao.png" alt="kakao"  width={32} height={32}  />
          </button>
          <button onClick={() => handleSocialLogin("google")}>
            <Image src="/icons/google.png" alt="google"  width={32} height={32}  />
          </button>
          <button onClick={() => handleSocialLogin("naver")}>
            <Image src="/icons/naver.png" alt="naver" width={32} height={32}  />
          </button>
        </div>
      </div>
    </div>
  );
}