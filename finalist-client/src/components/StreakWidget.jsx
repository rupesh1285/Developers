import React, { useMemo, useState, useEffect } from 'react';

export default React.memo(function StreakWidget({ data }) {
  // 🌟 PERFORMANCE CUT 1: The timer lives completely inside this micro-component now.
  const [localTime, setLocalTime] = useState(parseInt(localStorage.getItem('finalist_cumulative_time')) || 0);

  useEffect(() => {
    let lastTick = Date.now();
    // Only ticks every 5 seconds to save CPU, and only when the tab is active
    const interval = setInterval(() => {
      if (!document.hidden) {
        const now = Date.now();
        const newCum = (parseInt(localStorage.getItem('finalist_cumulative_time')) || 0) + (now - lastTick);
        localStorage.setItem('finalist_cumulative_time', newCum);
        setLocalTime(newCum);
      }
      lastTick = Date.now();
    }, 5000); 

    return () => clearInterval(interval);
  }, []);

  const weekDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + (today.getDay() === 0 ? -6 : 1 - today.getDay()));
    const getLocalStr = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return Array.from({ length: 7 }).map((_, i) => {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      const isActive = data.heatmap && data.heatmap.some(d => d.date === getLocalStr(currentDay) && d.count > 0);
      return { name: dayNames[i], isActive, isToday: currentDay.toDateString() === today.toDateString() };
    });
  }, [data.heatmap]);

  const timeSpentDisplay = useMemo(() => {
    const backendMs = (data?.streak?.timeSpentHrs || 0) * 3600000;
    const trueCumulative = Math.max(backendMs, localTime);
    return `${Math.floor(trueCumulative / 3600000)} hrs`;
  }, [data?.streak?.timeSpentHrs, localTime]); 

  return (
    <div className="stat-card stat-small" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 'none' }}>
      <div className="streak-main" style={{ flex: 1, paddingRight: '15px', minWidth: 0 }}>
        <div className="streak-top" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ri-fire-fill streak-icon" style={{ fontSize: '26px' }}></i>
          <div className="streak-info" style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="streak-count" style={{ fontSize: '22px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {data?.streak?.current || 0}
            </span>
            <span className="streak-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Day Streak
            </span>
          </div>
        </div>

        <div className="streak-week">
          {weekDays.map(day => (
            <div key={day.name} className="day-tracker" style={{ gap: '4px' }}>
              <div className={`day-circle ${day.isActive ? 'active' : ''}`} style={{ width: '18px', height: '18px', fontSize: '9px' }}>
                <i className="ri-check-line"></i>
              </div>
              <span className={`day-name ${day.isToday ? 'today' : ''}`} style={{ fontSize: '9px' }}>{day.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="streak-secondary" style={{ gap: '8px', paddingLeft: '15px' }}>
        <div className="stat-mini">
          <span className="stat-mini-label" style={{ fontSize: '9px', marginBottom: '1px' }}>Max Streak</span>
          <span className="stat-mini-value" style={{ fontSize: '13px' }}>{data?.streak?.max || 0} Days</span>
        </div>
        <div className="stat-mini">
          <span className="stat-mini-label" style={{ fontSize: '9px', marginBottom: '1px' }}>Time Spent</span>
          <span className="stat-mini-value" style={{ fontSize: '13px' }}>{timeSpentDisplay}</span>
        </div>
      </div>
    </div>
  );
});