import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './Landing';
import Signup from './Signup';
import Signin from './Signin';
import Dashboard from './Dashboard';

// 🌟 THE UPGRADED BOUNCER (Protects the Dashboard & Catches OAuth Tokens)
const RequireAuth = ({ children }) => {
  // 1. First, check if there is a brand new token waiting in the URL from Google/GitHub
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  
  if (urlToken) {
    // Save it to memory immediately!
    localStorage.setItem('token', urlToken);
    
    // Clean up the URL bar so the giant token disappears and looks professional
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // 2. Now check if we have a token in memory
  const token = localStorage.getItem('token');
  
  // If there is STILL no token, kick them to the login page
  if (!token) {
    return <Navigate to="/signin" replace />;
  }
  
  // Otherwise, let them in!
  return children;
};

// 🌟 THE SMART REDIRECT (For the Landing Page)
const SmartLanding = () => {
  const token = localStorage.getItem('token');
  // If they already have a token, skip the landing page and go straight to work
  if (token) {
    return <Navigate to="/problems" replace />;
  }
  // Otherwise, show them the beautiful landing page
  return <Landing />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Use the SmartLanding component for the root URL */}
        <Route path="/" element={<SmartLanding />} />
        
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        
        {/* Wrap the Dashboard in our upgraded RequireAuth bouncer */}
        <Route 
          path="/problems" 
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          } 
        /> 
        
        {/* Catch-all: If they type a random URL, send them to the landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}