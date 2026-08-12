import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearFinalistSession } from '../utils/auth';
import AnalyticsPanel from '../components/AnalyticsPanel';
import TimerProvider from '../components/TimerProvider';
import ProblemExplorer from '../components/ProblemExplorer';
import "../dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  // --- REAL DATABASE STATE ---
  const [problemsData, setProblemsData] = useState([]);
  const [solvedIds, setSolvedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('finalist_solved') || '[]');
    } catch (_) {
      return [];
    }
  });
  const [starredIds, setStarredIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('finalist_starred') || '[]');
    } catch (_) {
      return [];
    }
  });
  const [analyticsData, setAnalyticsData] = useState(() => {
    try {
      const cached = localStorage.getItem('finalist_analytics_cache');
      return cached ? JSON.parse(cached) : { streak: { current: 0, max: 0, timeSpentHrs: 0 }, heatmap: [], topics: [] };
    } catch (_) {
      return { streak: { current: 0, max: 0, timeSpentHrs: 0 }, heatmap: [], topics: [] };
    }
  });
  const [userProfile, setUserProfile] = useState(null);

  // 🌟 THE FIX 1: Lazy Cache for heavy problem descriptions
  const [fullProblemCache, setFullProblemCache] = useState({});

  // --- UI STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [activeProblemId, setActiveProblemId] = useState(null);

  // 🌟 THE FIX 2: Combine lightweight list data with the heavy fetched description
  const activeProblem = useMemo(() => {
    if (!activeProblemId) return null;
    return fullProblemCache[activeProblemId] || problemsData.find(p => String(p._id) === activeProblemId) || null;
  }, [problemsData, activeProblemId, fullProblemCache]);

  // --- ANALYTICS & DRAGGER STATE ---
  const [analyticsWidth, setAnalyticsWidth] = useState(parseInt(localStorage.getItem('finalist_analytics_width')) || 320);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(localStorage.getItem('finalist_analytics_state') !== 'hidden');
  const isDraggingRef = useRef(false);
  const [isDraggingUI, setIsDraggingUI] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const analyticsWidthRef = useRef(analyticsWidth); 

  // --- SEARCH BAR TYPING EFFECT STATE ---
  const searchInputRef = useRef(null);

  // --- LIFTED FILTER STATE ---
  const [selectedTags, setSelectedTags] = useState(JSON.parse(localStorage.getItem("finalist_tags") || "[]"));

  const handleTagToggle = useCallback((tag) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      localStorage.setItem("finalist_tags", JSON.stringify(newTags));
      return newTags;
    });
  }, []);

  // =========================================================================
  // 1. FETCH FULL PROBLEM ON MOUNT (If user refreshed with an open problem)
  // =========================================================================
  useEffect(() => {
    const initialId = localStorage.getItem("finalist_active_problem");
    if (initialId) {
        fetch(`${import.meta.env.VITE_API_URL}/api/problems/${initialId}`)
            .then(res => res.json())
            .then(fullData => setFullProblemCache(prev => ({...prev, [initialId]: fullData})))
            .catch(console.error);
    }
  }, []);

  // =========================================================================
  // 2. ENGINE: NATIVE GLOBAL TOOLTIP PHYSICS
  // =========================================================================
  useEffect(() => {
    const globalTooltip = document.createElement('div');
    globalTooltip.className = 'global-tooltip';
    globalTooltip.setAttribute('aria-hidden', 'true');
    document.body.appendChild(globalTooltip);

    const handleMouseOver = (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        globalTooltip.textContent = target.getAttribute('data-tooltip');
        globalTooltip.classList.add('active');
      }
    };
    let ticking = false;
    const handleMouseMove = (e) => {
      if (!globalTooltip.classList.contains('active')) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          let x = e.clientX, y = e.clientY - 15;
          const rect = globalTooltip.getBoundingClientRect();

          if (x + (rect.width / 2) > window.innerWidth - 15) x = window.innerWidth - (rect.width / 2) - 15;
          if (x - (rect.width / 2) < 15) x = (rect.width / 2) + 15;
          if (y - rect.height < 10) { y = e.clientY + 25; globalTooltip.style.transform = `translate(-50%, 0)`; }
          else { globalTooltip.style.transform = `translate(-50%, -100%)`; }

          globalTooltip.style.left = `${x}px`;
          globalTooltip.style.top = `${y}px`;

          ticking = false; 
        });
        ticking = true; 
      }
    };
    const handleMouseOut = (e) => {
      if (e.target.closest('[data-tooltip]')) globalTooltip.classList.remove('active');
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseout', handleMouseOut);
      if (document.body.contains(globalTooltip)) document.body.removeChild(globalTooltip);
    };
  }, []);

  // =========================================================================
  // 3. ENGINE: MOUSE GLOW
  // =========================================================================
  useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
          document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
          ticking = false;
        });
        ticking = true;
      }
    };
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // =========================================================================
  // 3c. ENGINE: DECOUPLED DATA FETCHING & INSTANT CACHE
  // =========================================================================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const API_BASE = import.meta.env.VITE_API_URL;
    const tzOffset = String(new Date().getTimezoneOffset());
    const authHeaders = { "Authorization": "Bearer " + token, "Timezone-Offset": tzOffset };

    const cachedProblems = localStorage.getItem('finalist_problems_cache');
    if (cachedProblems) {
      setProblemsData(JSON.parse(cachedProblems));
      setIsLoading(false);
    }

    fetch(`${API_BASE}/api/problems`, { headers: authHeaders })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch problems');
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid problems payload');
        return data;
      })
      .then(data => {
        setProblemsData(data);
        localStorage.setItem('finalist_problems_cache', JSON.stringify(data));
        if (!cachedProblems) setIsLoading(false);
      }).catch(() => { if (!cachedProblems) setIsLoading(false); });

    fetch(`${API_BASE}/api/auth/profile`, { headers: authHeaders })
      .then(async res => {
        if (res.status === 401) {
          clearFinalistSession();
          navigate('/', { replace: true });
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('Profile unavailable');
        return res.json();
      })
      .then(data => {
        if (data?.name) setUserProfile(data);
      })
      .catch((err) => {
        if (err.message === 'Unauthorized') return;
        setUserProfile({ name: 'Guest', email: '', avatar: '' });
      });

    fetch(`${API_BASE}/api/progress`, { headers: authHeaders })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch progress');
        return res.json();
      })
      .then(progress => {
        if (Array.isArray(progress)) {
          const solved = progress.filter(p => p.solved).map(p => typeof p.problem === 'object' ? String(p.problem._id) : String(p.problem));
          const starred = progress.filter(p => p.starred).map(p => typeof p.problem === 'object' ? String(p.problem._id) : String(p.problem));
          setSolvedIds(solved);
          setStarredIds(starred);
          // Persist to localStorage so ProblemWorkspace can read correct initial state
          localStorage.setItem('finalist_starred', JSON.stringify(starred));
          localStorage.setItem('finalist_solved', JSON.stringify(solved));
        }
      }).catch(err => console.error("Error loading progress:", err));

    fetch(`${API_BASE}/api/progress/analytics`, { headers: authHeaders })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.heatmap) && Array.isArray(data.topics)) {
          setAnalyticsData(data);
          localStorage.setItem('finalist_analytics_cache', JSON.stringify(data));
        }
      }).catch(err => console.error("Error loading analytics:", err));

  }, [navigate]);

  // Sync star/solved state when toggled from ProblemWorkspace (which dispatches a StorageEvent)
  useEffect(() => {
    const handleStorageSync = (e) => {
      // 🌟 PREVENT STATE WIPE: Ignore events with empty, null, or undefined values
      if (!e.newValue || e.newValue === 'undefined' || e.newValue === 'null') return;

      if (e.key === 'finalist_starred') {
        try { setStarredIds(JSON.parse(e.newValue)); } catch (_) {}
      }
      if (e.key === 'finalist_solved') {
        try {
          const nextSolved = JSON.parse(e.newValue);
          setSolvedIds(nextSolved);

          // Dynamic background sync of analytics when solved state is updated in another tab/workspace
          const token = localStorage.getItem('token');
          if (token) {
            const API_BASE = import.meta.env.VITE_API_URL;
            const tzOffset = String(new Date().getTimezoneOffset());
            fetch(`${API_BASE}/api/progress/analytics`, { headers: { "Authorization": "Bearer " + token, "Timezone-Offset": tzOffset } })
              .then(res => {
                if (!res.ok) throw new Error('Failed to fetch background analytics');
                return res.json();
              })
              .then(data => {
                if (data && Array.isArray(data.heatmap) && Array.isArray(data.topics)) {
                  setAnalyticsData(data);
                  localStorage.setItem('finalist_analytics_cache', JSON.stringify(data));
                }
              }).catch(() => {});
          }
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // =========================================================================
  // 5. ENGINE: INTERACTION & DRAGGER
  // =========================================================================
  const handleToggleSolved = async (e, id) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    const idStr = String(id);
    const problem = problemsData.find(p => String(p._id) === idStr);
    const problemTags = problem?.tags || [];

    // 🌟 Read from localStorage (synchronously updated) to avoid stale closure on rapid clicks
    const currentSolved = JSON.parse(localStorage.getItem('finalist_solved') || '[]');
    const isCurrentlySolved = currentSolved.includes(idStr);
    const nextSolved = isCurrentlySolved ? currentSolved.filter(i => i !== idStr) : [...currentSolved, idStr];
    
    setSolvedIds(nextSolved);
    localStorage.setItem('finalist_solved', JSON.stringify(nextSolved));
    window.dispatchEvent(new StorageEvent('storage', { key: 'finalist_solved', newValue: JSON.stringify(nextSolved) }));

    setAnalyticsData(prev => {
      if (!prev) return prev;
      const todayStr = new Date().toISOString().split('T')[0];
      const topics = prev.topics || [];
      const heatmap = prev.heatmap || [];

      const newTopics = topics.map(t => {
        if (problemTags.includes(t.name)) {
          const currentSolvedCount = typeof t.solved === 'number' ? t.solved : 0;
          return { ...t, solved: Math.max(0, currentSolvedCount + (isCurrentlySolved ? -1 : 1)) };
        }
        return t;
      });

      const newHeatmap = heatmap.map(d => {
        if (d.date === todayStr) {
          const newCount = Math.max(0, d.count + (isCurrentlySolved ? -1 : 1));
          let level = 0;
          if (newCount > 0) level = 1;
          if (newCount >= 3) level = 2;
          if (newCount >= 5) level = 3;
          if (newCount >= 8) level = 4;
          return { ...d, count: newCount, level };
        }
        return d;
      });

      const updated = { ...prev, topics: newTopics, heatmap: newHeatmap };
      localStorage.setItem('finalist_analytics_cache', JSON.stringify(updated));
      return updated;
    });

    try {
      const tzOffset = String(new Date().getTimezoneOffset());
      const authHeaders = { "Authorization": "Bearer " + token, "Timezone-Offset": tzOffset };
      fetch(`${import.meta.env.VITE_API_URL}/api/progress/toggle-solved/${id}`, { method: "POST", headers: authHeaders });
    } catch (err) {
      // Quiet fail or handle error
    }
  };

  const handleToggleStar = async (e, id) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    const idStr = String(id);

    // 🌟 Read from localStorage (synchronously updated) to avoid stale closure on rapid clicks
    const currentStarred = JSON.parse(localStorage.getItem('finalist_starred') || '[]');
    const isCurrentlyStarred = currentStarred.includes(idStr);
    const nextStarred = isCurrentlyStarred ? currentStarred.filter(i => i !== idStr) : [...currentStarred, idStr];

    setStarredIds(nextStarred);
    localStorage.setItem('finalist_starred', JSON.stringify(nextStarred));
    window.dispatchEvent(new StorageEvent('storage', { key: 'finalist_starred', newValue: JSON.stringify(nextStarred) }));

    try { fetch(`${import.meta.env.VITE_API_URL}/api/progress/toggle-star/${id}`, { method: "POST", headers: { "Authorization": "Bearer " + token } }); } catch (err) { }
  };

  const handleDragStart = (e) => {
    if (e.target.closest('#panel-fold-btn')) return;
    isDraggingRef.current = true;
    setIsDraggingUI(true); 
    startXRef.current = e.clientX;
    startWidthRef.current = analyticsWidthRef.current;
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !activeProblemId) return;

      let rawWidth = startWidthRef.current - (e.clientX - startXRef.current);

      if (rawWidth >= 320) {
        analyticsWidthRef.current = 320;
      } else if (rawWidth > 270) {
        analyticsWidthRef.current = 320 - ((320 - rawWidth) * 0.4);
      } else {
        collapseAnalytics();
        return;
      }

      const statsPanel = document.getElementById('stats-panel');
      if (statsPanel) {
        statsPanel.style.width = `${analyticsWidthRef.current}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDraggingUI(false); 
        document.body.style.cursor = 'default'; 
        document.body.style.userSelect = 'auto';
        
        const snapped = analyticsWidthRef.current < 320 ? 320 : analyticsWidthRef.current;
        analyticsWidthRef.current = snapped;
        
        setAnalyticsWidth(snapped);
        localStorage.setItem('finalist_analytics_width', snapped);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => { 
      document.removeEventListener('mousemove', handleMouseMove); 
      document.removeEventListener('mouseup', handleMouseUp); 
    };
  }, [activeProblemId]);

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

  // 🌟 THE FIX 3: State Reference blocks stale closures, guaranteeing perfect toggle behavior
  const stateRef = useRef({ activeProblemId, fullProblemCache });
  useEffect(() => {
      stateRef.current = { activeProblemId, fullProblemCache };
  }, [activeProblemId, fullProblemCache]);

  const handleProblemClick = useCallback((problem) => {
    const slug = problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    // Cache the basic problem info so the workspace page loads instantly
    sessionStorage.setItem(`problem_${slug}`, JSON.stringify(problem));
    navigate(`/problems/${slug}`);
  }, [navigate]);

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <>
      <div className="bg-glow" aria-hidden="true"></div>
      <div className="runes-container" id="runes-container" aria-hidden="true"></div>

      <div id="global-preloader" className={!isLoading ? "hidden" : ""} role="status" aria-live="polite" aria-hidden={!isLoading}>
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

      <TimerProvider userProfile={userProfile || { name: 'Loading...', email: '', avatar: '' }} />

      <div className="dashboard" aria-busy={isLoading}>
        <ProblemExplorer 
          problemsData={problemsData}
          solvedIds={solvedIds}
          starredIds={starredIds}
          analyticsData={analyticsData}
          activeProblemId={activeProblemId}
          handleProblemClick={handleProblemClick}
          handleToggleSolved={handleToggleSolved}
          handleToggleStar={handleToggleStar}
          selectedTags={selectedTags}
          handleTagToggle={handleTagToggle}
          isWorkspaceOpen={false} 
        />

        {/* VERTICAL DIVIDER */}
        {activeProblemId && (
          <div
            className={`vertical-divider ${!isAnalyticsOpen ? 'collapsed' : ''}`}
            id="vertical-divider"
            onMouseDown={handleDragStart}
            style={{ cursor: 'col-resize' }}
            role="separator"
            aria-orientation="vertical"
          >
            <button
              className="panel-fold-btn"
              id="panel-fold-btn"
              data-tooltip={isAnalyticsOpen ? "Fold" : "Unfold"}
              style={{ display: 'flex' }}
              onClick={toggleAnalytics}
              aria-label={isAnalyticsOpen ? "Collapse analytics panel" : "Expand analytics panel"}
              aria-expanded={isAnalyticsOpen}
              aria-controls="stats-panel"
            >
              <i className="ri-arrow-right-double-line"></i>
            </button>
          </div>
        )}

        {/* STATS / ANALYTICS PANEL */}
        <div
          className={`stats-panel ${activeProblemId && !isAnalyticsOpen ? 'hidden' : 'snap-back'} ${isDraggingUI ? 'dragging' : ''}`}
          id="stats-panel"
          role="complementary"
          aria-label="Analytics"
          style={{
            width: `${analyticsWidth}px`,
            opacity: 1,
            overflow: 'hidden',
            maxHeight: '100%',
            flexShrink: 0,
            transition: isDraggingUI
              ? 'none'
              : (activeProblemId && !isAnalyticsOpen)
                ? 'width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease'
                : 'width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease 0.1s',
          }}
        >
          <AnalyticsPanel 
            data={analyticsData} 
            onBubbleClick={handleTagToggle} 
            panelWidth={analyticsWidth} 
            liveTimer={0} 
          />
        </div>
      </div>
    </>
  );
}