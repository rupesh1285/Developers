import React, { useState, useEffect, useRef } from 'react';

export default React.memo(function CodeEditor({ problem, isActive, cmInstanceRef }) {
  const [language, setLanguage] = useState(localStorage.getItem(`finalist_lang_${problem?._id}`) || 'javascript');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  
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

  return (
    <div className={`tab-pane ${isActive ? 'active' : ''}`} id="tab-notes" style={{ backgroundColor: '#0d1117' }}>
      <div className="ide-header" style={{ backgroundColor: '#0d1117' }}>
        <div ref={langPillRef} className={`lang-pill ${langMenuOpen ? 'active' : ''}`} onClick={() => setLangMenuOpen(!langMenuOpen)}>            
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
      
      <textarea ref={editorRef} id={`cm-editor-${problem._id}`} style={{ opacity: 0, backgroundColor: '#0d1117', color: '#f8f8f2' }}></textarea>
    </div>
  );
});