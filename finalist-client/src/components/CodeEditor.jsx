import React, { useState, useEffect, useRef } from 'react';

export default React.memo(function CodeEditor({ problem, isActive, cmInstanceRef }) {
  const [language, setLanguage] = useState(localStorage.getItem(`finalist_lang_${problem?._id}`) || 'javascript');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  
  // Code runner states
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [runError, setRunError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
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

  // Load code cache
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

  // Initialize CodeMirror (🌟 FIX: Removed isActive block so it stays alive in background)
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
    // 🌟 FIX: Removed isActive from dependency array
  }, [language, problem, cmInstanceRef]);

  // Click outside for language menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langPillRef.current && !langPillRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    
    // Normalize language string for backend
    let backendLang = language;
    if (language === 'text/x-c++src') backendLang = 'cpp';
    else if (language === 'text/x-csrc') backendLang = 'c';
    
    if (backendLang !== 'cpp') {
        setRunError(`Language '${LANG_MAP[language]}' is not supported yet. Please select C++ for Phase 1.`);
        setOutput(null);
        setExecutionTime(null);
        return;
    }

    setIsRunning(true);
    setRunError(null);
    setOutput(null);
    setExecutionTime(null);

    try {
        const token = localStorage.getItem('token');
        const currentCode = cmInstanceRef.current.getValue();
        
        // VITE_API_URL or fallback to localhost:5000
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        const response = await fetch(`${apiUrl}/api/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                language: backendLang,
                code: currentCode
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            setOutput(data.output);
            setExecutionTime(data.executionTime);
        } else {
            setRunError(data.error);
            setOutput(data.output);
        }
    } catch (err) {
        setRunError("Network error or server is down: " + err.message);
    } finally {
        setIsRunning(false);
    }
  };

  return (
    <div className={`tab-pane ${isActive ? 'active' : ''}`} id="tab-notes" style={{ backgroundColor: '#0d1117', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ide-header" style={{ backgroundColor: '#0d1117', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          ref={langPillRef}
          className={`lang-pill ${langMenuOpen ? 'active' : ''}`}
          onClick={() => setLangMenuOpen(!langMenuOpen)}
          role="button"
          tabIndex={0}
          aria-expanded={langMenuOpen}
          aria-label="Select language"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setLangMenuOpen(!langMenuOpen);
            }
          }}
        >            
          <div className="lang-pill-header">
            <i className="ri-code-s-slash-line"></i>
            <span className="lang-text" data-value={language}>{LANG_MAP[language] || 'JavaScript'}</span>
            <i className="ri-arrow-down-s-line chevron-icon"></i>
          </div>
          <div className="lang-menu">
            <button className="lang-item" type="button" data-value="javascript" onClick={(e) => { e.stopPropagation(); handleLangChange('javascript'); }}>JavaScript</button>
            <button className="lang-item" type="button" data-value="python" onClick={(e) => { e.stopPropagation(); handleLangChange('python'); }}>Python</button>
            <button className="lang-item" type="button" data-value="text/x-csrc" onClick={(e) => { e.stopPropagation(); handleLangChange('text/x-csrc'); }}>C</button>
            <button className="lang-item" type="button" data-value="text/x-c++src" onClick={(e) => { e.stopPropagation(); handleLangChange('text/x-c++src'); }}>C++</button>
            <button className="lang-item" type="button" data-value="text/x-java" onClick={(e) => { e.stopPropagation(); handleLangChange('text/x-java'); }}>Java</button>
          </div>
        </div>
        
        {/* RUN BUTTON */}
        <button 
          onClick={handleRunCode} 
          disabled={isRunning}
          style={{
            backgroundColor: isRunning ? '#3a3f4b' : '#2ea043',
            color: '#fff',
            border: 'none',
            padding: '6px 16px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginRight: '12px'
          }}
        >
          <i className={isRunning ? "ri-loader-4-line ri-spin" : "ri-play-fill"}></i>
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </div>
      
      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
        <textarea ref={editorRef} id={`cm-editor-${problem._id}`} style={{ opacity: 0, backgroundColor: '#0d1117', color: '#f8f8f2' }}></textarea>
      </div>

      {/* CONSOLE PANEL */}
      <div className="console-panel" style={{
        backgroundColor: '#161b22',
        borderTop: '1px solid #30363d',
        padding: '16px',
        minHeight: '150px',
        maxHeight: '300px',
        overflowY: 'auto',
        color: '#c9d1d9',
        fontFamily: 'monospace',
        fontSize: '13px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#8b949e' }}>Output Console</div>
        
        {isRunning && <div style={{ color: '#8b949e' }}>Executing code in Docker container...</div>}
        
        {!isRunning && !output && !runError && (
          <div style={{ color: '#484f58' }}>Run your code to see the output here.</div>
        )}

        {output && (
          <pre style={{ whiteSpace: 'pre-wrap', color: '#56d364', margin: '0 0 10px 0' }}>{output}</pre>
        )}

        {runError && (
          <pre style={{ whiteSpace: 'pre-wrap', color: '#f85149', margin: '0 0 10px 0' }}>{runError}</pre>
        )}

        {executionTime !== null && (
          <div style={{ color: '#8b949e', fontSize: '12px', marginTop: '10px' }}>
            Execution Time: {executionTime}ms
          </div>
        )}
      </div>
    </div>
  );
});