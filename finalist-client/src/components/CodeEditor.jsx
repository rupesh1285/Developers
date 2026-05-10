import React, { useState, useEffect, useRef } from 'react';

export default React.memo(function CodeEditor({ problem, isActive, cmInstanceRef }) {
  const [language, setLanguage] = useState(localStorage.getItem(`finalist_lang_${problem?._id}`) || 'javascript');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Code runner states
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [runError, setRunError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);

  // Vertical split between editor and console
  const [editorHeightPct, setEditorHeightPct] = useState(65);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isConsoleResizing, setIsConsoleResizing] = useState(false);
  const rightPaneRef = useRef(null);

  const editorRef = useRef(null);
  const codeCacheRef = useRef({});
  const langPillRef = useRef(null);

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

  useEffect(() => {
    if (!problem) return;
    const savedCode = localStorage.getItem(`finalist_code_${problem._id}`);
    let cache = {};
    try {
      cache = JSON.parse(savedCode || '{}');
      if (typeof cache !== 'object' || !cache) cache = { "javascript": savedCode };
    } catch (e) { cache = { "javascript": savedCode }; }
    codeCacheRef.current = cache;
  }, [problem]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (!window.CodeMirror) return;

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

    let saveTimeout;
    cmInstanceRef.current.on("change", () => {
      const currentLang = language;
      codeCacheRef.current[currentLang] = cmInstanceRef.current.getValue();
      const jsonCache = JSON.stringify(codeCacheRef.current);
      localStorage.setItem(`finalist_code_${problem?._id}`, jsonCache);

      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        try {
          await fetch(`${import.meta.env.VITE_API_URL}/api/workspace/code/${problem?._id}`, {
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
  }, [language, problem, cmInstanceRef]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langPillRef.current && !langPillRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Vertical resizer between editor and console
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isConsoleResizing || !rightPaneRef.current) return;
      const rect = rightPaneRef.current.getBoundingClientRect();
      let newPct = ((e.clientY - rect.top) / rect.height) * 100;
      if (newPct < 5) { newPct = 0; setIsEditorCollapsed(true); setIsConsoleCollapsed(false); }
      else if (newPct > 95) { newPct = 100; setIsConsoleCollapsed(true); setIsEditorCollapsed(false); }
      else { setIsEditorCollapsed(false); setIsConsoleCollapsed(false); }
      setEditorHeightPct(newPct);
    };
    const handleMouseUp = () => { if (isConsoleResizing) setIsConsoleResizing(false); };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isConsoleResizing]);

  const handleLangChange = (newLang) => {
    if (!cmInstanceRef.current) return;
    codeCacheRef.current[language] = cmInstanceRef.current.getValue();
    localStorage.setItem(`finalist_code_${problem?._id}`, JSON.stringify(codeCacheRef.current));
    setLanguage(newLang);
    localStorage.setItem(`finalist_lang_${problem?._id}`, newLang);
    setLangMenuOpen(false);
  };

  const handleRunCode = async () => {
    if (!cmInstanceRef.current) return;
    let backendLang = language;
    if (language === 'text/x-c++src') backendLang = 'cpp';
    else if (language === 'text/x-csrc') backendLang = 'c';
    if (backendLang !== 'cpp') {
      setRunError(`Language '${LANG_MAP[language]}' is not supported yet. Please select C++ for Phase 1.`);
      setOutput(null); setExecutionTime(null);
      return;
    }
    setIsRunning(true); setRunError(null); setOutput(null); setExecutionTime(null);
    try {
      const token = localStorage.getItem('token');
      const currentCode = cmInstanceRef.current.getValue();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ language: backendLang, code: currentCode })
      });
      const data = await response.json();
      if (data.success) { setOutput(data.output); setExecutionTime(data.executionTime); }
      else { setRunError(data.error); setOutput(data.output); }
    } catch (err) {
      setRunError("Network error or server is down: " + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const editorHeight = isEditorCollapsed ? '40px' : isConsoleCollapsed ? 'calc(100% - 40px)' : `${editorHeightPct}%`;
  const consoleHeight = isConsoleCollapsed ? '40px' : isEditorCollapsed ? 'calc(100% - 40px)' : `${100 - editorHeightPct}%`;

  return (
    <div
      ref={rightPaneRef}
      className={`tab-pane ${isActive ? 'active' : ''}`}
      style={{ backgroundColor: '#0d1117', display: 'flex', flexDirection: 'column', height: '100%', userSelect: isConsoleResizing ? 'none' : 'auto' }}
    >
      {/* IDE HEADER */}
      <div className="ide-header" style={{ backgroundColor: '#0d1117', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div
          ref={langPillRef}
          className={`v2-pill ${langMenuOpen ? 'active' : ''}`}
          onClick={() => setLangMenuOpen(!langMenuOpen)}
          role="button" tabIndex={0} aria-expanded={langMenuOpen} aria-label="Select language"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLangMenuOpen(!langMenuOpen); } }}
        >
          <i className="ri-code-s-slash-line v2-pill-icon"></i>
          <span className="v2-pill-text" data-value={language}>{LANG_MAP[language] || 'JavaScript'}</span>
          <i className="ri-arrow-down-s-line v2-pill-icon"></i>
          <div className="v2-dropdown">
            <button className="v2-dropdown-item" type="button" onClick={(e) => { e.stopPropagation(); handleLangChange('javascript'); }}>JavaScript</button>
            <button className="v2-dropdown-item" type="button" onClick={(e) => { e.stopPropagation(); handleLangChange('python'); }}>Python</button>
            <button className="v2-dropdown-item" type="button" onClick={(e) => { e.stopPropagation(); handleLangChange('text/x-csrc'); }}>C</button>
            <button className="v2-dropdown-item" type="button" onClick={(e) => { e.stopPropagation(); handleLangChange('text/x-c++src'); }}>C++</button>
            <button className="v2-dropdown-item" type="button" onClick={(e) => { e.stopPropagation(); handleLangChange('text/x-java'); }}>Java</button>
          </div>
        </div>

        <button
          onClick={handleRunCode} disabled={isRunning}
          style={{ backgroundColor: isRunning ? '#3a3f4b' : '#238636', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: '6px', fontWeight: '600', cursor: isRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '12px', fontSize: '13px', transition: 'background-color 0.2s' }}
        >
          <i className={isRunning ? "ri-loader-4-line ri-spin" : "ri-play-fill"}></i>
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </div>

      {/* CODE EDITOR */}
      <div style={{ height: editorHeight, overflow: 'hidden', flexShrink: 0, transition: isConsoleResizing ? 'none' : 'height 0.25s ease', position: 'relative' }}>
        {isEditorCollapsed ? (
          <div
            style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#8b949e', cursor: 'pointer', backgroundColor: '#0d1117', borderBottom: '1px solid #21262d' }}
            onClick={() => { setIsEditorCollapsed(false); setIsConsoleCollapsed(false); setEditorHeightPct(65); }}
          >
            <i className="ri-code-s-slash-line"></i>
            <span style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Code Editor</span>
          </div>
        ) : (
          <textarea ref={editorRef} id={`cm-editor-${problem._id}`} style={{ opacity: 0, backgroundColor: '#0d1117', color: '#f8f8f2' }}></textarea>
        )}
      </div>

      {/* HORIZONTAL RESIZER */}
      <div
        onMouseDown={(e) => { e.preventDefault(); setIsConsoleResizing(true); }}
        onMouseEnter={(e) => { if (!isConsoleResizing) e.currentTarget.style.backgroundColor = '#58a6ff'; }}
        onMouseLeave={(e) => { if (!isConsoleResizing) e.currentTarget.style.backgroundColor = '#21262d'; }}
        style={{ height: '6px', backgroundColor: isConsoleResizing ? '#3b82f6' : '#21262d', cursor: 'row-resize', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s', zIndex: 10 }}
      >
        <div style={{ width: '32px', height: '2px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '2px' }}></div>
      </div>

      {/* CONSOLE PANEL */}
      <div style={{ height: consoleHeight, overflow: 'hidden', transition: isConsoleResizing ? 'none' : 'height 0.25s ease', display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117' }}>
        {isConsoleCollapsed ? (
          <div
            style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#8b949e', cursor: 'pointer', backgroundColor: '#0d1117', borderTop: '1px solid #21262d' }}
            onClick={() => { setIsConsoleCollapsed(false); setIsEditorCollapsed(false); setEditorHeightPct(65); }}
          >
            <i className="ri-terminal-line"></i>
            <span style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Output Console</span>
          </div>
        ) : (
          <>
            <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <i className="ri-terminal-line" style={{ color: '#8b949e', fontSize: '14px' }}></i>
              <span style={{ fontWeight: '600', fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Output Console</span>
              {executionTime !== null && (
                <span style={{ marginLeft: 'auto', color: '#3fb950', fontSize: '11px', fontFamily: 'monospace' }}>
                  ✓ {executionTime}ms
                </span>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', fontFamily: '"Fira Code", monospace', fontSize: '13px', lineHeight: '1.6' }}>
              {isRunning && <div style={{ color: '#8b949e', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="ri-loader-4-line ri-spin"></i> Executing in Docker container...</div>}
              {!isRunning && !output && !runError && (
                <div style={{ color: '#484f58' }}>Run your code to see output here.</div>
              )}
              {output && <pre style={{ whiteSpace: 'pre-wrap', color: '#3fb950', margin: 0 }}>{output}</pre>}
              {runError && <pre style={{ whiteSpace: 'pre-wrap', color: '#f85149', margin: 0 }}>{runError}</pre>}
            </div>
          </>
        )}
      </div>
    </div>
  );
});