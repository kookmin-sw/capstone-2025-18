"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="w-80 mx-auto min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-xl font-bold mb-6">홈 화면</h1>
      <button
        onClick={() => router.push("/MainPage")}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        메인 페이지로 이동
      </button>
    </div>
  );
}
