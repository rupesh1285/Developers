import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './Landing';
import Signup from './Signup';
import Signin from './Signin';
// 🌟 FIX: Imported with the exact name you are using in the Route!
import DashboardNew from './pages/Dashboard';
import ProblemWorkspace from './pages/ProblemWorkspace';

// 🌟 THE UPGRADED BOUNCER (Protects Dashboard & Kicks to Landing)
const RequireAuth = ({ children }) => {
  // 1. Check if there is a brand new token waiting in the URL from Google/GitHub
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  
  if (urlToken) {
    // Save it to memory immediately
    localStorage.setItem('token', urlToken);
    
    // Clean up the URL bar
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // 2. Check memory for the token
  const token = localStorage.getItem('token');
  
  // 3. If no token (or a fake 'null' string), kick them to the Landing page
  if (!token || token === 'null' || token === 'undefined') {
    return <Navigate to="/" replace />;
  }
  
  // Otherwise, let them in!
  return children;
};

// 🌟 THE SMART REDIRECT (For the Landing Page)
const SmartLanding = () => {
  const token = localStorage.getItem('token');
  
  // If they have a real token, skip the landing page and go straight to the Dashboard
  if (token && token !== 'null' && token !== 'undefined') {
    return <Navigate to="/problems" replace />;
  }
  
  // Otherwise, show them the Landing page
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
              <DashboardNew />
            </RequireAuth>
          } 
        /> 

        {/* 🌟 NEW: Dedicated Problem Workspace Route */}
        <Route 
          path="/problems/:id" 
          element={
            <RequireAuth>
              <ProblemWorkspace />
            </RequireAuth>
          } 
        />
        
        {/* Catch-all: If they type a random URL, send them to the landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}