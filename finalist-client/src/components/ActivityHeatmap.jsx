import React, { useMemo } from 'react';

export default React.memo(function ActivityHeatmap({ data }) {
  
  // 🌟 PERFORMANCE CUT 2: Cache the 112 heavy DOM nodes
  const squares = useMemo(() => {
    return (data?.heatmap || []).map((day, idx) => {
      const dateObj = new Date(day.date);
      const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return (
        <div
          key={idx}
          className={`heatmap-square heat-${day.level}`}
          data-tooltip={day.count === 0 ? `No activity on ${dateString}` : `${day.count} problems solved on ${dateString}`}
          role="img"
          aria-label={day.count === 0 ? `No activity on ${dateString}` : `${day.count} problems solved on ${dateString}`}
        ></div>
      );
    });
  }, [data?.heatmap]);

  return (
    <div className="stat-card" style={{ flexDirection: 'column', padding: '20px', alignItems: 'flex-start', justifyContent: 'flex-start', display: 'flex', overflow: 'visible', flex: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '15px', flexShrink: 0 }}>
        <span className="section-label" style={{ marginBottom: 0 }}>Activity Log</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last 16 Weeks</span>
      </div>

      <div className="heatmap-container" id="activity-heatmap" style={{ width: '100%', height: 'auto' }}>
        {squares}
      </div>
    </div>
  );
});