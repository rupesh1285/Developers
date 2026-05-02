import React from 'react';

export default React.memo(function ProgressHeader({ stats, analyticsData }) {
  if (!stats) return null;

  return (
    <>
      <div className="progress-section">
        <div className="progress-left">
          <div className="circular-progress">
            <svg width="120" height="120" viewBox="0 0 120 120" className="circle-svg">
              <defs>
                <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#6ea0ea', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="50" className="circle-bg"></circle>
              <circle cx="60" cy="60" r="50" className="circle-progress" id="total-circle" style={{ strokeDashoffset: stats.circleOffset }}></circle>
            </svg>
            <div className="circle-text">
              <span id="total-solved-count">{stats.solved} / {stats.total}</span>
              <span className="total-label">Solved</span>
            </div>
          </div>
        </div>

        <div className="progress-right">
          <div className="mobile-streak-widget">
            <div className="ms-top">
              <i className="ri-fire-fill streak-icon"></i>
              <div>
                <span className="ms-count">{analyticsData?.streak?.current || 0}</span>
                <span className="ms-label"> Day Streak</span>
              </div>
            </div>
            <div className="ms-dots">
              {[...Array(7)].map((_, i) => <div key={i} className={`ms-dot ${i < (analyticsData?.streak?.current || 0) ? 'active' : ''}`}></div>)}
            </div>
          </div>

          <div className="progress-row"><span className="bar-label">Basic</span><div className="bar-track"><div className="bar-fill basic-bar" style={{ width: `${stats.basic.pct}%` }}></div></div><span className="bar-stat">{stats.basic.solved}/{stats.basic.total}</span></div>
          <div className="progress-row"><span className="bar-label">Easy</span><div className="bar-track"><div className="bar-fill easy-bar" style={{ width: `${stats.easy.pct}%` }}></div></div><span className="bar-stat">{stats.easy.solved}/{stats.easy.total}</span></div>
          <div className="progress-row"><span className="bar-label">Med.</span><div className="bar-track"><div className="bar-fill medium-bar" style={{ width: `${stats.medium.pct}%` }}></div></div><span className="bar-stat">{stats.medium.solved}/{stats.medium.total}</span></div>
          <div className="progress-row"><span className="bar-label">Hard</span><div className="bar-track"><div className="bar-fill hard-bar" style={{ width: `${stats.hard.pct}%` }}></div></div><span className="bar-stat">{stats.hard.solved}/{stats.hard.total}</span></div>
        </div>
      </div>
      <div className="divider"></div>
    </>
  );
});