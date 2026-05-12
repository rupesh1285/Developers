// src/components/TimerProvider.jsx
import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';

// TimerProvider renders ONLY Navbar. Its setState calls never reach Dashboard.
export default function TimerProvider({ userProfile }) {
  // Manual stopwatch logic removed (moved to ProblemWorkspace)
  const intervalRef = useRef(null);


  // Passive dashboard tracker — writes to localStorage only, no state
  useEffect(() => {
    let lastPassiveTick = Date.now();
    const passiveInterval = setInterval(() => {
      if (document.hidden) { lastPassiveTick = Date.now(); return; }
      const now = Date.now();
      const delta = now - lastPassiveTick;
      lastPassiveTick = now;
      const cum = parseInt(localStorage.getItem('finalist_cumulative_time')) || 0;
      localStorage.setItem('finalist_cumulative_time', cum + delta);
      // AnalyticsPanel reads localStorage directly via liveTimer prop — no state needed here
    }, 1000);
    const handleVisibility = () => { if (!document.hidden) lastPassiveTick = Date.now(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(passiveInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);


  return (
    <Navbar userProfile={userProfile} />
  );
}