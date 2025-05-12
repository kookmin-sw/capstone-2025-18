'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import './Navbar.css';

const Navbar = () => {
  const router = useRouter();
  return (
    <div className="navbar">
      <div className="navbar-left">Weekly</div>
      <div className="navbar-right">
        {/* <button>일정 추가</button> */}
        <button onClick={() => router.push('/monthly')}>Monthly</button>
        <button onClick={() => router.push('/GroupPage')}>Group</button>
      </div>
    </div>
  );
};

export default Navbar;