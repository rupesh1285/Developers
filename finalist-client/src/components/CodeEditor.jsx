import React, { useState, useEffect, useRef } from 'react';

const editorStyles = `
  /* Force CodeMirror to respect flex container and hide scrollbars */
  .CodeMirror { min-height: 0 !important; height: 100% !important; border: none !important; }
  .CodeMirror-scroll { min-height: 0 !important; height: 100% !important; overflow-x: hidden !important; overflow-y: auto !important; }
  .CodeMirror-vscrollbar { width: 4px !important; }
  .CodeMirror-hscrollbar { display: none !important; }
  .CodeMirror-lines { padding: 4px 0 !important; }

  /* Mark as Solved button */
  .ws-solve-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 14px; border-radius: 6px; border: 1px solid;
    font-size: 12px; font-weight: 600; cursor: pointer;
    transition: all 0.2s; white-space: nowrap;
  }
  .ws-solve-btn.solved {
    background: rgba(63,185,80,0.12); border-color: #3fb950; color: #3fb950;
  }
  .ws-solve-btn.solved:hover { background: rgba(63,185,80,0.22); }
  .ws-solve-btn.unsolved {
    background: transparent; border-color: rgba(255,255,255,0.12); color: #8b949e;
  }
  .ws-solve-btn.unsolved:hover { border-color: #3fb950; color: #3fb950; background: rgba(63,185,80,0.08); }

  /* Premium Run button - Blue/Purple gradient */
  .ws-run-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 14px; border-radius: 6px; border: none;
    font-size: 11px; font-weight: 700; cursor: pointer;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: #fff; transition: all 0.2s; letter-spacing: 0.3px;
    box-shadow: 0 0 0 rgba(59, 130, 246, 0);
  }
  .ws-run-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
    box-shadow: 0 0 12px rgba(139, 92, 246, 0.3);
    transform: translateY(-1px);
  }
  .ws-run-btn:disabled { background: #21262d; color: #484f58; cursor: not-allowed; box-shadow: none; transform: none; }

  /* IDE header */
  .ws-ide-header {
    display: flex; align-items: center; gap: 10px; padding: 0 14px;
    height: 32px; flex-shrink: 0;
    background: rgba(13, 17, 23, 0.8); border-bottom: 1px solid #21262d;
    margin: 0;
  }
  .ws-ide-header .header-title {
    display: flex; align-items: center; gap: 6px;
    color: #484f58; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;
    padding-right: 10px; border-right: 1px solid #21262d;
  }
  .ws-ide-header .header-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
`;

export default React.memo(function CodeEditor({ problem, isActive, cmInstanceRef, isSolved, onToggleSolved }) {
  // 🌟 GLOBAL LANG: Default to the global preference, then the problem-specific one
  const getInitialLang = () => {
    return localStorage.getItem('finalist_global_lang') || localStorage.getItem(`finalist_lang_${problem?._id}`) || 'javascript';
  };
  const [language, setLanguage] = useState(getInitialLang());
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [runError, setRunError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);

  // Vertical resizer between editor and console
  const [editorHeightPct, setEditorHeightPct] = useState(65);
  const [isConsoleResizing, setIsConsoleResizing] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const rightPaneRef = useRef(null);
  const editorRef = useRef(null);
  const codeCacheRef = useRef({});
  const langPillRef = useRef(null);

  // Derived collapse states — snap precisely at 0/100, strips now 32px
  const isEditorCollapsed  = editorHeightPct < 1;
  const isConsoleCollapsed = editorHeightPct > 99;
  const editorFlex  = isEditorCollapsed  ? '0 0 32px' : isConsoleCollapsed ? '1 1 0' : `${editorHeightPct} 1 0`;
  const consoleFlex = isConsoleCollapsed ? '0 0 32px' : isEditorCollapsed  ? '1 1 0' : `${100 - editorHeightPct} 1 0`;

  const LANG_MAP = {
    "javascript": "JavaScript", "python": "Python",
    "text/x-csrc": "C", "text/x-c++src": "C++", "text/x-java": "Java"
  };
  const BOILERPLATES = {
    "javascript": `/**\n * Problem: ${problem?.title}\n */\n\nfunction solve() {\n    // Write your logic here\n    \n}\n\n// Execute the solution\nsolve();`,
    
    "python": `# Problem: ${problem?.title}\n\ndef solve():\n    # Write your logic here\n    pass\n\nif __name__ == "__main__":\n    solve()`,
    
    "text/x-csrc": `/**\n * Problem: ${problem?.title}\n */\n#include <stdio.h>\n\nvoid solve() {\n    // Write your logic here\n    \n}\n\nint main() {\n    solve();\n    return 0;\n}`,
    
    "text/x-c++src": `#include <iostream>\nusing namespace std;\n\n/**\n * Problem: ${problem?.title}\n */\n\nvoid solve() {\n    // Write your logic here\n    \n}\n\nint main() {\n    solve();\n    return 0;\n}`,
    
    "text/x-java": `/**\n * Problem: ${problem?.title}\n */\n\npublic class Solution {\n    public void solve() {\n        // Write your logic here\n        \n    }\n\n    public static void main(String[] args) {\n        Solution sol = new Solution();\n        sol.solve();\n    }\n}`
  };

  useEffect(() => {
    if (!problem) return;
    const savedCode = localStorage.getItem(`finalist_code_${problem._id}`);
    let cache = {};
    try { cache = JSON.parse(savedCode || '{}'); if (typeof cache !== 'object' || !cache) cache = { javascript: savedCode }; }
    catch (e) { cache = { javascript: savedCode }; }
    codeCacheRef.current = cache;
  }, [problem]);

  useEffect(() => {
    if (!editorRef.current || !window.CodeMirror) return;
    if (cmInstanceRef.current) { try { cmInstanceRef.current.toTextArea(); } catch (e) {} cmInstanceRef.current = null; }
    const token = localStorage.getItem('token');
    cmInstanceRef.current = window.CodeMirror.fromTextArea(editorRef.current, {
      mode: language, theme: "dracula", lineNumbers: true, autoCloseBrackets: true, indentUnit: 4, lineWrapping: true
    });
    const initialCode = codeCacheRef.current[language] || BOILERPLATES[language] || BOILERPLATES["javascript"];
    cmInstanceRef.current.setValue(initialCode);
    cmInstanceRef.current.clearHistory();
    let saveTimeout;
    cmInstanceRef.current.on("change", () => {
      codeCacheRef.current[language] = cmInstanceRef.current.getValue();
      const jsonCache = JSON.stringify(codeCacheRef.current);
      localStorage.setItem(`finalist_code_${problem?._id}`, jsonCache);
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        try { await fetch(`${import.meta.env.VITE_API_URL}/api/workspace/code/${problem?._id}`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token }, body: JSON.stringify({ code: jsonCache }) }); } catch (e) {}
      }, 1500);
    });
    return () => { if (cmInstanceRef.current) { try { cmInstanceRef.current.toTextArea(); } catch (e) {} cmInstanceRef.current = null; } };
  }, [language, problem, cmInstanceRef]);

  // Refresh CodeMirror when uncollapsing
  useEffect(() => {
    if (!isEditorCollapsed && cmInstanceRef.current) {
      setTimeout(() => {
        cmInstanceRef.current.refresh();
      }, 50);
    }
  }, [isEditorCollapsed]);

  useEffect(() => {
    const handleClickOutside = (e) => { if (langPillRef.current && !langPillRef.current.contains(e.target)) setLangMenuOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Vertical console resizer
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isConsoleResizing || !rightPaneRef.current) return;
      const rect = rightPaneRef.current.getBoundingClientRect();
      // Subtract the 32px header height
      const relY = e.clientY - rect.top - 32;
      const availH = rect.height - 32;
      let pct = (relY / availH) * 100;
      if (pct < 2) pct = 0;
      else if (pct > 98) pct = 100;
      setEditorHeightPct(pct);
    };
    const handleMouseUp = () => { if (isConsoleResizing) setIsConsoleResizing(false); };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [isConsoleResizing]);

  const handleLangChange = (newLang) => {
    if (!cmInstanceRef.current) return;
    codeCacheRef.current[language] = cmInstanceRef.current.getValue();
    localStorage.setItem(`finalist_code_${problem?._id}`, JSON.stringify(codeCacheRef.current));
    setLanguage(newLang);
    localStorage.setItem(`finalist_lang_${problem?._id}`, newLang);
    localStorage.setItem('finalist_global_lang', newLang); // 🌟 Update global preference
    setLangMenuOpen(false);
  };

  const handleRunCode = async () => {
    if (!cmInstanceRef.current) return;
    let backendLang = language;
    if (language === 'text/x-c++src') backendLang = 'cpp';
    else if (language === 'text/x-csrc') backendLang = 'c';
    if (backendLang !== 'cpp') {
      setRunError(`'${LANG_MAP[language]}' not supported yet. Use C++ for Phase 1.`);
      setOutput(null); setExecutionTime(null); return;
    }
    setIsRunning(true); setRunError(null); setOutput(null); setExecutionTime(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ language: backendLang, code: cmInstanceRef.current.getValue() })
      });
      const data = await response.json();
      if (data.success) { setOutput(data.output); setExecutionTime(data.executionTime); }
      else { setRunError(data.error); setOutput(data.output); }
    } catch (err) { setRunError("Network error: " + err.message); }
    finally { setIsRunning(false); }
  };

  const handleResetCode = () => {
    setIsResetModalOpen(true);
  };

  const confirmReset = () => {
    const defaultCode = BOILERPLATES[language] || BOILERPLATES["javascript"];
    if (cmInstanceRef.current) {
      cmInstanceRef.current.setValue(defaultCode);
    }
    codeCacheRef.current[language] = defaultCode;
    localStorage.setItem(`finalist_code_${problem?._id}`, JSON.stringify(codeCacheRef.current));
    setIsResetModalOpen(false);
  };

  return (
    <>
      <style>{editorStyles}</style>
      <div ref={rightPaneRef} 
        style={{ backgroundColor: '#0d1117', display: 'flex', flexDirection: 'column', height: '100%', width: '100%', userSelect: isConsoleResizing ? 'none' : 'auto', overflow: 'hidden', margin: 0, padding: 0 }}>

        {/* ── IDE HEADER (HIDDEN IF COLLAPSED) ── */}
        <div className="ws-ide-header" style={{ display: isEditorCollapsed ? 'none' : 'flex' }}>
          <div className="header-title">
            <i className="ri-code-s-slash-line" style={{ fontSize: '13px', color: '#58a6ff' }}></i>
            Code Space
          </div>
          <div ref={langPillRef} className={`v2-pill ${langMenuOpen ? 'active' : ''}`}
            style={{ height: '22px', padding: '0 8px' }}
            onClick={() => setLangMenuOpen(!langMenuOpen)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLangMenuOpen(!langMenuOpen); } }}>
            <span className="v2-pill-text" style={{ fontSize: '11px' }}>{LANG_MAP[language] || 'JavaScript'}</span>
            <i className="ri-arrow-down-s-line v2-pill-icon" style={{ fontSize: '12px' }}></i>
            <div className="v2-dropdown" style={{ top: '26px' }}>
              {Object.entries(LANG_MAP).map(([val, label]) => (
                <button key={val} className="v2-dropdown-item" type="button"
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                  onClick={(e) => { e.stopPropagation(); handleLangChange(val); }}>{label}</button>
              ))}
            </div>
          </div>
          <div className="header-right">
            <button className={`ws-solve-btn ${isSolved ? 'solved' : 'unsolved'}`}
              style={{ padding: '4px 12px', fontSize: '11px' }} onClick={onToggleSolved}>
              <i className={isSolved ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} style={{ fontSize: '13px' }}></i>
              {isSolved ? 'Solved' : 'Mark Solved'}
            </button>
            <button 
              className="ws-run-btn" 
              style={{ background: 'transparent', border: '1px solid #21262d', color: '#8b949e', padding: '4px 8px' }} 
              onClick={handleResetCode}
              title="Reset to Default Code"
            >
              <i className="ri-refresh-line"></i>
            </button>
            <button className="ws-run-btn" onClick={handleRunCode} disabled={isRunning}>
              <i className={isRunning ? 'ri-loader-4-line ri-spin' : 'ri-play-fill'}></i>
              {isRunning ? 'Running…' : 'Run Code'}
            </button>
          </div>
        </div>

        {/* ── CODE EDITOR AREA ── */}
        <div style={{ flex: editorFlex, overflow: 'hidden', minHeight: 0, transition: isConsoleResizing ? 'none' : 'flex 0.2s ease', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* THE STRIP (ONLY VISIBLE IF COLLAPSED) */}
          <div onClick={() => setEditorHeightPct(65)}
            style={{ display: isEditorCollapsed ? 'flex' : 'none', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#484f58', cursor: 'pointer', borderBottom: '1px solid #21262d', transition: 'all 0.2s', backgroundColor: 'rgba(13, 17, 23, 0.8)', zIndex: 20 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.backgroundColor = 'rgba(22, 27, 34, 0.9)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#484f58'; e.currentTarget.style.backgroundColor = 'rgba(13, 17, 23, 0.8)'; }}>
            <i className="ri-code-s-slash-line" style={{ fontSize: '14px' }}></i>
            <span style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center' }}>Code Space</span>
          </div>

          {/* THE EDITOR (HIDDEN IF COLLAPSED BUT STAYS IN DOM) */}
          <div style={{ display: isEditorCollapsed ? 'none' : 'flex', flex: 1, position: 'relative', minHeight: 0 }}>
            <textarea ref={editorRef} id={`cm-editor-${problem._id}`} style={{ opacity: 0 }}></textarea>
          </div>
        </div>

        {/* ── HORIZONTAL RESIZER ── */}
        <div
          onMouseDown={(e) => { e.preventDefault(); setIsConsoleResizing(true); }}
          style={{ height: '10px', flexShrink: 0, cursor: 'row-resize', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '-2px 0',
            background: isConsoleResizing
              ? 'linear-gradient(to right, transparent, rgba(88,166,255,0.3) 30%, rgba(88,166,255,0.3) 70%, transparent)'
              : 'linear-gradient(to right, transparent, rgba(88,166,255,0.07) 30%, rgba(88,166,255,0.07) 70%, transparent)',
            transition: 'background 0.2s' }}
          onMouseEnter={e => { if (!isConsoleResizing) e.currentTarget.style.background = 'linear-gradient(to right, transparent, rgba(88,166,255,0.2) 30%, rgba(88,166,255,0.2) 70%, transparent)'; }}
          onMouseLeave={e => { if (!isConsoleResizing) e.currentTarget.style.background = 'linear-gradient(to right, transparent, rgba(88,166,255,0.07) 30%, rgba(88,166,255,0.07) 70%, transparent)'; }}
        >
          <div style={{ height: '2px', width: isConsoleResizing ? '64px' : '40px', borderRadius: '2px', transition: 'all 0.2s',
            background: isConsoleResizing ? 'rgba(88,166,255,0.7)' : 'rgba(255,255,255,0.12)',
            boxShadow: isConsoleResizing ? '0 0 8px rgba(88,166,255,0.5)' : 'none' }}></div>
        </div>

        {/* ── CONSOLE ── */}
        <div style={{ flex: consoleFlex, overflow: 'hidden', minHeight: 0, transition: isConsoleResizing ? 'none' : 'flex 0.2s ease', display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117' }}>
          {isConsoleCollapsed ? (
            <div onClick={() => setEditorHeightPct(65)}
              style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#484f58', cursor: 'pointer', borderTop: '1px solid #21262d', transition: 'all 0.2s', backgroundColor: 'rgba(13, 17, 23, 0.8)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.backgroundColor = 'rgba(22, 27, 34, 0.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#484f58'; e.currentTarget.style.backgroundColor = 'rgba(13, 17, 23, 0.8)'; }}>
              <i className="ri-terminal-line" style={{ fontSize: '14px' }}></i>
              <span style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Output Console</span>
            </div>
          ) : (
            <>
              <div style={{ padding: '4px 14px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, height: '32px' }}>
                <i className="ri-terminal-line" style={{ color: '#58a6ff', fontSize: '12px' }}></i>
                <span style={{ fontWeight: 700, fontSize: '9px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '1px' }}>Output Console</span>
                {executionTime !== null && (
                  <span style={{ marginLeft: 'auto', color: '#3fb950', fontSize: '10px', fontFamily: 'monospace', background: 'rgba(63,185,80,0.08)', padding: '0px 6px', borderRadius: '10px', border: '1px solid rgba(63,185,80,0.2)' }}>
                    ✓ {executionTime}ms
                  </span>
                )}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', fontFamily: '"Fira Code", monospace', fontSize: '13px', lineHeight: '1.6' }}>
                {isRunning && <div style={{ color: '#8b949e', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="ri-loader-4-line ri-spin"></i> Executing in Docker...</div>}
                {!isRunning && !output && !runError && <div style={{ color: '#484f58' }}>Run your code to see output here.</div>}
                {output && <pre style={{ whiteSpace: 'pre-wrap', color: '#3fb950', margin: 0 }}>{output}</pre>}
                {runError && <pre style={{ whiteSpace: 'pre-wrap', color: '#f85149', margin: 0 }}>{runError}</pre>}
              </div>
            </>
          )}
        </div>

        {/* ── CUSTOM RESET MODAL ── */}
        {isResetModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ backgroundColor: '#0d1117', border: '1px solid #21262d', borderRadius: '16px', padding: '30px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(248, 81, 73, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(248, 81, 73, 0.2)' }}>
                <i className="ri-refresh-line" style={{ fontSize: '30px', color: '#f85149' }}></i>
              </div>
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Reset Code Space?</h3>
              <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                This will erase all your current work for <strong style={{ color: '#58a6ff' }}>{LANG_MAP[language]}</strong> and restore the default boilerplate.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setIsResetModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #21262d', backgroundColor: 'transparent', color: '#c9d1d9', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  Cancel
                </button>
                <button onClick={confirmReset} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#f85149', color: '#fff', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(248, 81, 73, 0.3)' }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>
                  Yes, Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
});