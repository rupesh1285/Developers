import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import AiTutor from '../components/AiTutor';
import '../dashboard.css';

export default function ProblemWorkspace() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // ── ALL HOOKS AT THE TOP (Rules of Hooks) ────────────────────────────────
  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('desc');
  const [leftWidthPct, setLeftWidthPct] = useState(45);
  const [isDragging, setIsDragging] = useState(false);
  const cmInstanceRef = useRef(null);
  const workspaceRef = useRef(null);

  // Fetch problem (with sessionStorage cache for instant load)
  useEffect(() => {
    const fetchProblem = async () => {
      // 1. Instantly seed from cache (populated when clicking from dashboard)
      const cached = sessionStorage.getItem(`problem_${slug}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setProblem(parsed);
          setIsLoading(false);
        } catch (_) {}
      }

      // 2. Fetch full data (description, examples) from API in background
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/problems/${slug}`);
        const data = await res.json();
        if (data && data.title) {
          setProblem(data);
          sessionStorage.setItem(`problem_${slug}`, JSON.stringify(data));
        }
      } catch (err) {
        console.error('Failed to fetch problem', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProblem();
  }, [slug]);

  // Drag-to-resize listener
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

  // ── DERIVED VALUES ────────────────────────────────────────────────────────
  const isLeftCollapsed  = leftWidthPct === 0;
  const isRightCollapsed = leftWidthPct === 100;
  const actualLeftWidth  = isLeftCollapsed
    ? '40px'
    : isRightCollapsed
      ? 'calc(100% - 40px)'
      : `${leftWidthPct}%`;

  const handleMouseDown = (e) => { e.preventDefault(); setIsDragging(true); };

  // ── EARLY RETURNS (after all hooks) ──────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0d1117', color: '#fff' }}>
        <h2>Loading Problem...</h2>
      </div>
    );
  }

  if (!problem) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0d1117', color: '#fff', flexDirection: 'column' }}>
        <h2>Problem not found</h2>
        <button onClick={() => navigate('/problems')} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#2ea043', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#010409', color: '#c9d1d9', overflow: 'hidden' }}>

      {/* SLIM TOP BAR */}
      <div style={{ height: '40px', backgroundColor: '#161b22', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', padding: '0 20px', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/problems')}
          style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '500' }}
        >
          <i className="ri-arrow-left-s-line"></i> Dashboard
        </button>
      </div>

      {/* WORKSPACE AREA */}
      <div
        ref={workspaceRef}
        style={{
          display: 'flex',
          flexGrow: 1,
          overflow: 'hidden',
          userSelect: isDragging ? 'none' : 'auto',
          cursor: isDragging ? 'col-resize' : 'auto',
        }}
      >
        {/* ── LEFT PANE ── */}
        <div style={{
          width: actualLeftWidth,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d1117',
          transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {isLeftCollapsed ? (
            <div
              style={{ height: '100%', writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#8b949e', cursor: 'pointer', backgroundColor: '#161b22', borderRight: '1px solid #30363d' }}
              onClick={() => setLeftWidthPct(45)}
            >
              <i className="ri-book-read-line" style={{ fontSize: '16px' }}></i>
              <span style={{ fontSize: '13px', letterSpacing: '1px' }}>Description</span>
            </div>
          ) : (
            <>
              {/* PROBLEM HEADER */}
              <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#fff', lineHeight: '1.3' }}>
                    {problem.problemNumber}. {problem.title}
                  </h1>
                  <button style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: '20px', flexShrink: 0, marginLeft: '10px' }}>
                    <i className="ri-star-line"></i>
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <span className={`panel-difficulty ${problem.difficulty?.toLowerCase()}`}>{problem.difficulty}</span>
                  {problem.tags && problem.tags.map(tag => (
                    <span key={tag} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', color: '#8b949e' }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* TABS */}
              <div style={{ display: 'flex', borderBottom: '1px solid #21262d', backgroundColor: '#0d1117', padding: '0 20px', flexShrink: 0 }}>
                <button
                  onClick={() => setActiveTab('desc')}
                  style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'desc' ? '2px solid #58a6ff' : '2px solid transparent', color: activeTab === 'desc' ? '#c9d1d9' : '#8b949e', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="ri-book-read-line"></i> Description
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: activeTab === 'ai' ? '2px solid #58a6ff' : '2px solid transparent', color: activeTab === 'ai' ? '#c9d1d9' : '#8b949e', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="ri-sparkling-fill" style={{ color: '#d2a8ff' }}></i> AI Tutor
                </button>
              </div>

              {/* TAB CONTENT */}
              <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }}>
                {activeTab === 'desc' ? (
                  <div>
                    <p style={{ color: '#c9d1d9', lineHeight: '1.7', fontSize: '14px', margin: '0 0 24px' }}
                       dangerouslySetInnerHTML={{ __html: (problem.description || 'Loading description...').replace(/\n/g, '<br/>') }}
                    />

                    {problem.examples && problem.examples.length > 0 && (
                      <div style={{ marginBottom: '28px' }}>
                        <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>Examples</h3>
                        {problem.examples.map((ex, idx) => (
                          <div key={idx} style={{ marginBottom: '16px' }}>
                            <p style={{ color: '#8b949e', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Example {idx + 1}:</p>
                            <div style={{ backgroundColor: 'rgba(22, 27, 34, 0.7)', padding: '14px 16px', borderRadius: '8px', border: '1px solid #21262d', fontFamily: '"Fira Code", monospace', fontSize: '13px', lineHeight: '1.7' }}>
                              <div><strong style={{ color: '#8b949e', fontWeight: '500' }}>Input: </strong><span style={{ color: '#c9d1d9' }}>{(ex.input || '').trim()}</span></div>
                              <div><strong style={{ color: '#8b949e', fontWeight: '500' }}>Output: </strong><span style={{ color: '#c9d1d9' }}>{(ex.output || '').trim()}</span></div>
                              {ex.explanation && <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #30363d' }}><strong style={{ color: '#8b949e', fontWeight: '500' }}>Explanation: </strong><span style={{ color: '#c9d1d9' }}>{ex.explanation.trim()}</span></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(problem.timeComplexity || problem.spaceComplexity) && (
                      <div>
                        <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Complexity</h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1, backgroundColor: 'rgba(22, 27, 34, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid #21262d', textAlign: 'center' }}>
                            <div style={{ color: '#8b949e', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</div>
                            <div style={{ fontFamily: 'monospace', color: '#d2a8ff', fontSize: '14px' }}>{problem.timeComplexity || 'O(n)'}</div>
                          </div>
                          <div style={{ flex: 1, backgroundColor: 'rgba(22, 27, 34, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid #21262d', textAlign: 'center' }}>
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

        {/* ── RESIZER ── */}
        <div
          onMouseDown={handleMouseDown}
          onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.backgroundColor = '#58a6ff'; }}
          onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.backgroundColor = '#21262d'; }}
          style={{
            width: '6px',
            backgroundColor: isDragging ? '#3b82f6' : '#21262d',
            cursor: 'col-resize',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s',
            zIndex: 10,
          }}
        >
          <div style={{ width: '2px', height: '32px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '2px' }}></div>
        </div>

        {/* ── RIGHT PANE ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d1117',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          {isRightCollapsed ? (
            <div
              style={{ height: '100%', writingMode: 'vertical-rl', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#8b949e', cursor: 'pointer', backgroundColor: '#161b22', borderLeft: '1px solid #30363d' }}
              onClick={() => setLeftWidthPct(45)}
            >
              <i className="ri-code-line" style={{ fontSize: '16px' }}></i>
              <span style={{ fontSize: '13px', letterSpacing: '1px' }}>Code Editor</span>
            </div>
          ) : (
            <CodeEditor problem={problem} isActive={true} cmInstanceRef={cmInstanceRef} />
          )}
        </div>

      </div>
    </div>
  );
}
