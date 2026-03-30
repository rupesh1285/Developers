import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();

  // --- REAL DATABASE STATE ---
  const [problemsData, setProblemsData] = useState([]);
  const [solvedIds, setSolvedIds] = useState([]);
  const [starredIds, setStarredIds] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({ streak: { current: 0, max: 0, timeSpentHrs: 0 }, heatmap: [], topics: [] });
  const [userProfile, setUserProfile] = useState({ name: 'Developer', email: 'developer@finalist.com', avatar: '' });

  // --- UI STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // --- FILTER & SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [diffFilter, setDiffFilter] = useState(localStorage.getItem("finalist_diff") || 'Difficulty');
  const [statusFilter, setStatusFilter] = useState(localStorage.getItem("finalist_status") || 'All Problems');
  const [selectedTags, setSelectedTags] = useState(JSON.parse(localStorage.getItem("finalist_tags") || "[]"));

  const [diffOpen, setDiffOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [topicMenuOpen, setTopicMenuOpen] = useState(false);
  const [topicSearch, setTopicSearch] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false); // 🌟 SPRINT 1: Mobile Filter State
  const topicMenuRef = useRef(null);

  const [activeProblemId, setActiveProblemId] = useState(localStorage.getItem("finalist_active_problem") || null);

  // --- ANALYTICS & DRAGGER STATE ---
  const [analyticsWidth, setAnalyticsWidth] = useState(parseInt(localStorage.getItem('finalist_analytics_width')) || 320);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(localStorage.getItem('finalist_analytics_state') !== 'hidden');
  const isDraggingRef = useRef(false);
  const [isDraggingUI, setIsDraggingUI] = useState(false); // 🌟 FIX 5: UI state for smooth drag
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // --- STOPWATCH STATE ---
  const [elapsedTime, setElapsedTime] = useState(parseInt(localStorage.getItem('finalist_timer_elapsed')) || 0);
  const [isRunning, setIsRunning] = useState(localStorage.getItem('finalist_timer_running') === 'true');
  const lastTickRef = useRef(parseInt(localStorage.getItem('finalist_last_tick')) || Date.now());
  const intervalRef = useRef(null);

  // --- SEARCH BAR TYPING EFFECT STATE ---
  const searchInputRef = useRef(null);

  // =========================================================================
  // 1. ENGINE: SEARCH BAR TYPING EFFECT
  // =========================================================================
  useEffect(() => {
    const typeTexts = ["Search 'Two Sum'", "Search 'Trapping Rain Water'", "Search 'LRU Cache'", "Search 'Valid Palindrome'", "Search 'Merge K Sorted Lists'"];
    let tIndex = 0, cIndex = 0, isDeleting = false, cursorBlink = true;
    let typeTimeout, blinkInterval;

    function typeEffect() {
      if (!searchInputRef.current) return;
      if (document.activeElement === searchInputRef.current) {
        searchInputRef.current.placeholder = "";
        typeTimeout = setTimeout(typeEffect, 500);
        return;
      }
      const current = typeTexts[tIndex];
      if (isDeleting) cIndex--; else cIndex++;
      let displayText = current.substring(0, cIndex);
      searchInputRef.current.placeholder = displayText + (cursorBlink ? "|" : "");
      let typeSpeed = isDeleting ? 30 : 60;
      if (!isDeleting && cIndex === current.length) { typeSpeed = 2000; isDeleting = true; }
      else if (isDeleting && cIndex === 0) { isDeleting = false; tIndex = (tIndex + 1) % typeTexts.length; typeSpeed = 500; }
      typeTimeout = setTimeout(typeEffect, typeSpeed);
    }

    typeTimeout = setTimeout(typeEffect, 1000);
    blinkInterval = setInterval(() => {
      if (document.activeElement !== searchInputRef.current && searchInputRef.current) {
        cursorBlink = !cursorBlink;
        if (cIndex === typeTexts[tIndex].length || cIndex === 0) {
          let displayText = typeTexts[tIndex].substring(0, cIndex);
          searchInputRef.current.placeholder = displayText + (cursorBlink ? "|" : "");
        }
      }
    }, 450);

    return () => { clearTimeout(typeTimeout); clearInterval(blinkInterval); };
  }, []);

  // =========================================================================
  // 2. ENGINE: NATIVE GLOBAL TOOLTIP PHYSICS
  // =========================================================================
  useEffect(() => {
    const globalTooltip = document.createElement('div');
    globalTooltip.className = 'global-tooltip';
    document.body.appendChild(globalTooltip);

    const handleMouseOver = (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        globalTooltip.textContent = target.getAttribute('data-tooltip');
        globalTooltip.classList.add('active');
      }
    };
    const handleMouseMove = (e) => {
      if (!globalTooltip.classList.contains('active')) return;
      let x = e.clientX, y = e.clientY - 15;
      const rect = globalTooltip.getBoundingClientRect();
      if (x + (rect.width / 2) > window.innerWidth - 15) x = window.innerWidth - (rect.width / 2) - 15;
      if (x - (rect.width / 2) < 15) x = (rect.width / 2) + 15;
      if (y - rect.height < 10) { y = e.clientY + 25; globalTooltip.style.transform = `translate(-50%, 0)`; }
      else { globalTooltip.style.transform = `translate(-50%, -100%)`; }
      globalTooltip.style.left = `${x}px`;
      globalTooltip.style.top = `${y}px`;
    };
    const handleMouseOut = (e) => {
      if (e.target.closest('[data-tooltip]')) globalTooltip.classList.remove('active');
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseout', handleMouseOut);
      if (document.body.contains(globalTooltip)) document.body.removeChild(globalTooltip);
    };
  }, []);

  // =========================================================================
  // 3. ENGINE: MOUSE GLOW & OAUTH
  // =========================================================================
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) { localStorage.setItem('token', urlToken); navigate('/problems', { replace: true }); }
  }, [navigate]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // =========================================================================
  // 3b. ENGINE: CLICK OUTSIDE HANDLER
  // =========================================================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (!e.target.closest('.filter-pill')) { setDiffOpen(false); setStatusOpen(false); }
      if (topicMenuRef.current && !topicMenuRef.current.contains(e.target) && !e.target.closest('#topic-btn')) setTopicMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // =========================================================================
  // 3c. ENGINE: DATA FETCHING
  // =========================================================================
  useEffect(() => {
    const token = localStorage.getItem('token');
    async function fetchDashboardData() {
      try {
        const [resProblems, resProgress, resProfile, resAnalytics] = await Promise.all([
          fetch("/api/problems", { headers: { "Authorization": "Bearer " + token } }),
          fetch("/api/progress", { headers: { "Authorization": "Bearer " + token } }),
          fetch("/api/auth/profile", { headers: { "Authorization": "Bearer " + token } }),
          fetch("/api/progress/analytics", { headers: { "Authorization": "Bearer " + token } })
        ]);

        if (resProblems.ok) setProblemsData(await resProblems.json());

        if (resProgress.ok) {
          const progress = await resProgress.json();
          // 🌟 FIX: Removed the second .json() call that was crashing the app!
          setSolvedIds(progress.filter(p => p.solved).map(p => typeof p.problem === 'object' ? String(p.problem._id) : String(p.problem)));
          setStarredIds(progress.filter(p => p.starred).map(p => typeof p.problem === 'object' ? String(p.problem._id) : String(p.problem)));
        }

        if (resProfile.ok) setUserProfile(await resProfile.json());
        if (resAnalytics.ok) setAnalyticsData(await resAnalytics.json());

        setTimeout(() => setIsLoading(false), 300);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, [navigate]);

  // =========================================================================
  // 4. ENGINE: STOPWATCH
  // =========================================================================
  const formatTime = (ms) => {
    let h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  useEffect(() => {
    if (isRunning) {
      const now = Date.now();
      const missed = now - lastTickRef.current;
      if (missed > 0 && missed < 86400000) {
        setElapsedTime(prev => prev + missed);
        const cum = parseInt(localStorage.getItem('finalist_cumulative_time')) || 0;
        localStorage.setItem('finalist_cumulative_time', cum + missed);
      }
      lastTickRef.current = Date.now();
      localStorage.setItem('finalist_last_tick', lastTickRef.current);

      intervalRef.current = setInterval(() => {
        const currentNow = Date.now();
        const delta = currentNow - lastTickRef.current;
        lastTickRef.current = currentNow;
        localStorage.setItem('finalist_last_tick', currentNow);

        // 🌟 FIX: Update global cumulative time every second
        const cum = parseInt(localStorage.getItem('finalist_cumulative_time')) || 0;
        localStorage.setItem('finalist_cumulative_time', cum + delta);

        setElapsedTime(prev => {
          const newTime = prev + delta;
          localStorage.setItem('finalist_timer_elapsed', newTime);
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const toggleTimer = () => { if (!isRunning) lastTickRef.current = Date.now(); setIsRunning(!isRunning); localStorage.setItem('finalist_timer_running', (!isRunning).toString()); };
  const resetTimer = () => { setIsRunning(false); localStorage.setItem('finalist_timer_running', 'false'); setElapsedTime(0); localStorage.setItem('finalist_timer_elapsed', 0); };

  // =========================================================================
  // 5. ENGINE: INTERACTION & DRAGGER
  // =========================================================================
  const handleToggleSolved = async (e, id) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    const isCurrentlySolved = solvedIds.includes(String(id));
    setSolvedIds(prev => isCurrentlySolved ? prev.filter(i => i !== String(id)) : [...prev, String(id)]);
    try {
      await fetch(`/api/progress/toggle-solved/${id}`, { method: "POST", headers: { "Authorization": "Bearer " + token } });
      const resAnalytics = await fetch("/api/progress/analytics", { headers: { "Authorization": "Bearer " + token } });
      if (resAnalytics.ok) setAnalyticsData(await resAnalytics.json());
    } catch (err) { setSolvedIds(prev => isCurrentlySolved ? [...prev, String(id)] : prev.filter(i => i !== String(id))); }
  };

  const handleToggleStar = async (e, id) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    const isCurrentlyStarred = starredIds.includes(String(id));
    setStarredIds(prev => isCurrentlyStarred ? prev.filter(i => i !== String(id)) : [...prev, String(id)]);
    try { await fetch(`/api/progress/toggle-star/${id}`, { method: "POST", headers: { "Authorization": "Bearer " + token } }); } catch (err) { }
  };

  const handleDragStart = (e) => {
    if (e.target.closest('#panel-fold-btn')) return;
    isDraggingRef.current = true;
    setIsDraggingUI(true); // 🌟 FIX 5
    startXRef.current = e.clientX;
    startWidthRef.current = analyticsWidth;
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      let rawWidth = startWidthRef.current - (e.clientX - startXRef.current);
      if (!activeProblemId) {
        rawWidth = Math.max(320, Math.min(500, rawWidth));
        setAnalyticsWidth(rawWidth);
      } else {
        if (rawWidth >= 320) { setAnalyticsWidth(rawWidth); }
        else if (rawWidth > 270) { setAnalyticsWidth(320 - ((320 - rawWidth) * 0.4)); }
        else { collapseAnalytics(); }
      }
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDraggingUI(false); // 🌟 FIX 5
        document.body.style.cursor = 'default'; document.body.style.userSelect = 'auto';
        setAnalyticsWidth(prev => {
          const snapped = prev < 320 ? 320 : prev;
          localStorage.setItem('finalist_analytics_width', snapped);
          return snapped;
        });
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [analyticsWidth, activeProblemId]);

  const collapseAnalytics = () => {
    isDraggingRef.current = false;
    document.body.style.cursor = 'default'; document.body.style.userSelect = 'auto';
    setIsAnalyticsOpen(false);
    localStorage.setItem('finalist_analytics_state', 'hidden');
  };

  const toggleAnalytics = (e) => {
    e.stopPropagation();
    const newState = !isAnalyticsOpen;
    setIsAnalyticsOpen(newState);
    localStorage.setItem('finalist_analytics_state', newState ? 'visible' : 'hidden');
  };

  // 🌟 ORIGINAL RULE: When closing a problem, force analytics back open
  const handleProblemClick = (id) => {
    if (activeProblemId === id) {
      // Closing problem
      setActiveProblemId(null);
      localStorage.removeItem("finalist_active_problem");
      // Force analytics to reopen
      if (!isAnalyticsOpen) {
        setIsAnalyticsOpen(true);
        localStorage.setItem('finalist_analytics_state', 'visible');
      }
    } else {
      setActiveProblemId(id);
      localStorage.setItem("finalist_active_problem", id);
    }
  };

  // =========================================================================
  // 6. ENGINE: TOPIC FILTER & STATS CALCULATION
  // =========================================================================
  const allTags = useMemo(() => {
    const tags = new Set();
    problemsData.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [problemsData]);

  const availableTags = allTags.filter(t => !selectedTags.includes(t) && t.toLowerCase().includes(topicSearch.toLowerCase()));

  const handleTagToggle = useCallback((tag) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      localStorage.setItem("finalist_tags", JSON.stringify(newTags));
      return newTags;
    });
  }, []);

  const stats = useMemo(() => {
    const total = problemsData.length, solved = solvedIds.length;
    const getLevelStats = (level) => {
      const levelTotal = problemsData.filter(p => p.difficulty === level).length;
      const levelSolved = problemsData.filter(p => p.difficulty === level && solvedIds.includes(String(p._id))).length;
      return { total: levelTotal, solved: levelSolved, pct: levelTotal === 0 ? 0 : (levelSolved / levelTotal) * 100 };
    };
    return {
      total, solved, circleOffset: 314 - ((total === 0 ? 0 : solved / total) * 314),
      basic: getLevelStats('Basic'), easy: getLevelStats('Easy'), medium: getLevelStats('Medium'), hard: getLevelStats('Hard')
    };
  }, [problemsData, solvedIds]);

  const filteredProblems = useMemo(() => {
    return problemsData.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDiff = diffFilter === 'Difficulty' || p.difficulty === diffFilter;
      let matchesStatus = true;
      if (statusFilter === 'Solved') matchesStatus = solvedIds.includes(String(p._id));
      if (statusFilter === 'Unsolved') matchesStatus = !solvedIds.includes(String(p._id));
      if (statusFilter === 'Starred') matchesStatus = starredIds.includes(String(p._id));
      const matchesTags = selectedTags.length === 0 || (p.tags && p.tags.some(t => selectedTags.includes(t)));
      return matchesSearch && matchesDiff && matchesStatus && matchesTags;
    });
  }, [problemsData, searchQuery, diffFilter, statusFilter, solvedIds, starredIds, selectedTags]);

  // Avatar URL helper (matches original ui-avatars fallback)
  const getAvatarSrc = (profile) => {
    if (profile.avatar && profile.avatar.length > 5) return profile.avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1a1d27&color=6ea0ea&bold=true&font-size=0.4`;
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  // 🌟 FIX: Fold button shows ONLY when a problem is open OR analytics is collapsed (not both closed)
  const showFoldBtn = !!activeProblemId || !isAnalyticsOpen;

  return (
    <>
      <div className="bg-glow"></div>

      {/* 🌟 RESTORED: Runes background container */}
      <div className="runes-container" id="runes-container"></div>

      <div id="global-preloader" className={!isLoading ? "hidden" : ""}>
        <div className="loader-content">
          <svg className="loader-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25 20 L75 20 L75 35 L45 35 L45 45 L65 45 L65 60 L45 60 L45 80 L25 80 Z" fill="url(#loader-glow)" />
            <defs>
              <linearGradient id="loader-glow" x1="0" y1="0" x2="100" y2="100">
                <stop offset="0%" stopColor="#6ea0ea" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="loading-bar-container"><div className="loading-bar"></div></div>
          <div className="loading-text">INITIALIZING WORKSPACE...</div>
        </div>
      </div>

      <nav className="navbar">
        <div className="brand-logo">
          {/* 🌟 FIX: Added brand-glow gradient <defs> that was missing from the React version */}
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

      <div className="dashboard">
<div className={`middle-panel ${!activeProblemId ? 'expanded' : 'mobile-hidden'}`}>
          
          {/* 🌟 DESKTOP PROGRESS SECTION (Hidden on Mobile) */}
          <div className="progress-section desktop-only">
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
              <div className="progress-row"><span className="bar-label">Basic</span><div className="bar-track"><div className="bar-fill basic-bar" style={{ width: `${stats.basic.pct}%` }}></div></div><span className="bar-stat">{stats.basic.solved}/{stats.basic.total}</span></div>
              <div className="progress-row"><span className="bar-label">Easy</span><div className="bar-track"><div className="bar-fill easy-bar" style={{ width: `${stats.easy.pct}%` }}></div></div><span className="bar-stat">{stats.easy.solved}/{stats.easy.total}</span></div>
              <div className="progress-row"><span className="bar-label">Med.</span><div className="bar-track"><div className="bar-fill medium-bar" style={{ width: `${stats.medium.pct}%` }}></div></div><span className="bar-stat">{stats.medium.solved}/{stats.medium.total}</span></div>
              <div className="progress-row"><span className="bar-label">Hard</span><div className="bar-track"><div className="bar-fill hard-bar" style={{ width: `${stats.hard.pct}%` }}></div></div><span className="bar-stat">{stats.hard.solved}/{stats.hard.total}</span></div>
            </div>
          </div>

          {/* 🌟 BLANK MOBILE CANVAS (Hidden on Desktop) */}
          <div className="progress-section mobile-only" style={{ minHeight: '150px', border: '2px dashed #f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <span style={{ color: '#f87171', fontSize: '14px', fontWeight: 'bold' }}>MOBILE CANVAS EMPTY</span>
          </div>

          <div className="divider"></div>

          {/* 🌟 SPRINT 1: SIDE-BY-SIDE SEARCH & FILTER */}
          <div className="filters-section">
            <div className="search-wrapper">
              <i className="ri-search-line search-icon"></i>
              <input type="text" id="search-input" ref={searchInputRef} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoComplete="off" placeholder="Search..." />
            </div>

            <button className={`mobile-filter-btn ${mobileFiltersOpen ? 'active' : ''}`} onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}>
              <i className="ri-equalizer-line"></i>
            </button>

            {/* Filter Dropdowns (Hidden on mobile unless button clicked) */}
            <div className={`filters-actions ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
              <div className={`filter-pill ${diffOpen ? 'active' : ''}`} id="diff-dropdown" onClick={() => { setDiffOpen(!diffOpen); setStatusOpen(false); setTopicMenuOpen(false); }}>
                <span className="filter-text">{diffFilter}</span><i className="ri-arrow-down-s-line chevron-icon"></i>
                <div className="dropdown-menu">
                  {['Difficulty', 'Basic', 'Easy', 'Medium', 'Hard'].map(diff => (
                    <div key={diff} className="dropdown-item" onClick={(e) => { e.stopPropagation(); setDiffFilter(diff); localStorage.setItem("finalist_diff", diff); setDiffOpen(false); }}>{diff}</div>
                  ))}
                </div>
              </div>
              <div className={`filter-pill ${statusOpen ? 'active' : ''}`} id="status-dropdown" onClick={() => { setStatusOpen(!statusOpen); setDiffOpen(false); setTopicMenuOpen(false); }}>
                <span className="filter-text">{statusFilter}</span><i className="ri-arrow-down-s-line chevron-icon"></i>
                <div className="dropdown-menu">
                  {['All Problems', 'Solved', 'Unsolved', 'Starred'].map(status => (
                    <div key={status} className="dropdown-item" onClick={(e) => { e.stopPropagation(); setStatusFilter(status); localStorage.setItem("finalist_status", status); setStatusOpen(false); }}>{status}</div>
                  ))}
                </div>
              </div>

              <div className="filter-pill-wrapper" style={{ position: 'relative' }} ref={topicMenuRef}>
                <div className={`icon-btn filter-trigger ${selectedTags.length > 0 || topicMenuOpen ? 'active-filter' : ''}`} id="topic-btn" title="Topic Filter" onClick={() => { setTopicMenuOpen(!topicMenuOpen); setDiffOpen(false); setStatusOpen(false); }}>
                  <i className="ri-filter-3-line"></i>
                  <div className="filter-badge" style={{ display: selectedTags.length > 0 ? 'flex' : 'none' }}>{selectedTags.length}</div>
                </div>
                <div className={`topic-menu ${topicMenuOpen ? 'active' : ''}`} id="topic-menu">
                  <div className="topic-header">
                    <div className="topic-search-box"><i className="ri-search-line"></i><input type="text" placeholder="Search tags..." value={topicSearch} onClick={e => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); setTopicSearch(e.target.value); }} /></div>
                    {selectedTags.length > 0 && <span className="clear-all-btn" onClick={() => { setSelectedTags([]); localStorage.setItem("finalist_tags", "[]"); setTopicSearch(""); }}>Clear</span>}
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="topics-container" style={{ display: 'flex' }}>
                      {selectedTags.map(tag => (<div key={tag} className="topic-pill-item selected" onClick={(e) => { e.stopPropagation(); handleTagToggle(tag); }}>{tag} <i className="ri-close-line"></i></div>))}
                    </div>
                  )}
                  {selectedTags.length > 0 && <div className="topic-divider" style={{ display: 'block' }}></div>}
                  <div className="topics-container">
                    {availableTags.map(tag => (<div key={tag} className="topic-pill-item" onClick={(e) => { e.stopPropagation(); handleTagToggle(tag); setTopicSearch(""); }}>{tag}</div>))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PROBLEMS LIST */}
          <div className="problems-panel" id="problems-panel">
            {filteredProblems.map(problem => {
              const isSolved = solvedIds.includes(String(problem._id));
              const isStarred = starredIds.includes(String(problem._id));
              return (
                <div
                  key={problem._id}
                  className={`problem-strip ${activeProblemId === String(problem._id) ? 'active-problem' : ''}`}
                  data-id={problem._id}
                  onClick={() => handleProblemClick(String(problem._id))}
                >
                  <div className="problem-left">
                    <span className="problem-number">{problem.problemNumber}.</span>
                    <span className="problem-title">{problem.title}</span>
                  </div>
                  <div className="problem-right">
                    {/* 🌟 FIX: Added 'checked' class to match original CSS */}
                    <i
                      className={`${isSolved ? 'ri-checkbox-circle-fill checked' : 'ri-checkbox-blank-circle-line'} checkbox-icon`}
                      style={{ color: isSolved ? '#4ade80' : 'var(--text-muted)' }}
                      onClick={(e) => handleToggleSolved(e, String(problem._id))}
                    ></i>
                    <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
                    <i
                      className={`${isStarred ? 'ri-star-fill active' : 'ri-star-line'} star-icon`}
                      onClick={(e) => handleToggleStar(e, String(problem._id))}
                    ></i>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT WORKSPACE PANEL */}
        <div className={`right-panel ${!activeProblemId ? 'collapsed' : ''}`} id="right-panel">
          {activeProblemId && (
            <WorkspacePanel
              problem={problemsData.find(p => String(p._id) === activeProblemId)}
              isStarred={starredIds.includes(activeProblemId)}
              onToggleStar={handleToggleStar}
              onClose={() => handleProblemClick(activeProblemId)} // 🌟 SPRINT 1: Close Trigger
            />
          )}
        </div>

        {/* VERTICAL DIVIDER */}
        <div className={`vertical-divider ${!isAnalyticsOpen ? 'collapsed' : ''}`} id="vertical-divider" onMouseDown={handleDragStart}>
          {/* 🌟 FIX: Fold button shows when workspace open OR when analytics is collapsed — matches original logic exactly */}
          <button
            className="panel-fold-btn"
            id="panel-fold-btn"
            data-tooltip={isAnalyticsOpen ? "Fold" : "Unfold"}
            style={{ display: showFoldBtn ? 'flex' : 'none' }}
            onClick={toggleAnalytics}
          >
            <i className="ri-arrow-right-double-line"></i>
          </button>
        </div>

        {/* STATS / ANALYTICS PANEL */}
        {/* STATS / ANALYTICS PANEL */}
        <div
          className={`stats-panel ${!isAnalyticsOpen ? 'hidden' : 'snap-back'} ${isDraggingUI ? 'dragging' : ''}`}
          id="stats-panel"
          style={{ width: isAnalyticsOpen ? `${analyticsWidth}px` : undefined, opacity: isAnalyticsOpen ? 1 : undefined }}
        >
          {/* 🌟 FIX: Passed liveTimer to trigger hour updates */}
          <AnalyticsPanel data={analyticsData} onBubbleClick={handleTagToggle} panelWidth={analyticsWidth} liveTimer={elapsedTime} />
        </div>
      </div>
    </>
  );
}

// =========================================================================
// SUB-COMPONENT: WORKSPACE PANEL
// =========================================================================
function WorkspacePanel({ problem, isStarred, onToggleStar, onClose }) {
  const [activeTab, setActiveTab] = useState(localStorage.getItem("finalist_active_tab") || 'tab-desc');
  // 🌟 FIX: Full language map matching the original (javascript, python, C, C++, Java)
  const [language, setLanguage] = useState(localStorage.getItem(`finalist_lang_${problem?._id}`) || 'javascript');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const editorRef = useRef(null);
  const cmInstanceRef = useRef(null);
  const codeCacheRef = useRef({}); // 🌟 FIX: Per-language code cache (JSON object, exactly like original)
  const aiHistoryRef = useRef(null);
  const aiInputRef = useRef(null);

  // 🌟 Full language map matching the original exactly
  const LANG_MAP = {
    "javascript": "JavaScript",
    "python": "Python",
    "text/x-csrc": "C",
    "text/x-c++src": "C++",
    "text/x-java": "Java"
  };

  const BOILERPLATES = {
    "javascript": `// Write logic for ${problem?.title}\nfunction solve() {\n    \n}`,
    "python": `# Write logic for ${problem?.title}\ndef solve():\n    pass\n`,
    "text/x-csrc": `// Write logic for ${problem?.title}\n#include <stdio.h>\nvoid solve() {\n    \n}\nint main() {solve(); return 0; }`,
    "text/x-c++src": `// Write logic for ${problem?.title}\n#include <iostream>\nusing namespace std;\nvoid solve() {\n    \n}\nint main() {solve(); return 0; }`,
    "text/x-java": `// Write logic for ${problem?.title}\nclass Solution {\n    public void solve() {\n        \n    }\n}`
  };

  // Load saved code + chat on problem mount
  useEffect(() => {
    if (!problem) return;

    // Load chat from localStorage first
    const savedChat = JSON.parse(localStorage.getItem(`finalist_ai_${problem._id}`) || '[]');
    setChatHistory(savedChat);

    // Load code cache from localStorage + cloud
    const token = localStorage.getItem('token');
    async function loadWorkspace() {
      let savedCode = null;
      let cloudChat = [];
      try {
        const res = await fetch(`/api/workspace/${problem._id}`, { headers: { "Authorization": "Bearer " + token } });
        if (res.ok) {
          const data = await res.json();
          savedCode = data.code || localStorage.getItem(`finalist_code_${problem._id}`);
          cloudChat = (data.chat && data.chat.length > 0) ? data.chat : savedChat;
          if (cloudChat.length > 0) setChatHistory(cloudChat);
        }
      } catch (e) {
        savedCode = localStorage.getItem(`finalist_code_${problem._id}`);
      }

      // Parse code cache
      let cache = {};
      try {
        cache = JSON.parse(savedCode || '{}');
        if (typeof cache !== 'object' || !cache) cache = { "javascript": savedCode };
      } catch (e) { cache = { "javascript": savedCode }; }
      codeCacheRef.current = cache;
    }
    loadWorkspace();
  }, [problem]);

  // Initialize / reinitialize CodeMirror when switching to Code tab or changing language
  useEffect(() => {
    if (activeTab !== 'tab-notes' || !editorRef.current) return;

    if (!window.CodeMirror) return;

    // Destroy old instance
    if (cmInstanceRef.current) {
      cmInstanceRef.current.toTextArea();
      cmInstanceRef.current = null;
    }

    const token = localStorage.getItem('token');
    const savedLang = language;

    cmInstanceRef.current = window.CodeMirror.fromTextArea(editorRef.current, {
      mode: savedLang,
      theme: "dracula",
      lineNumbers: true,
      autoCloseBrackets: true,
      indentUnit: 4
    });

    const initialCode = codeCacheRef.current[savedLang] || BOILERPLATES[savedLang] || BOILERPLATES["javascript"];
    cmInstanceRef.current.setValue(initialCode);
    cmInstanceRef.current.clearHistory();

    // 🌟 FIX: Debounced cloud save + local save using per-language code cache
    let saveTimeout;
    cmInstanceRef.current.on("change", () => {
      const currentLang = language;
      codeCacheRef.current[currentLang] = cmInstanceRef.current.getValue();
      const jsonCache = JSON.stringify(codeCacheRef.current);
      localStorage.setItem(`finalist_code_${problem?._id}`, jsonCache);

      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        try {
          await fetch(`/api/workspace/code/${problem?._id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ code: jsonCache })
          });
        } catch (e) { }
      }, 1500);
    });

    return () => {
      if (cmInstanceRef.current) {
        try { cmInstanceRef.current.toTextArea(); } catch (e) { }
        cmInstanceRef.current = null;
      }
    };
  }, [activeTab, language, problem]);

  // Refresh CodeMirror when switching back to Code tab
  useEffect(() => {
    if (activeTab === 'tab-notes' && cmInstanceRef.current) {
      setTimeout(() => { if (cmInstanceRef.current) cmInstanceRef.current.refresh(); }, 50);
    }
  }, [activeTab]);

  // Auto-scroll AI chat
  useEffect(() => {
    if (aiHistoryRef.current) aiHistoryRef.current.scrollTop = aiHistoryRef.current.scrollHeight;
  }, [chatHistory, isAiThinking]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("finalist_active_tab", tab);
  };

  const handleLangChange = (newLang) => {
    if (!cmInstanceRef.current) return;
    // Save current code into cache before switching
    codeCacheRef.current[language] = cmInstanceRef.current.getValue();
    localStorage.setItem(`finalist_code_${problem?._id}`, JSON.stringify(codeCacheRef.current));

    setLanguage(newLang);
    localStorage.setItem(`finalist_lang_${problem?._id}`, newLang);
    setLangMenuOpen(false);
    // The useEffect on [activeTab, language] will reinitialize CodeMirror with the new lang + code cache
  };

  // 🌟 FIX: Real AI send — calls /api/ai/ask with typing animation, exactly like original
  const handleAiSend = async (e) => {
    e?.preventDefault();
    const text = aiInput.trim();
    if (!text || isAiThinking) return;

    const token = localStorage.getItem('token');
    const newChat = [...chatHistory, { role: 'user', content: text }];
    setChatHistory(newChat);
    setAiInput('');
    setIsAiThinking(true);

    try {
      const aiRes = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          message: text,
          code: cmInstanceRef.current ? cmInstanceRef.current.getValue() : '',
          problemTitle: problem.title,
          chatHistory: newChat.slice(0, -1)
        })
      });
      const aiData = await aiRes.json();
      const fullReply = aiData.reply || aiData.error || "I encountered an error analyzing that.";

      setIsAiThinking(false);

      // 🌟 FIX: Typing animation via state updates
      const finalChat = [...newChat, { role: 'bot', content: '' }];
      setChatHistory(finalChat);

      let charIndex = 0;
      const typeInterval = setInterval(() => {
        charIndex += 2;
        if (charIndex >= fullReply.length) {
          clearInterval(typeInterval);
          const completedChat = [...newChat, { role: 'bot', content: fullReply }];
          setChatHistory(completedChat);
          localStorage.setItem(`finalist_ai_${problem._id}`, JSON.stringify(completedChat));
          // Cloud save chat
          fetch(`/api/workspace/chat/${problem._id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ chat: completedChat })
          }).catch(() => { });
        } else {
          setChatHistory(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'bot', content: fullReply.substring(0, charIndex) };
            return updated;
          });
        }
      }, 20);

    } catch (e) {
      setIsAiThinking(false);
      const errorChat = [...newChat, { role: 'bot', content: "Connection to AI core lost." }];
      setChatHistory(errorChat);
    }
  };

  const wipeMemory = async () => {
    const token = localStorage.getItem('token');
    setChatHistory([]);
    localStorage.removeItem(`finalist_ai_${problem._id}`);
    setShowClearConfirm(false);
    try {
      await fetch(`/api/workspace/chat/${problem._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ chat: [] })
      });
    } catch (e) { }
  };

  if (!problem) return null;

  const isSt = isStarred;

  return (
    <div className="workspace-content">

      <div className="mobile-close-btn" onClick={onClose}>
        <i className="ri-close-large-line"></i>
      </div>
      {/* 🌟 FIX: Panel header with STAR BUTTON restored */}
      <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div className="panel-title" style={{ fontSize: '24px', lineHeight: '1.3', fontWeight: 800, color: '#fff' }}>{problem.title}</div>
        <div className="panel-actions" style={{ marginTop: '4px', flexShrink: 0 }}>
          <div className={`panel-difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</div>
          <div className="panel-star" id="panel-star-btn" data-id={problem._id} onClick={(e) => onToggleStar(e, String(problem._id))}>
            <i className={isSt ? 'ri-star-fill' : 'ri-star-line'}></i>
          </div>
        </div>
      </div>

      {/* TAB NAV */}
      <div className="tab-nav">
        <button className={`tab-btn ${activeTab === 'tab-desc' ? 'active' : ''}`} data-target="tab-desc" onClick={() => handleTabSwitch('tab-desc')}>
          <i className="ri-book-read-line"></i> Description
        </button>
        <button className={`tab-btn ${activeTab === 'tab-notes' ? 'active' : ''}`} data-target="tab-notes" onClick={() => handleTabSwitch('tab-notes')}>
          <i className="ri-code-box-line"></i> Code
        </button>
        <button className={`tab-btn ${activeTab === 'tab-ai' ? 'active' : ''}`} data-target="tab-ai" onClick={() => handleTabSwitch('tab-ai')}>
          <i className="ri-sparkling-fill"></i> AI Assistant
        </button>
      </div>

      {/* DESCRIPTION TAB */}
      <div className={`tab-pane ${activeTab === 'tab-desc' ? 'active' : ''}`} id="tab-desc">
        <div className="details-block">
          <p className="details-text" dangerouslySetInnerHTML={{ __html: (problem.description || '').replace(/\n/g, '<br/>') }}></p>
        </div>

        {problem.examples && problem.examples.length > 0 && (
          <div className="details-block">
            <span className="section-label">Examples</span>
            {problem.examples.map((ex, idx) => (
              <div key={idx} className="example-block">
                <div className="example-title">Example {idx + 1}:</div>
                <div className="example-box">
                  <div className="ex-row"><span className="ex-label">Input:</span><span className="ex-value">{ex.input ? ex.input.trim() : ''}</span></div>
                  <div className="ex-row"><span className="ex-label">Output:</span><span className="ex-value">{ex.output ? ex.output.trim() : ''}</span></div>
                  {ex.explanation && <div className="ex-row"><span className="ex-label">Explanation:</span><span className="ex-value">{ex.explanation.trim()}</span></div>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="details-block" style={{ marginTop: '25px', marginBottom: '20px' }}>
          <span className="section-label">Complexity Analysis</span>
          <div className="complexity-grid">
            <div className="complexity-card"><div className="comp-label">Time</div><div className="comp-value">{problem.timeComplexity || 'O(n)'}</div></div>
            <div className="complexity-card"><div className="comp-label">Space</div><div className="comp-value">{problem.spaceComplexity || 'O(1)'}</div></div>
          </div>
        </div>
      </div>

      {/* CODE TAB — 🌟 FIX: Stripped wrapper and inline styles */}
      <div className={`tab-pane ${activeTab === 'tab-notes' ? 'active' : ''}`} id="tab-notes">
        <div className="ide-header">
          <div className={`lang-pill ${langMenuOpen ? 'active' : ''}`} id={`lang-dropdown-${problem._id}`} onClick={() => setLangMenuOpen(!langMenuOpen)}>
            <div className="lang-pill-header">
              <i className="ri-code-s-slash-line"></i>
              <span className="lang-text" data-value={language}>{LANG_MAP[language] || 'JavaScript'}</span>
              <i className="ri-arrow-down-s-line chevron-icon"></i>
            </div>
            <div className="lang-menu">
              <div className="lang-item" data-value="javascript" onClick={(e) => { e.stopPropagation(); handleLangChange('javascript'); }}>JavaScript</div>
              <div className="lang-item" data-value="python" onClick={(e) => { e.stopPropagation(); handleLangChange('python'); }}>Python</div>
              <div className="lang-item" data-value="text/x-csrc" onClick={(e) => { e.stopPropagation(); handleLangChange('text/x-csrc'); }}>C</div>
              <div className="lang-item" data-value="text/x-c++src" onClick={(e) => { e.stopPropagation(); handleLangChange('text/x-c++src'); }}>C++</div>
              <div className="lang-item" data-value="text/x-java" onClick={(e) => { e.stopPropagation(); handleLangChange('text/x-java'); }}>Java</div>
            </div>
          </div>
        </div>

        <textarea ref={editorRef} id={`cm-editor-${problem._id}`} style={{ display: 'none' }}></textarea>
      </div>

      {/* AI ASSISTANT TAB — 🌟 FIX: Stripped wrapper and inline styles */}
      <div className={`tab-pane ${activeTab === 'tab-ai' ? 'active' : ''}`} id="tab-ai">

        {/* Confirm Wipe Popup */}
        {showClearConfirm && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(12, 14, 20, 0.85)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '0 0 12px 12px' }}>
            <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(248, 113, 113, 0.3)', padding: '20px', borderRadius: '12px', textAlign: 'center', maxWidth: '80%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <i className="ri-error-warning-line" style={{ fontSize: '32px', color: '#f87171', marginBottom: '10px' }}></i>
              <h3 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '16px' }}>Wipe AI Memory?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 20px 0' }}>This conversation will be permanently deleted.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button id="cancel-clear-btn" onClick={() => setShowClearConfirm(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', transition: '0.2s' }}>Cancel</button>
                <button id="confirm-clear-btn" onClick={wipeMemory} style={{ background: '#f87171', border: 'none', color: '#121212', fontWeight: 'bold', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', transition: '0.2s' }}>Wipe It</button>
              </div>
            </div>
          </div>
        )}

        <div className="ai-chat-box">
          <div className="ai-chat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Tutor Chat</span>
            <i className="ri-delete-bin-7-line" id="clear-chat-btn" style={{ cursor: 'pointer', color: '#f87171', fontSize: '16px', transition: '0.2s' }} title="Clear Memory" onClick={() => setShowClearConfirm(true)}></i>
          </div>

          <div className={`ai-history ${chatHistory.length > 0 ? 'has-chat' : ''}`} ref={aiHistoryRef}>
            {chatHistory.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                <i className="ri-robot-2-line" style={{ fontSize: '36px', color: 'var(--accent)', marginBottom: '12px' }}></i>
                <span style={{ fontSize: '13px' }}>AI Context initialized for <strong>{problem.title}</strong>.</span>
              </div>
            ) : (
              chatHistory.map((msg, idx) => {
                return (
                  <div key={idx} className={`chat-msg ${msg.role}`}>
                    <div
                      className="chat-bubble"
                      dangerouslySetInnerHTML={{
                        __html: msg.role === 'bot' && window.marked
                          ? window.marked.parse(msg.content || '')
                          : msg.content
                      }}
                    ></div>
                  </div>
                );
              })
            )}
            {isAiThinking && (
              <div className="chat-msg bot">
                <div className="chat-bubble"><i className="ri-loader-4-line ri-spin"></i> Finalist AI is thinking...</div>
              </div>
            )}
          </div>

          <div className="ai-input-wrapper">
            <input
              type="text"
              className="ai-input"
              placeholder="Ask for a hint or complexity check..."
              value={aiInput}
              ref={aiInputRef}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAiSend(); } }}
              disabled={isAiThinking}
            />
            <button className="ai-send-btn" onClick={handleAiSend} disabled={isAiThinking} style={{ opacity: isAiThinking ? 0.5 : 1, cursor: isAiThinking ? 'wait' : 'pointer' }}>
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: ANALYTICS PANEL
// =========================================================================
function AnalyticsPanel({ data, onBubbleClick, panelWidth, liveTimer }) {
  const bubblesRef = useRef(null);
  const bubbleClickRef = useRef(onBubbleClick);
  useEffect(() => { bubbleClickRef.current = onBubbleClick; }, [onBubbleClick]);

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
      const isToday = currentDay.toDateString() === today.toDateString();
      return { name: dayNames[i], isActive, isToday };
    });
  }, [data.heatmap]);

  const topicsJson = JSON.stringify(data.topics);

  // 🌟 FIX: Bubble packing matches the original exactly (padding=1, angle step=0.2, radius step=0.1)
  useEffect(() => {
    if (!bubblesRef.current || !data.topics) return;
    const container = bubblesRef.current;
    container.innerHTML = '';
    const activeTopics = data.topics.filter(t => t.solved > 0);

    if (activeTopics.length === 0) {
      container.innerHTML = "<div class='empty-placeholder' style='color: var(--text-muted); font-size: 13px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; line-height: 1.6;'>Solve problems to unlock<br>your Topic Cluster!</div>";
      return;
    }

    const maxTotal = Math.max(...activeTopics.map(t => t.total));
    let bubblesData = activeTopics.map(topic => {
      const scaleFactor = topic.total / maxTotal;
      const size = 40 + (scaleFactor * 50);
      return { ...topic, size, r: size / 2, x: 0, y: 0 };
    });
    bubblesData.sort((a, b) => b.r - a.r);

    const placed = [];
    const padding = 1; // 🌟 FIX: Original uses padding=1
    bubblesData.forEach(b => {
      let angle = 0, radius = 0, isPlaced = false;
      while (!isPlaced) {
        b.x = Math.cos(angle) * radius; b.y = Math.sin(angle) * radius;
        let collision = false;
        for (let p of placed) {
          const dx = b.x - p.x, dy = b.y - p.y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < b.r + p.r + padding) { collision = true; break; }
        }
        if (!collision) { isPlaced = true; placed.push(b); }
        else { angle += 0.2; radius += 0.1; } // 🌟 FIX: Original uses 0.2/0.1 step
      }
    });

    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    placed.forEach(p => {
      minX = Math.min(minX, p.x - p.r); maxX = Math.max(maxX, p.x + p.r);
      minY = Math.min(minY, p.y - p.r); maxY = Math.max(maxY, p.y + p.r);
    });

    const clusterW = maxX - minX, clusterH = maxY - minY;
    const boxW = container.clientWidth || 280, boxH = container.clientHeight || 250;
    const scale = Math.min(1, (boxW - 20) / clusterW, (boxH - 20) / clusterH);

    placed.forEach(p => {
      const finalX = (p.x - minX) * scale + (boxW - clusterW * scale) / 2;
      const finalY = (p.y - minY) * scale + (boxH - clusterH * scale) / 2;
      const finalSize = p.size * scale;
      const pct = p.total === 0 ? 0 : Math.round((p.solved / p.total) * 100);

      const bubble = document.createElement("div");
      bubble.className = "topic-bubble";
      bubble.dataset.topic = p.name;
      // Start at 0 size and animate in (matches original mount animation)
      bubble.style.left = `${finalX}px`; bubble.style.top = `${finalY}px`;
      bubble.style.width = `0px`; bubble.style.height = `0px`;

      bubble.setAttribute('data-tooltip', `${p.name}: ${p.solved} / ${p.total} Solved`);
      bubble.onclick = (e) => { e.stopPropagation(); bubbleClickRef.current(p.name); };

      const nameStyle = finalSize > 70 ? '11px' : (finalSize > 45 ? '9px' : '7.5px');
      const nameOpacity = finalSize < 25 ? '0' : '1';
      bubble.innerHTML = `
          <div class="bubble-mask">
            <div class="wave" style="--fill-pct: ${pct}%; opacity: ${pct === 0 ? 0 : 1};"></div>
          </div>
          <div class="bubble-content">
            <span class="bubble-name" style="font-size: ${nameStyle}; opacity: ${nameOpacity};">${p.name}</span>
          </div>`;

      container.appendChild(bubble);
      bubble.offsetHeight; // Force reflow for animation

      bubble.style.transition = 'left 0.8s cubic-bezier(0.16, 1, 0.3, 1), top 0.8s cubic-bezier(0.16, 1, 0.3, 1), width 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s';
      bubble.style.width = `${finalSize}px`;
      bubble.style.height = `${finalSize}px`;
    });
  }, [topicsJson, panelWidth]);

  // 🌟 FIX: Time spent uses cumulative local tracking and listens to liveTimer
  const timeSpentDisplay = useMemo(() => {
    const backendMs = (data?.streak?.timeSpentHrs || 0) * 3600000;
    let localMs = parseInt(localStorage.getItem('finalist_cumulative_time')) || 0;
    let trueCumulative = Math.max(backendMs, localMs);
    localStorage.setItem('finalist_cumulative_time', trueCumulative);
    return `${Math.floor(trueCumulative / 3600000)} hrs`;
  }, [data?.streak?.timeSpentHrs, liveTimer]); // 🌟 FIX: Added liveTimer

  return (
    <>
      {/* STREAK CARD */}
      <div className="stat-card stat-small" style={{ padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="streak-main" style={{ flex: 1, paddingRight: '20px', minWidth: 0 }}>
          <div className="streak-top">
            <i className="ri-fire-fill streak-icon"></i>
            <div className="streak-info">
              <span className="streak-count" id="streak-count-val">{data?.streak?.current || 0}</span>
              <span className="streak-label">Day Streak</span>
            </div>
          </div>
          <div className="streak-week" id="streak-week-container">
            {weekDays.map(day => (
              <div key={day.name} className="day-tracker">
                <div className={`day-circle ${day.isActive ? 'active' : ''}`}><i className="ri-check-line"></i></div>
                <span className={`day-name ${day.isToday ? 'today' : ''}`}>{day.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="streak-secondary">
          <div className="stat-mini">
            <span className="stat-mini-label">Max Streak</span>
            <span className="stat-mini-value" id="max-streak-val">{data?.streak?.max || 0} Days</span>
          </div>
          <div className="stat-mini">
            <span className="stat-mini-label">Time Spent</span>
            <span className="stat-mini-value" id="time-spent-val">{timeSpentDisplay}</span>
          </div>
        </div>
      </div>

      {/* ACTIVITY HEATMAP CARD */}
      <div className="stat-card stat-medium" style={{ flexDirection: 'column', padding: '15px 20px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '10px' }}>
          <span className="section-label" style={{ marginBottom: 0 }}>Activity Log</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last 16 Weeks</span>
        </div>
        <div className="heatmap-container" id="activity-heatmap">
          {(data?.heatmap || []).map((day, idx) => {
            const dateObj = new Date(day.date);
            const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return (
              <div
                key={idx}
                className={`heatmap-square heat-${day.level}`}
                data-tooltip={day.count === 0 ? `No activity on ${dateString}` : `${day.count} problems solved on ${dateString}`}
              ></div>
            );
          })}
        </div>
      </div>

      {/* TOPIC BUBBLES CARD */}
      <div className="stat-card stat-large" style={{ flexDirection: 'column', padding: '20px', alignItems: 'flex-start' }}>
        <span className="section-label" style={{ marginBottom: '15px' }}>Topic Distribution</span>
        <div className="bubbles-container" id="topic-bubbles" ref={bubblesRef}></div>
      </div>
    </>
  );
}