'use client'
import React from 'react';
import TimeTable from './components/TimeTable';
import Navbar from './components/Navbar';

export default function Home() {
  return (
    <div>
      <Navbar />
      <TimeTable />
    </div>
  );
}