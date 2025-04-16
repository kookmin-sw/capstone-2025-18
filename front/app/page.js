'use client'
import React, { useState, useEffect } from 'react';
import Calendar from "./components/Calendar"; 
import TimeTable from './components/TimeTable';
import WheelPicker from './components/WheelPicker';

export default function Home() {
  return (
    <div>
      <Calendar />
      <TimeTable />
    </div>
  );
}