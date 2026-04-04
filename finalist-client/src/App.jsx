import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './Landing';
import Signup from './Signup';
import Signin from './Signin';
import Dashboard from './Dashboard';

// 🌟 THE FIX 1: The Bouncer (Protects the Dashboard)
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('token');
  // If there is no token in their browser, kick them to the login page
  if (!token) {
    return <Navigate to="/signin" replace />;
  }
  // Otherwise, let them in!
  return children;
};

// 🌟 THE FIX 2: Smart Redirect (For the Landing Page)
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
        
        {/* Wrap the Dashboard in our RequireAuth bouncer */}
        <Route 
          path="/problems" 
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          } 
        /> 
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}