import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './signup.css';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Auth States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // 1. THE LAYOUT ENGINE
  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 950px), (max-width: 1200px) and (orientation: portrait)');
    const handleLayoutShift = (e) => setIsMobile(e.matches);

    handleLayoutShift(mobileQuery);
    mobileQuery.addEventListener('change', handleLayoutShift);
    return () => mobileQuery.removeEventListener('change', handleLayoutShift);
  }, []);

  // 2. THE ANIMATION ENGINE
  useEffect(() => {
    let runeInterval;
    
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel) {
      rightPanel.addEventListener('mousemove', (e) => {
        const rect = rightPanel.getBoundingClientRect();
        rightPanel.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        rightPanel.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    }

    const runes = ['{}', '</>', '[]', '=>', '();', '&&', '||', '!='];
    runeInterval = setInterval(() => {
      const allContainers = document.querySelectorAll('.runes-container');
      allContainers.forEach(container => {
        const rune = document.createElement('div');
        rune.className = 'rune';
        rune.textContent = runes[Math.floor(Math.random() * runes.length)];
        rune.style.left = Math.random() * 100 + '%';
        rune.style.animationDuration = (Math.random() * 6 + 6) + 's';
        rune.style.fontSize = (Math.random() * 10 + 14) + 'px';
        container.appendChild(rune);
        setTimeout(() => rune.remove(), 12000);
      });
    }, 400);

    return () => {
      clearInterval(runeInterval);
    };
  }, [isMobile]);

  // 3. AUTH LOGIC
  const handleManualSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      return setErrorMsg("Passwords do not match");
    }

    try {
      const fullName = `${firstName} ${lastName}`.trim();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      localStorage.setItem('token', data.token);
      navigate('/problems');
      
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  // 4. UI COMPONENTS
  const FormPanel = () => (
    <div className="form-wrapper" id="form-wrapper">
      <h1 className="form-title">
        <span className="letter" style={{ animationDelay: '0s' }}>C</span>
        <span className="letter" style={{ animationDelay: '0.04s' }}>r</span>
        <span className="letter" style={{ animationDelay: '0.08s' }}>e</span>
        <span className="letter" style={{ animationDelay: '0.12s' }}>a</span>
        <span className="letter" style={{ animationDelay: '0.16s' }}>t</span>
        <span className="letter" style={{ animationDelay: '0.2s' }}>e</span>
        <span className="space"> </span>
        <span className="letter" style={{ animationDelay: '0.28s' }}>A</span>
        <span className="letter" style={{ animationDelay: '0.32s' }}>c</span>
        <span className="letter" style={{ animationDelay: '0.36s' }}>c</span>
        <span className="letter" style={{ animationDelay: '0.4s' }}>o</span>
        <span className="letter" style={{ animationDelay: '0.44s' }}>u</span>
        <span className="letter" style={{ animationDelay: '0.48s' }}>n</span>
        <span className="letter" style={{ animationDelay: '0.52s' }}>t</span>
      </h1>
      <p className="form-subtitle illuminate">Start tracking your interview journey today.</p>

      {errorMsg && <div style={{color: '#ff4d4d', marginBottom: '10px', fontSize: '14px'}}>{errorMsg}</div>}

      <form onSubmit={handleManualSignup}>
        <div className="name-row">
          <div className="input-group">
            <label>First Name</label>
            <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Last Name</label>
            <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>

        <div className="input-group">
          <label>Email</label>
          <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="input-group">
          <label>Create Password</label>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              onMouseDown={(e) => e.preventDefault()} 
            >
              <img src={showPassword ? "/assets/eye-open.png" : "/assets/eye-closed.png"} alt="Toggle" />
            </span>
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: '8px' }}>
          <label>Confirm Password</label>
          <div className="password-field">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <img src={showConfirmPassword ? "/assets/eye-open.png" : "/assets/eye-closed.png"} alt="Toggle" />
            </span>
          </div>
        </div>

        <button type="submit" className="primary-btn">
          Create Account <i className="ri-user-add-line"></i>
        </button>
      </form>

      <div className="divider-container">
        <span className="divider-text">OR CONTINUE WITH</span>
      </div>

      <div className="oauth-row">
        <button type="button" className="oauth-btn" onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z" />
          </svg>
          Google
        </button>
        <button type="button" className="oauth-btn" onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/github`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </button>
      </div>
    </div>
  );

  const TopPills = () => (
    <div className="top-right-pills">
      <div className="float-card mini-card card-1">
        <div className="icon-box green"><i className="ri-checkbox-circle-fill"></i></div>
        <div className="card-text">
          <h4>1000+ Problems</h4>
          <span>Curated analytics</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="split-container">
      {!isMobile ? (
        <div className="desktop-layout" style={{ display: 'flex' }}>
          <div className="left-panel">
            <div className="panel-top">
              <a href="#" className="text-logo">FINALIST</a>
              <div className="login-badge">
                <span className="muted-text">Already a FINALIST?</span>
                <Link to="/signin" className="nav-signin-btn">Sign In <i className="ri-arrow-right-line"></i></Link>
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
            <div className="spotlight-overlay"></div>
            <div className="runes-container" id="runes-container"></div>
            <TopPills />
            <div className="signup-content">
              <h2 className="hero-text">
                Start your journey.<br />
                Stay consistent.<br />
                <span className="accent-text">Reach the FINALIST stage.</span>
              </h2>
            </div>
          </div>
        </div>
      ) : (
        <div className="mobile-layout" style={{ display: 'flex' }}>
          <div className="mobile-top-stage">
            <div className="runes-container" id="runes-container"></div>
            <div className="mobile-nav">
              <a href="#" className="text-logo">FINALIST</a>
              <div className="mobile-badge">
                <span className="muted-text">Already a FINALIST?</span>
                <Link to="/signin" className="nav-signin-btn">Sign In <i className="ri-arrow-right-line"></i></Link>
              </div>
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