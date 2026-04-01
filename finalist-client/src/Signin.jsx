import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './signin.css';

export default function Signin() {
    const [showPassword, setShowPassword] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // 1. THE LAYOUT ENGINE
    useEffect(() => {
        const mobileQuery = window.matchMedia('(max-width: 950px), (max-width: 1200px) and (orientation: portrait)');
        const handleLayoutShift = (e) => setIsMobile(e.matches);

        handleLayoutShift(mobileQuery);
        mobileQuery.addEventListener('change', handleLayoutShift);
        return () => mobileQuery.removeEventListener('change', handleLayoutShift);
    }, []);

    // 2. THE ANIMATION ENGINE (Runes, Spotlight, & Typist)
    useEffect(() => {
        let runeInterval;
        let typistTimeout;
        let isTyping = true;

        // --- A. SPOTLIGHT & RUNES ---
        const rightPanel = document.querySelector('.right-panel');
        const runesContainer = document.getElementById('runes-container');

        if (runesContainer && rightPanel) {
            rightPanel.addEventListener('mousemove', (e) => {
                const rect = rightPanel.getBoundingClientRect();
                rightPanel.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                rightPanel.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
            });

            const runes = ['{}', '</>', '[]', '=>', '();', '&&', '||', '!='];
            runeInterval = setInterval(() => {
                const rune = document.createElement('div');
                rune.className = 'rune';
                rune.textContent = runes[Math.floor(Math.random() * runes.length)];
                rune.style.left = Math.random() * 100 + '%';
                rune.style.animationDuration = (Math.random() * 6 + 6) + 's';
                rune.style.fontSize = (Math.random() * 10 + 14) + 'px';
                runesContainer.appendChild(rune);
                setTimeout(() => rune.remove(), 12000);
            }, 400);
        }

        // --- B. CINEMATIC CODE TYPIST ---
        const codeSnippets = [
            { file: "binary_search.py", code: "def binary_search(arr, target):\n    low, high = 0, len(arr) - 1^\n\n    while low <= high:\n        mid = (low + high) / 2^\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:^\n            low = mid + 1\n        else:\n            high = mid - 1\n\n    return -1" },
            { file: "GraphDFS.java", code: "public void dfs(Node node, Set<Node> visited) {\n    if (node == null) return;^\n\n    visited.add(node);\n    System.out.println(node.val);^\n\n    for (Node neighbor : node.neighbors) {\n        if (!visited.contains(neighbor)) {^\n            dfs(neighbor, visited);\n        }\n    }\n}" },
            { file: "MergeSort.cpp", code: "void mergeSort(vector<int>& arr, int l, int r) {\n    if (l >= r) return;^\n    \n    int m = l + (r - l) / 2;\n    mergeSort(arr, l, m);^\n    mergeSort(arr, m + 1, r);\n    \n    merge(arr, l, m, r);^\n}" },
            { file: "useAuth.ts", code: "const useAuth = () => {\n    const [user, setUser] = useState(null);^\n    \n    useEffect(() => {\n        const token = localStorage.getItem('token');^\n        if (token) {\n            fetchUser(token).then(setUser);^\n        }\n    }, []);\n\n    return user;\n};" }
        ];

        let selectedSnippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
        const filenameEl = document.getElementById('ide-filename');
        const codeElement = document.getElementById('typed-code');
        const ideBody = document.querySelector('.ide-body');
        let charIndex = 0;

        if (filenameEl) filenameEl.textContent = selectedSnippet.file;

        function typeCode() {
            if (!isTyping || !codeElement || !selectedSnippet) return;

            if (charIndex < selectedSnippet.code.length) {
                let char = selectedSnippet.code.charAt(charIndex);
                if (char === '^') {
                    charIndex++;
                    typistTimeout = setTimeout(typeCode, 1500);
                    return;
                }
                codeElement.textContent += char;
                charIndex++;

                if (ideBody) {
                    ideBody.scrollTop = ideBody.scrollHeight;
                }

                let typingSpeed = Math.random() * 50 + 30;
                typistTimeout = setTimeout(typeCode, typingSpeed);
            } else {
                typistTimeout = setTimeout(() => {
                    codeElement.textContent = "";
                    charIndex = 0;
                    selectedSnippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
                    if (filenameEl) filenameEl.textContent = selectedSnippet.file;
                    if (isTyping) typeCode();
                }, 5000);
            }
        }

        // Start typing after a short delay
        typistTimeout = setTimeout(typeCode, 1000);

        // Cleanup when component unmounts or switches between desktop/mobile
        return () => {
            clearInterval(runeInterval);
            clearTimeout(typistTimeout);
            isTyping = false;
        };
    }, [isMobile]);

    // --- UI COMPONENTS ---
    const FormPanel = () => (
        <div className="form-wrapper" id="form-wrapper">
            <h1 className="form-title">
                <span className="letter" style={{ animationDelay: '0s' }}>W</span>
                <span className="letter" style={{ animationDelay: '0.04s' }}>e</span>
                <span className="letter" style={{ animationDelay: '0.08s' }}>l</span>
                <span className="letter" style={{ animationDelay: '0.12s' }}>c</span>
                <span className="letter" style={{ animationDelay: '0.16s' }}>o</span>
                <span className="letter" style={{ animationDelay: '0.2s' }}>m</span>
                <span className="letter" style={{ animationDelay: '0.24s' }}>e</span>
                <span className="space"> </span>
                <span className="letter" style={{ animationDelay: '0.32s' }}>B</span>
                <span className="letter" style={{ animationDelay: '0.36s' }}>a</span>
                <span className="letter" style={{ animationDelay: '0.4s' }}>c</span>
                <span className="letter" style={{ animationDelay: '0.44s' }}>k</span>
            </h1>
            <p className="form-subtitle illuminate">Pick up exactly where you left off.</p>

            <form onSubmit={(e) => e.preventDefault()}>
                <div className="input-group">
                    <label>Email</label>
                    <input type="email" placeholder="name@example.com" required />
                </div>

                <div className="input-group" style={{ marginBottom: '8px' }}>
                    <label>Password</label>
                    <div className="password-field">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            required
                        />
                        <span
                            className="toggle-password"
                            onMouseDown={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                            onTouchStart={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                        >
                            <img src={showPassword ? "/assets/eye-open.png" : "/assets/eye-closed.png"} alt="Toggle" />
                        </span>
                    </div>
                </div>

                <button type="submit" className="primary-btn">
                    Sign In <i className="ri-login-box-line"></i>
                </button>
            </form>

            <div className="divider-container">
                <span className="divider-text">OR CONTINUE WITH</span>
            </div>

            <div className="oauth-row">
                {/* 🌟 REACT OAUTH REDIRECTS */}
                <button
                    type="button"
                    className="oauth-btn"
                    onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                >
                    <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Google
                </button>
                <button
                    type="button"
                    className="oauth-btn"
                    onClick={() => window.location.href = 'http://localhost:5000/api/auth/github'}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                </button>
            </div>
        </div>
    );

    const StreakHeatmap = () => (
        <div className="top-streak-module" id="streak-module">
            <div className="streak-info">
                <div className="streak-val">100 <span className="streak-days">Day Streak</span></div>
                <div className="streak-label"><i className="ri-fire-fill" style={{ color: '#f59e0b' }}></i> Keep the momentum going</div>
            </div>
            <div className="heatmap-matrix">
                <div className="heat-cell lvl-0"></div><div className="heat-cell lvl-1"></div><div className="heat-cell lvl-2"></div><div className="heat-cell lvl-2"></div>
                <div className="heat-cell lvl-0"></div><div className="heat-cell lvl-1"></div><div className="heat-cell lvl-3"></div><div className="heat-cell lvl-2"></div>
                <div className="heat-cell lvl-1"></div><div className="heat-cell lvl-1"></div><div className="heat-cell lvl-3"></div><div className="heat-cell lvl-2"></div>
                <div className="heat-cell lvl-0"></div><div className="heat-cell lvl-2"></div><div className="heat-cell lvl-3"></div><div className="heat-cell lvl-1"></div>
                <div className="heat-cell lvl-1"></div><div className="heat-cell lvl-2"></div><div className="heat-cell lvl-2"></div><div className="heat-cell lvl-3"></div>
                <div className="heat-cell lvl-1"></div><div className="heat-cell lvl-3"></div><div className="heat-cell lvl-1"></div><div className="heat-cell lvl-0"></div>
                <div className="heat-cell lvl-1"></div><div className="heat-cell lvl-2"></div><div className="heat-cell lvl-3"></div><div className="heat-cell lvl-2"></div>
                <div className="heat-cell lvl-1"></div><div className="heat-cell lvl-2"></div><div className="heat-cell lvl-3"></div><div className="heat-cell lvl-2"></div>
                <div className="heat-cell lvl-1"></div><div className="heat-cell lvl-1"></div><div className="heat-cell lvl-2"></div><div className="heat-cell lvl-pulse"></div>
            </div>
        </div>
    );

    const IdeWindow = () => (
        <>
            <div className="ide-floating-window">
                <div className="ide-header">
                    <div className="mac-dots">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                    </div>
                    <span className="ide-filename" id="ide-filename">script.js</span>
                </div>
                <div className="ide-body">
                    <code id="typed-code"></code><span className="typing-cursor"></span>
                </div>
            </div>
            <div className="dual-roller-wrapper">
                <div className="roller-col roll-up">
                    <span className="r-word">Crack</span>
                    <span className="r-word">Write</span>
                    <span className="r-word">Master</span>
                    <span className="r-word">Crack</span>
                </div>
                <span className="static-mid">the</span>
                <div className="roller-col roll-down accent-text">
                    <span className="r-word">logic.</span>
                    <span className="r-word">algorithm.</span>
                    <span className="r-word">code.</span>
                    <span className="r-word">logic.</span>
                </div>
            </div>
        </>
    );

    return (
        <div className="split-container">
            {!isMobile ? (
                <div className="desktop-layout" style={{ display: 'flex' }}>
                    <div className="left-panel">
                        <div className="panel-top">
                            <img src="/assets/logo.png" className="logo" alt="FINALIST Logo" />
                            <div className="login-badge">
                                <span className="muted-text">New to FINALIST?</span>
                                {/* 🌟 REACT ROUTER LINK - Notice how we use <Link> instead of <a href>! */}
                                <Link to="/signup" className="nav-signin-btn">Sign Up <i className="ri-arrow-right-line"></i></Link>
                            </div>
                        </div>
                        {FormPanel()}
                    </div>

                    <div
                        className="right-panel"
                        style={{ justifyContent: 'space-around' }}
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                            e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                        }}
                    >
                        {/* 🌟 FIX: The missing spotlight div has been restored! */}
                        <div className="spotlight-overlay"></div>

                        <div className="runes-container" id="runes-container"></div>
                        <StreakHeatmap />
                        <div className="signin-content">
                            <IdeWindow />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mobile-layout" style={{ display: 'flex' }}>
                    <div className="mobile-top-stage">
                        <div className="runes-container" id="runes-container"></div>
                        <div className="mobile-nav">
                            <img src="/assets/logo.png" className="logo" alt="FINALIST Logo" />
                            <div className="mobile-badge">
                                <span className="muted-text">New to FINALIST?</span>
                                <Link to="/signup" className="nav-signin-btn">Sign Up <i className="ri-arrow-right-line"></i></Link>
                            </div>
                        </div>

                        <StreakHeatmap />
                        <div className="signin-content">
                            <IdeWindow />
                        </div>

                        <div className="mobile-wave"></div>
                    </div>

                    <div className="mobile-bottom-form">
                        {FormPanel()}
                    </div>
                </div>
            )}
        </div>
    );
}