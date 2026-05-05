import React, { useState, useEffect, useRef } from 'react';
import CodeEditor from './CodeEditor'; // 🌟 Import the new child!
import AiTutor from './AiTutor';       // 🌟 Import the new child!

export default React.memo(function WorkspacePanel({ problem, isStarred, onToggleStar, onClose }) {
  const [activeTab, setActiveTab] = useState(localStorage.getItem("finalist_active_tab") || 'tab-desc');
  
  // 🌟 THE BRIDGE: This lets the AI read the code from the CodeEditor!
  const cmInstanceRef = useRef(null);

  useEffect(() => {
    if (problem) {
      setActiveTab('tab-desc');
      localStorage.setItem("finalist_active_tab", 'tab-desc');
    }
  }, [problem?._id]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("finalist_active_tab", tab);
    
    // Refresh CodeMirror when switching back to the code tab so it doesn't glitch
    if (tab === 'tab-notes' && cmInstanceRef.current) {
      setTimeout(() => { if (cmInstanceRef.current) cmInstanceRef.current.refresh(); }, 50);
    }
  };

  if (!problem) return null;

  return (
    <div className="workspace-content">
      <button className="mobile-close-btn" type="button" onClick={onClose} aria-label="Close workspace panel">
        <i className="ri-close-large-line" aria-hidden="true"></i>
      </button>
      
      <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div className="panel-title" style={{ fontSize: '24px', lineHeight: '1.3', fontWeight: 800, color: '#fff' }}>{problem.title}</div>
        <div className="panel-actions" style={{ marginTop: '4px', flexShrink: 0 }}>
          <div className={`panel-difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</div>
          <button
            className="panel-star"
            id="panel-star-btn"
            type="button"
            data-id={problem._id}
            onClick={(e) => onToggleStar(e, String(problem._id))}
            aria-pressed={isStarred}
            aria-label={isStarred ? "Remove from starred" : "Add to starred"}
          >
            <i className={isStarred ? 'ri-star-fill' : 'ri-star-line'} aria-hidden="true"></i>
          </button>
        </div>
      </div>

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

      {/* 🌟 THE EXTRACTED COMPONENTS */}
      <CodeEditor 
        problem={problem} 
        isActive={activeTab === 'tab-notes'} 
        cmInstanceRef={cmInstanceRef} 
      />
      
      <AiTutor 
        problem={problem} 
        isActive={activeTab === 'tab-ai'} 
        cmInstanceRef={cmInstanceRef} 
      />
      
    </div>
  );
});