import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import AiTutor from '../components/AiTutor';
import '../dashboard.css';

export default function ProblemWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('desc'); // 'desc' or 'ai'
  
  const cmInstanceRef = useRef(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/problems/${id}`);
        const data = await res.json();
        setProblem(data);
      } catch (err) {
        console.error("Failed to fetch problem", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProblem();
  }, [id]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#010409', color: '#c9d1d9', overflow: 'hidden' }}>
      
      {/* HEADER BAR */}
      <div style={{ height: '50px', backgroundColor: '#161b22', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', padding: '0 20px', flexShrink: 0 }}>
        <button 
          onClick={() => navigate('/problems')} 
          style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', marginRight: '20px' }}
        >
          <i className="ri-arrow-left-line"></i> Back to Dashboard
        </button>
        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px' }}>{problem.title}</div>
        <div className={`panel-difficulty ${problem.difficulty?.toLowerCase()}`} style={{ marginLeft: '15px' }}>{problem.difficulty}</div>
      </div>

      {/* WORKSPACE AREA (40/60 SPLIT) */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* LEFT PANE (40%) */}
        <div style={{ width: '40%', borderRight: '1px solid #30363d', display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117' }}>
          
          {/* TABS */}
          <div style={{ display: 'flex', borderBottom: '1px solid #30363d', backgroundColor: '#161b22' }}>
            <button 
              onClick={() => setActiveTab('desc')}
              style={{ flex: 1, padding: '12px 0', background: activeTab === 'desc' ? '#0d1117' : 'transparent', border: 'none', borderBottom: activeTab === 'desc' ? '2px solid #58a6ff' : '2px solid transparent', color: activeTab === 'desc' ? '#c9d1d9' : '#8b949e', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <i className="ri-book-read-line"></i> Description
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              style={{ flex: 1, padding: '12px 0', background: activeTab === 'ai' ? '#0d1117' : 'transparent', border: 'none', borderBottom: activeTab === 'ai' ? '2px solid #58a6ff' : '2px solid transparent', color: activeTab === 'ai' ? '#c9d1d9' : '#8b949e', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <i className="ri-sparkling-fill" style={{ color: '#d2a8ff' }}></i> AI Tutor
            </button>
          </div>

          {/* TAB CONTENT AREA */}
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px' }}>
            {activeTab === 'desc' ? (
              <div className="tab-pane active" id="tab-desc" style={{ padding: 0 }}>
                <div className="details-block">
                  <p className="details-text" dangerouslySetInnerHTML={{ __html: (problem.description || '').replace(/\n/g, '<br/>') }}></p>
                </div>
                {problem.examples && problem.examples.length > 0 && (
                  <div className="details-block">
                    <span className="section-label">Examples</span>
                    {problem.examples.map((ex, idx) => (
                      <div key={idx} className="example-block" style={{ marginBottom: '15px' }}>
                        <div className="example-title" style={{ fontWeight: 'bold', marginBottom: '5px' }}>Example {idx + 1}:</div>
                        <div className="example-box" style={{ backgroundColor: '#161b22', padding: '12px', borderRadius: '6px', border: '1px solid #30363d' }}>
                          <div className="ex-row" style={{ marginBottom: '4px' }}><span style={{ color: '#8b949e', marginRight: '8px' }}>Input:</span><span style={{ color: '#58a6ff' }}>{ex.input ? ex.input.trim() : ''}</span></div>
                          <div className="ex-row" style={{ marginBottom: '4px' }}><span style={{ color: '#8b949e', marginRight: '8px' }}>Output:</span><span style={{ color: '#3fb950' }}>{ex.output ? ex.output.trim() : ''}</span></div>
                          {ex.explanation && <div className="ex-row" style={{ marginTop: '8px', borderTop: '1px solid #30363d', paddingTop: '8px' }}><span style={{ color: '#8b949e', marginRight: '8px' }}>Explanation:</span><span>{ex.explanation.trim()}</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="details-block" style={{ marginTop: '25px', marginBottom: '20px' }}>
                  <span className="section-label">Complexity Analysis</span>
                  <div className="complexity-grid" style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                    <div className="complexity-card" style={{ flex: 1, backgroundColor: '#161b22', padding: '10px', borderRadius: '6px', border: '1px solid #30363d', textAlign: 'center' }}>
                      <div style={{ color: '#8b949e', fontSize: '12px', marginBottom: '4px' }}>Time</div>
                      <div style={{ fontFamily: 'monospace', color: '#d2a8ff' }}>{problem.timeComplexity || 'O(n)'}</div>
                    </div>
                    <div className="complexity-card" style={{ flex: 1, backgroundColor: '#161b22', padding: '10px', borderRadius: '6px', border: '1px solid #30363d', textAlign: 'center' }}>
                      <div style={{ color: '#8b949e', fontSize: '12px', marginBottom: '4px' }}>Space</div>
                      <div style={{ fontFamily: 'monospace', color: '#ff7b72' }}>{problem.spaceComplexity || 'O(1)'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <AiTutor 
                  problem={problem} 
                  isActive={true} 
                  cmInstanceRef={cmInstanceRef} 
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE (60%) */}
        <div style={{ width: '60%', display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117' }}>
          <CodeEditor 
            problem={problem} 
            isActive={true} 
            cmInstanceRef={cmInstanceRef} 
          />
        </div>

      </div>
    </div>
  );
}
