import React, { useState, useEffect, useRef } from 'react';

export default React.memo(function AiTutor({ problem, isActive, cmInstanceRef }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const aiHistoryRef = useRef(null);
  const aiInputRef = useRef(null);

  // Load chat history
  useEffect(() => {
    if (!problem) return;
    const savedChat = JSON.parse(localStorage.getItem(`finalist_ai_${problem._id}`) || '[]');
    setChatHistory(savedChat);

    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/api/workspace/${problem._id}`, { headers: { "Authorization": "Bearer " + token } })
      .then(res => res.json())
      .then(data => {
        if (data.chat && data.chat.length > 0) setChatHistory(data.chat);
      })
      .catch(() => {});
  }, [problem]);

  // Auto-scroll chat
  useEffect(() => {
    if (aiHistoryRef.current) aiHistoryRef.current.scrollTop = aiHistoryRef.current.scrollHeight;
  }, [chatHistory, isAiThinking]);

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
      const aiRes = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({
          message: text,
          code: cmInstanceRef.current ? cmInstanceRef.current.getValue() : '', // 🌟 Grabs code seamlessly!
          problemTitle: problem.title,
          chatHistory: newChat.slice(0, -1)
        })
      });
      const aiData = await aiRes.json();
      const fullReply = aiData.reply || aiData.error || "I encountered an error analyzing that.";

      setIsAiThinking(false);

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
          fetch(`${import.meta.env.VITE_API_URL}/api/workspace/chat/${problem._id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
            body: JSON.stringify({ chat: completedChat })
          }).catch(() => {});
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
      setChatHistory([...newChat, { role: 'bot', content: "Connection to AI core lost." }]);
    }
  };

  const wipeMemory = async () => {
    const token = localStorage.getItem('token');
    setChatHistory([]);
    localStorage.removeItem(`finalist_ai_${problem._id}`);
    setShowClearConfirm(false);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/workspace/chat/${problem._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ chat: [] })
      });
    } catch (e) { }
  };

  return (
    <div className={`tab-pane ${isActive ? 'active' : ''}`} id="tab-ai">
      {showClearConfirm && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(12, 14, 20, 0.85)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '0 0 12px 12px' }}>
          <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(248, 113, 113, 0.3)', padding: '20px', borderRadius: '12px', textAlign: 'center', maxWidth: '80%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <i className="ri-error-warning-line" style={{ fontSize: '32px', color: '#f87171', marginBottom: '10px' }}></i>
            <h3 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '16px' }}>Wipe AI Memory?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 20px 0' }}>This conversation will be permanently deleted.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setShowClearConfirm(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', transition: '0.2s' }}>Cancel</button>
              <button onClick={wipeMemory} style={{ background: '#f87171', border: 'none', color: '#121212', fontWeight: 'bold', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', transition: '0.2s' }}>Wipe It</button>
            </div>
          </div>
        </div>
      )}

      <div className="ai-chat-box">
        <div className="ai-chat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Tutor Chat</span>
          <i className="ri-delete-bin-7-line" style={{ cursor: 'pointer', color: '#f87171', fontSize: '16px', transition: '0.2s' }} title="Clear Memory" onClick={() => setShowClearConfirm(true)}></i>
        </div>

        <div className={`ai-history ${chatHistory.length > 0 ? 'has-chat' : ''}`} ref={aiHistoryRef}>
          {chatHistory.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
              <i className="ri-robot-2-line" style={{ fontSize: '36px', color: 'var(--accent)', marginBottom: '12px' }}></i>
              <span style={{ fontSize: '13px' }}>AI Context initialized for <strong>{problem.title}</strong>.</span>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`chat-msg ${msg.role}`}>
                <div
                  className="chat-bubble"
                  dangerouslySetInnerHTML={{
                    __html: msg.role === 'bot' && window.marked ? window.marked.parse(msg.content || '') : msg.content
                  }}
                ></div>
              </div>
            ))
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
  );
});