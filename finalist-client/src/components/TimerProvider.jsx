// src/components/TimerProvider.jsx
import React, { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';

// TimerProvider renders ONLY Navbar. Its setState calls never reach Dashboard.
export default function TimerProvider({ userProfile }) {
  const [elapsedTime, setElapsedTime] = useState(
    parseInt(localStorage.getItem('finalist_timer_elapsed')) || 0
  );
  const [isRunning, setIsRunning] = useState(
    localStorage.getItem('finalist_timer_running') === 'true'
  );
  const lastTickRef = useRef(
    parseInt(localStorage.getItem('finalist_last_tick')) || Date.now()
  );
  const intervalRef = useRef(null);

  // Manual stopwatch
  useEffect(() => {
    if (isRunning) {
      lastTickRef.current = Date.now();
      localStorage.setItem('finalist_last_tick', lastTickRef.current);
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;
        localStorage.setItem('finalist_last_tick', now);
        setElapsedTime(prev => {
          const next = prev + delta;
          localStorage.setItem('finalist_timer_elapsed', next);
          return next;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

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

  const toggleTimer = () => {
    if (!isRunning) lastTickRef.current = Date.now();
    const next = !isRunning;
    setIsRunning(next);
    localStorage.setItem('finalist_timer_running', next.toString());
  };

  const resetTimer = () => {
    setIsRunning(false);
    localStorage.setItem('finalist_timer_running', 'false');
    setElapsedTime(0);
    localStorage.setItem('finalist_timer_elapsed', '0');
  };

  return (
    <Navbar
      userProfile={userProfile}
      elapsedTime={elapsedTime}
      isRunning={isRunning}
      toggleTimer={toggleTimer}
      resetTimer={resetTimer}
    />
  );
}