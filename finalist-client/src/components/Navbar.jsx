import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ userProfile, elapsedTime, isRunning, toggleTimer, resetTimer }) {
  const navigate = useNavigate();
  
  // 🌟 STATE ISOLATION: The dropdown state now lives here!
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // 🌟 CLICK OUTSIDE: Only handles the Navbar now
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (ms) => {
    let h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const getAvatarSrc = (profile) => {
    if (profile.avatar && profile.avatar.length > 5) return profile.avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1a1d27&color=6ea0ea&bold=true&font-size=0.4`;
  };

  return (
    <nav className="navbar">
      <div className="brand-logo">
        <svg className="brand-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M25 20 L75 20 L75 35 L45 35 L45 45 L65 45 L65 60 L45 60 L45 80 L25 80 Z" fill="url(#brand-glow)" />
          <defs>
            <linearGradient id="brand-glow" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#6ea0ea" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        <span className="brand-text">FINALIST</span>
      </div>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="nav-timer" id="nav-timer">
          <button className="timer-btn" id="watch-toggle" onClick={toggleTimer} title="Start/Pause">
            <i className={isRunning ? "ri-pause-fill" : "ri-play-fill"}></i>
          </button>
          <div className="timer-display" id="watch-display">{formatTime(elapsedTime)}</div>
          <button className="timer-btn reset" id="watch-reset" onClick={resetTimer} title="Reset">
            <i className="ri-refresh-line"></i>
          </button>
        </div>

        <div className="profile-container" style={{ position: 'relative' }} ref={profileRef}>
          <div id="profile-btn" className={profileOpen ? "active" : ""} onClick={() => setProfileOpen(!profileOpen)}>
            <div className="profile-avatar" id="nav-avatar-container">
              <img
                src={getAvatarSrc(userProfile)}
                id="nav-avatar-img"
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            </div>
            <span className="profile-name">{userProfile.name}</span>
            <i className="ri-arrow-down-s-line chevron"></i>
          </div>
          <div id="profile-menu" className={profileOpen ? "active" : ""}>
            <div className="profile-info">
              <strong>{userProfile.name}</strong>
              <span>{userProfile.email}</span>
            </div>
            <div id="logout-btn" className="menu-item danger" onClick={() => { localStorage.clear(); navigate('/signin'); }}>
              <i className="ri-logout-box-r-line"></i><span>Sign Out</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}