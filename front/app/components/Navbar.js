'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import './Navbar.css';

const Navbar = () => {
  const router = useRouter();
  return (
    <div className="navbar">
      <div className="navbar-left">🗓️ 내 타임테이블</div>
      <div className="navbar-right">
        {/* <button>일정 추가</button> */}
        <button onClick={() => router.push('/monthly')}>캘린더 보기</button>
        <button onClick={() => router.push('/group')}>그룹</button>
      </div>
    </div>
  );
};

export default Navbar;