
'use client';
import React, { useState, useEffect, useRef } from 'react';
import './WheelPicker.css';

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 6 }, (_, i) => i * 10);

const repeat = 5;

const loopedHours = Array.from({ length: hours.length * repeat }, (_, i) => {
  return hours[i % hours.length];
});

const loopedMinutes = Array.from({ length: minutes.length * repeat }, (_, i) => {
  return minutes[i % minutes.length];
});

const getDefaultTime = () => {
  const now = new Date();
  let hour = now.getHours();
  let minute = now.getMinutes();
  let flooredMinute = Math.floor(minute / 10) * 10;

  if (flooredMinute === 60) {
    hour = hour + 1;
    flooredMinute = 0;
  }

  const startHour = hour;
  const startMinute = flooredMinute;
  const endHour = startHour < 23 ? startHour + 1 : 0;
  const endMinute = startMinute;

  return {
    startHour,
    startMinute,
    endHour,
    endMinute,
  };
};

const WheelPicker = ({ onTimeChange = () => {} }) => {
  const defaultTime = useRef(getDefaultTime()).current;
  // console.log(defaultTime.startHour);
  const [sh, setSH] = useState(defaultTime.startHour);
  const [sm, setSM] = useState(defaultTime.startMinute);
  const [eh, setEH] = useState(defaultTime.endHour);
  const [em, setEM] = useState(defaultTime.endMinute);

  const shRef = useRef(null);
  const smRef = useRef(null);
  const ehRef = useRef(null);
  const emRef = useRef(null);
  const alignInitialScroll = (ref, index) => {
    if (ref.current) {
      ref.current.scrollTo({
        top: index * 40 - (ref.current.clientHeight / 2 - 20),
        behavior: 'auto',
      });
    }
  };

  useEffect(() => { // 위치 초기화
    alignInitialScroll(shRef, sh);
    alignInitialScroll(smRef, sm / 10);
    alignInitialScroll(ehRef, eh);
    alignInitialScroll(emRef, em / 10);
    setTimeout(() => {
      didInit.current = true;
    }, 50); // 💡 위치 조정이 끝난 뒤 true로 설정
  }, []);

  useEffect(() => {
    if (sh > eh || (sh === eh && sm >= em)) {
      console.log("yeah")
      const newEH = sh < 23 ? sh + 1 : 0;
      setEH(newEH);
      alignInitialScroll(ehRef, newEH)
    }
  
    onTimeChange(
      { hour: sh, minute: sm },
      { hour: eh, minute: em }
    );
    console.log(sh, eh)
    
  }, [sh, sm, eh, em]);

  const didInit = useRef(false);

  useEffect(() => { // 첫 렌더 끝난 뒤 true. 처음 렌더 시 ScrollHandler 막기 위해
    setTimeout(() => {
      didInit.current = true;
    }, 0);
  }, []);
  
  const getScrollHandler = (ref, values, setter) => () => { // ScrollHandler Contrl
    if (!didInit.current) return;
    scrollHandler(ref, values, setter);
  };

  const scrollHandler = (ref, values, setSelected) => {
    if (!didInit.current || !ref.current) return;
  
    const container = ref.current;
    const items = container.querySelectorAll('li');
    const centerY = container.getBoundingClientRect().top + container.clientHeight / 2;
  
    let closest = null;
    let closestDist = Infinity;
  
    items.forEach((item, index) => {
      const itemCenter = item.getBoundingClientRect().top + item.clientHeight / 2;
      const dist = Math.abs(itemCenter - centerY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = values[index];
      }
    });
    if (closest !== undefined) {
      // ✅ 현재 선택된 값과 다를 때만 변경
      setSelected(prev => (prev === closest ? prev : closest));
    }

  };

  const renderWheel = (ref, values,loopValues, selected, setSelected, label) => (
    <div className="wheel-stack">
      <ul
        className="wheel-list"
        ref={ref}
        onScroll={getScrollHandler(ref, loopValues, setSelected)}
      >
        {loopValues.map((v, i) => (
          <li key={`hour-${i}`} className={v === selected ? 'selected' : ''}>
            {v.toString().padStart(2, '0')}
          </li>
        ))}
      </ul>
      <span className="wheel-unit">{label}</span>
    </div>
  );

  return (
    <div className="wheel-wrapper">
      <div className="wheel-column">
        <label>시작</label>
        <div className="wheel-double">
          <div className="wheel-highlight"></div>
          {renderWheel(shRef, hours, loopedHours, sh, setSH, '시')}
          {renderWheel(smRef, minutes, loopedMinutes, sm, setSM, '분')}
        </div>
      </div>
      <div className="wheel-column">
        <label>종료</label>
        <div className="wheel-double">
          <div className="wheel-highlight"></div>
          {renderWheel(ehRef, hours, loopedHours, eh, setEH, '시')}
          {renderWheel(emRef, minutes, loopedMinutes, em, setEM, '분')}
        </div>
      </div>
    </div>
  );
};

export default WheelPicker;