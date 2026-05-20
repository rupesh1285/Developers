import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import AiTutor from '../components/AiTutor';
import '../dashboard.css';

// ── Inline styles for the workspace-specific elements ────────────────────────
const wsStyles = `
  /* Premium scrollbar for description */
  .ws-desc-scroll::-webkit-scrollbar { width: 5px; }
  .ws-desc-scroll::-webkit-scrollbar-track { background: transparent; }
  .ws-desc-scroll::-webkit-scrollbar-thumb { background: rgba(88,166,255,0.25); border-radius: 10px; }
  .ws-desc-scroll::-webkit-scrollbar-thumb:hover { background: rgba(88,166,255,0.5); }

  /* Premium resizer */
  .ws-resizer {
    width: 6px; cursor: col-resize; flex-shrink: 0; z-index: 10;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(to bottom, transparent 0%, rgba(88,166,255,0.1) 40%, rgba(88,166,255,0.1) 60%, transparent 100%);
    transition: background 0.2s;
    position: relative;
  }
  .ws-resizer::before {
    content: '';
    position: absolute;
    width: 2px; height: 40px;
    background: rgba(255,255,255,0.12);
    border-radius: 2px;
    transition: all 0.2s;
  }
  .ws-resizer:hover::before, .ws-resizer.dragging::before {
    height: 60px;
    background: rgba(88, 166, 255, 0.6);
    box-shadow: 0 0 8px rgba(88, 166, 255, 0.4);
  }
  .ws-resizer:hover, .ws-resizer.dragging {
    background: linear-gradient(to bottom, transparent 0%, rgba(88,166,255,0.2) 30%, rgba(88,166,255,0.2) 70%, transparent 100%);
  }

  /* Topic pill animation */
  @keyframes topicFadeIn  { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes topicFadeOut { from { opacity: 1; } to { opacity: 0; } }

  .topic-tag-row {
    display: flex; flex-wrap: wrap; gap: 6px;
    animation: topicFadeIn 0.3s ease forwards;
  }
  .topic-tag-row.fading {
    animation: topicFadeOut 0.6s ease forwards;
  }

  /* Star button */
  .ws-star { background: none; border: none; cursor: pointer; font-size: 22px; padding: 2px; transition: all 0.2s; flex-shrink: 0; margin-left: 10px; }
  .ws-star:hover { transform: scale(1.2); }
  .ws-star.starred { color: #e3b341; filter: drop-shadow(0 0 6px rgba(227,179,65,0.5)); }
  .ws-star.unstarred { color: #484f58; }
  .ws-star.unstarred:hover { color: #8b949e; }

  /* Collapsed pane strip */
  .ws-strip {
    height: 100%; display: flex; align-items: center; justify-content: center;
    gap: 10px; color: #484f58; cursor: pointer;
    writing-mode: vertical-rl;
    background: rgba(13,17,23,0.8);
    border-right: 1px solid #21262d;
    transition: color 0.2s, background 0.2s;
    padding: 24px 0;
    text-align: center;
  }
  .ws-strip:hover { color: #8b949e; background: rgba(22,27,34,0.9); }
  .ws-strip.right { border-right: none; border-left: 1px solid #21262d; }

  /* Slim tab underline */
  .ws-tab {
    padding: 10px 16px; background: transparent; border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer; font-weight: 600; font-size: 13px;
    display: flex; align-items: center; gap: 6px;
    transition: color 0.2s, border-color 0.2s;
    color: #8b949e;
  }
  .ws-tab.active { color: #c9d1d9; border-bottom-color: #58a6ff; }
  .ws-tab:hover:not(.active) { color: #c9d1d9; }
`;

export default function ProblemWorkspace() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // ── ALL HOOKS AT TOP ─────────────────────────────────────────────────────
  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('desc');

  // Resizer
  const [leftWidthPct, setLeftWidthPct] = useState(45);
  const [isDragging, setIsDragging] = useState(false);

  // Star & Solved states (synced with localStorage/API)
  const [isStarred, setIsStarred] = useState(false);
  const [isSolved, setIsSolved] = useState(false);

  // Topic pill animation state
  const [showTopics, setShowTopics] = useState(false);
  const [topicsFading, setTopicsFading] = useState(false);
  const topicTimerRef = useRef(null);

  const cmInstanceRef = useRef(null);
  const workspaceRef = useRef(null);

  // ── TIMER STATE ───────────────────────────────────────────────────────────
  const [elapsedTime, setElapsedTime] = useState(
    parseInt(localStorage.getItem('finalist_timer_elapsed')) || 0
  );
  const [isTimerRunning, setIsTimerRunning] = useState(
    localStorage.getItem('finalist_timer_running') === 'true'
  );
  const lastTickRef = useRef(Date.now());
  const timerIntervalRef = useRef(null);

  // ── USER PROFILE ──────────────────────────────────────────────────────────
  const [userProfile, setUserProfile] = useState(null);
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  // Fetch problem & sync states
  useEffect(() => {
    const fetchProblem = async () => {
      const cached = sessionStorage.getItem(`problem_${slug}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setProblem(parsed);
          setIsLoading(false);
          
          // Sync star/solved from localStorage
          const starredIds = JSON.parse(localStorage.getItem('finalist_starred') || '[]');
          const solvedIds = JSON.parse(localStorage.getItem('finalist_solved') || '[]');
          const pid = String(parsed._id);
          setIsStarred(starredIds.includes(pid));
          setIsSolved(solvedIds.includes(pid));
        } catch (_) {}
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/problems/${slug}`);
        const data = await res.json();
        if (data && data.title) {
          setProblem(data);
          sessionStorage.setItem(`problem_${slug}`, JSON.stringify(data));
          
          const starredIds = JSON.parse(localStorage.getItem('finalist_starred') || '[]');
          const solvedIds = JSON.parse(localStorage.getItem('finalist_solved') || '[]');
          const pid = String(data._id);
          setIsStarred(starredIds.includes(pid));
          setIsSolved(solvedIds.includes(pid));
        }
      } catch (err) {
        console.error('Failed to fetch problem', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProblem();

    // Fetch user profile for the header
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        headers: { "Authorization": "Bearer " + token }
      })
      .then(res => res.json())
      .then(data => setUserProfile(data))
      .catch(console.error);
    }
  }, [slug]);

  // ── TIMER LOGIC ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isTimerRunning) {
      lastTickRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;
        setElapsedTime(prev => {
          const next = prev + delta;
          localStorage.setItem('finalist_timer_elapsed', next);
          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isTimerRunning]);

  const toggleTimer = () => {
    const next = !isTimerRunning;
    setIsTimerRunning(next);
    localStorage.setItem('finalist_timer_running', next.toString());
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    localStorage.setItem('finalist_timer_running', 'false');
    setElapsedTime(0);
    localStorage.setItem('finalist_timer_elapsed', '0');
  };

  const formatTime = (ms) => {
    let h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const getAvatarSrc = (profile) => {
    if (profile?.avatar && profile.avatar.length > 5) return profile.avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=1a1d27&color=6ea0ea&bold=true&font-size=0.4`;
  };

  // Sync state when toggled from Dashboard/Other tabs
  useEffect(() => {
    const handleSync = (e) => {
      if (!problem) return;
      const id = String(problem._id);

      // 🌟 PREVENT STATE WIPE: Ignore events with empty, null, or undefined values
      if (!e.newValue || e.newValue === 'undefined' || e.newValue === 'null') return;

      if (e.key === 'finalist_starred') {
        try { setIsStarred(JSON.parse(e.newValue).includes(id)); } catch(_) {}
      }
      if (e.key === 'finalist_solved') {
        try { setIsSolved(JSON.parse(e.newValue).includes(id)); } catch(_) {}
      }
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, [problem]);

  // Resizer drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      let newPct = ((e.clientX - rect.left) / rect.width) * 100;
      if (newPct < 5) newPct = 0;
      if (newPct > 95) newPct = 100;
      setLeftWidthPct(newPct);
    };
    const handleMouseUp = () => { if (isDragging) setIsDragging(false); };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Cleanup topic timer on unmount
  useEffect(() => { return () => clearTimeout(topicTimerRef.current); }, []);

  // ── HANDLERS ─────────────────────────────────────────────────────────────
  const handleMouseDown = (e) => { e.preventDefault(); setIsDragging(true); };

  const handleStarToggle = async () => {
    if (!problem) return;
    const id = String(problem._id);
    const newIsStarred = !isStarred;

    setIsStarred(newIsStarred);

    // Sync localStorage
    const prev = JSON.parse(localStorage.getItem('finalist_starred') || '[]');
    const next = newIsStarred ? [...new Set([...prev, id])] : prev.filter(x => x !== id);
    localStorage.setItem('finalist_starred', JSON.stringify(next));

    // Notify other components/tabs
    window.dispatchEvent(new StorageEvent('storage', { key: 'finalist_starred', newValue: JSON.stringify(next) }));

    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/api/progress/toggle-star/${id}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
    } catch (err) {
      // Quiet fail - will sync on next load anyway
    }
  };

  const handleToggleSolved = async () => {
    if (!problem) return;
    const id = String(problem._id);
    const newIsSolved = !isSolved;

    setIsSolved(newIsSolved);

    // Sync localStorage
    const prev = JSON.parse(localStorage.getItem('finalist_solved') || '[]');
    const next = newIsSolved ? [...new Set([...prev, id])] : prev.filter(x => x !== id);
    localStorage.setItem('finalist_solved', JSON.stringify(next));

    // Notify other components/tabs
    window.dispatchEvent(new StorageEvent('storage', { key: 'finalist_solved', newValue: JSON.stringify(next) }));

    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/api/progress/toggle-solved/${id}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
    } catch (err) {
      // Quiet fail
    }
  };

  const handleTopicPillClick = () => {
    clearTimeout(topicTimerRef.current);
    setTopicsFading(false);
    setShowTopics(true);
    // After 2s, fade out and then hide
    topicTimerRef.current = setTimeout(() => {
      setTopicsFading(true);
      topicTimerRef.current = setTimeout(() => {
        setShowTopics(false);
        setTopicsFading(false);
      }, 600);
    }, 2000);
  };

  // ── DERIVED ───────────────────────────────────────────────────────────────
  const isLeftCollapsed  = leftWidthPct === 0;
  const isRightCollapsed = leftWidthPct === 100;
  const actualLeftWidth  = isLeftCollapsed ? '32px' : isRightCollapsed ? 'calc(100% - 32px)' : `${leftWidthPct}%`;

  // ── EARLY RETURNS ────────────────────────────────────────────────────────
  if (isLoading && !problem) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0d1117', color: '#fff', flexDirection: 'column', gap: '16px' }}>
        <i className="ri-loader-4-line ri-spin" style={{ fontSize: '32px', color: '#58a6ff' }}></i>
        <span style={{ color: '#8b949e' }}>Loading problem...</span>
      </div>
    );
  }

  if (!problem) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0d1117', color: '#fff', flexDirection: 'column' }}>
        <h2>Problem not found</h2>
        <button onClick={() => navigate('/problems')} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#238636', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
    <>
      <style>{wsStyles}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0d1117', color: '#c9d1d9', overflow: 'hidden' }}>

        {/* WIDER TOP BAR */}
        <div style={{ 
          height: '44px', 
          backgroundColor: '#161b22', 
          borderBottom: '1px solid #30363d', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 20px', 
          flexShrink: 0, 
          position: 'relative',
          justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}>
          {/* LEFT: Dashboard Link */}
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <button
              onClick={() => navigate('/problems')}
              style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', transition: 'color 0.2s', textTransform: 'uppercase', letterSpacing: '0.8px' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}
            >
              <i className="ri-arrow-left-s-line" style={{ fontSize: '18px' }}></i> Dashboard
            </button>
          </div>

          {/* CENTER: Stopwatch (Exactly in the middle) */}
          <div style={{ 
            position: 'absolute', 
            left: '50%', 
            top: '50%', 
            transform: 'translate(-50%, -50%)',
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <div className="ws-header-timer" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              background: 'rgba(0,0,0,0.5)', 
              padding: '4px 14px', 
              borderRadius: '20px', 
              border: '1px solid rgba(88,166,255,0.2)',
              boxShadow: '0 0 20px rgba(0,0,0,0.3)'
            }}>
              <button onClick={toggleTimer} style={{ background: 'none', border: 'none', color: isTimerRunning ? '#ff7b72' : '#58a6ff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <i className={isTimerRunning ? "ri-pause-circle-fill" : "ri-play-circle-fill"} style={{ fontSize: '20px' }}></i>
              </button>
              <span style={{ fontFamily: '"Fira Code", monospace', fontSize: '14px', fontWeight: '700', color: '#fff', minWidth: '75px', textAlign: 'center', letterSpacing: '1px' }}>{formatTime(elapsedTime)}</span>
              <button onClick={resetTimer} style={{ background: 'none', border: 'none', color: '#484f58', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, transition: 'color 0.2s' }} title="Reset Timer" onMouseEnter={e => e.currentTarget.style.color = '#ff7b72'} onMouseLeave={e => e.currentTarget.style.color = '#484f58'}>
                <i className="ri-refresh-line" style={{ fontSize: '15px' }}></i>
              </button>
            </div>
          </div>

          {/* RIGHT: Profile Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: 1, position: 'relative' }}>
             {/* PREMIUM HOVER PILL */}
             {isProfileHovered && (
               <div style={{ 
                 position: 'absolute', top: '100%', right: '0', marginTop: '12px',
                 backgroundColor: 'rgba(13, 17, 23, 0.9)', backdropFilter: 'blur(10px)',
                 border: '1px solid rgba(88,166,255,0.3)', borderRadius: '20px',
                 padding: '6px 14px', whiteSpace: 'nowrap', color: '#fff', fontSize: '11px', fontWeight: '700',
                 boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(88,166,255,0.2)',
                 animation: 'fadeIn 0.2s ease', pointerEvents: 'none', zIndex: 100,
                 display: 'flex', alignItems: 'center', gap: '6px'
               }}>
                 <i className="ri-user-heart-line" style={{ color: '#58a6ff' }}></i>
                 View Profile
               </div>
             )}

             <div 
               style={{ 
                 width: '28px', 
                 height: '28px', 
                 borderRadius: '50%', 
                 overflow: 'hidden', 
                 border: '2px solid #58a6ff', 
                 cursor: 'pointer',
                 boxShadow: '0 0 10px rgba(88,166,255,0.3)',
                 transition: 'transform 0.2s'
               }}
               onClick={() => navigate('/problems')}
               onMouseEnter={() => { setIsProfileHovered(true); }}
               onMouseLeave={() => { setIsProfileHovered(false); }}
             >
                <img 
                  src={getAvatarSrc(userProfile)} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
             </div>
          </div>
        </div>

        {/* WORKSPACE */}
        <div
          ref={workspaceRef}
          style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', userSelect: isDragging ? 'none' : 'auto', cursor: isDragging ? 'col-resize' : 'auto' }}
        >
          {/* ── LEFT PANE ── */}
          <div style={{ width: actualLeftWidth, display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117', transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', overflow: 'hidden', flexShrink: 0 }}>
            {isLeftCollapsed ? (
              <div className="ws-strip" style={{ width: '32px' }} onClick={() => setLeftWidthPct(30)}>
                <i className="ri-file-list-3-line" style={{ fontSize: '15px' }}></i>
                <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>Description</span>
              </div>
            ) : (
              <>
                {/* PROBLEM HEADER */}
                <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h1 style={{ fontSize: '19px', fontWeight: '700', margin: 0, color: '#fff', lineHeight: '1.3' }}>
                      {problem.problemNumber}. {problem.title}
                    </h1>
                    <button
                      className={`ws-star ${isStarred ? 'starred' : 'unstarred'}`}
                      onClick={handleStarToggle}
                      title={isStarred ? 'Remove from starred' : 'Add to starred'}
                    >
                      <i className={isStarred ? 'ri-star-fill' : 'ri-star-line'}></i>
                    </button>
                  </div>

                  {/* DIFFICULTY + TOPIC PILL */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span className={`panel-difficulty ${problem.difficulty?.toLowerCase()}`}>{problem.difficulty}</span>

                    {problem.tags && problem.tags.length > 0 && !showTopics && (
                      <button
                        onClick={handleTopicPillClick}
                        style={{ background: 'rgba(88,166,255,0.08)', border: '1px solid rgba(88,166,255,0.2)', padding: '3px 12px', borderRadius: '20px', fontSize: '12px', color: '#58a6ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(88,166,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(88,166,255,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(88,166,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(88,166,255,0.2)'; }}
                      >
                        <i className="ri-price-tag-3-line"></i> Topics
                      </button>
                    )}

                    {showTopics && (
                      <div className={`topic-tag-row ${topicsFading ? 'fading' : ''}`}>
                        {problem.tags.map(tag => (
                          <span key={tag} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', color: '#8b949e' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* TABS */}
                <div style={{ display: 'flex', borderBottom: '1px solid #21262d', backgroundColor: '#0d1117', padding: '0 20px', flexShrink: 0 }}>
                  <button className={`ws-tab ${activeTab === 'desc' ? 'active' : ''}`} onClick={() => setActiveTab('desc')}>
                    <i className="ri-book-read-line"></i> Description
                  </button>
                  <button className={`ws-tab ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
                    <i className="ri-sparkling-fill" style={{ color: activeTab === 'ai' ? '#d2a8ff' : 'inherit' }}></i> AI Tutor
                  </button>
                </div>

                {/* TAB CONTENT */}
                <div className="ws-desc-scroll" style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }}>
                  {activeTab === 'desc' ? (
                    <div>
                      <p style={{ color: '#c9d1d9', lineHeight: '1.8', fontSize: '14px', margin: '0 0 24px' }}
                         dangerouslySetInnerHTML={{ __html: (problem.description || 'Loading description...').replace(/\n/g, '<br/>') }}
                      />

                      {problem.examples && problem.examples.length > 0 && (
                        <div style={{ marginBottom: '28px' }}>
                          <h3 style={{ color: '#fff', fontSize: '13px', fontWeight: '700', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#8b949e' }}>Examples</h3>
                          {problem.examples.map((ex, idx) => (
                            <div key={idx} style={{ marginBottom: '16px' }}>
                              <p style={{ color: '#8b949e', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Example {idx + 1}:</p>
                              <div style={{ backgroundColor: 'rgba(22,27,34,0.6)', padding: '14px 16px', borderRadius: '8px', border: '1px solid #21262d', fontFamily: '"Fira Code", monospace', fontSize: '13px', lineHeight: '1.7' }}>
                                <div><strong style={{ color: '#8b949e', fontWeight: '500' }}>Input: </strong><span style={{ color: '#c9d1d9' }}>{(ex.input || '').trim()}</span></div>
                                <div><strong style={{ color: '#8b949e', fontWeight: '500' }}>Output: </strong><span style={{ color: '#c9d1d9' }}>{(ex.output || '').trim()}</span></div>
                                {ex.explanation && <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #30363d' }}><strong style={{ color: '#8b949e', fontWeight: '500' }}>Explanation: </strong><span style={{ color: '#c9d1d9' }}>{ex.explanation.trim()}</span></div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {(problem.timeComplexity || problem.spaceComplexity) && (
                        <div style={{ marginBottom: '40px' }}>
                          <h3 style={{ color: '#8b949e', fontSize: '13px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Complexity</h3>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1, backgroundColor: 'rgba(22,27,34,0.6)', padding: '12px', borderRadius: '8px', border: '1px solid #21262d', textAlign: 'center' }}>
                              <div style={{ color: '#8b949e', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</div>
                              <div style={{ fontFamily: 'monospace', color: '#d2a8ff', fontSize: '14px' }}>{problem.timeComplexity || 'O(n)'}</div>
                            </div>
                            <div style={{ flex: 1, backgroundColor: 'rgba(22,27,34,0.6)', padding: '12px', borderRadius: '8px', border: '1px solid #21262d', textAlign: 'center' }}>
                              <div style={{ color: '#8b949e', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Space</div>
                              <div style={{ fontFamily: 'monospace', color: '#ff7b72', fontSize: '14px' }}>{problem.spaceComplexity || 'O(1)'}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <AiTutor problem={problem} isActive={true} cmInstanceRef={cmInstanceRef} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── PREMIUM RESIZER ── */}
          <div
            className={`ws-resizer ${isDragging ? 'dragging' : ''}`}
            onMouseDown={handleMouseDown}
          />

          {/* ── RIGHT PANE ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117', minWidth: 0, overflow: 'hidden', margin: 0, padding: 0 }}>
            {isRightCollapsed ? (
              <div className="ws-strip right" style={{ width: '32px' }} onClick={() => setLeftWidthPct(45)}>
                <i className="ri-code-line" style={{ fontSize: '15px' }}></i>
                <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>Code Space</span>
              </div>
            ) : (
              <CodeEditor 
                problem={problem} 
                isActive={true} 
                cmInstanceRef={cmInstanceRef} 
                isSolved={isSolved}
                onToggleSolved={handleToggleSolved}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
