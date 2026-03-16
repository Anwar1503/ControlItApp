import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import Dashboard from "./Dashboard";
import About from "./About";
import AdminPanel from "./AdminPanel";
import AgentLink from "./AgentLink";
import UserDetails from "./UserDetails";
import Profile from "./Profile";
import Settings from "./Settings";
import SessionTimeoutDialog from "./SessionTimeoutDialog";
// Import API service to initialize axios interceptor
import "../services/api";
import { useSessionTimeout } from "../hooks/useSessionTimeout";

// Logout component
const Logout: React.FC = () => {
  React.useEffect(() => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('email');
    localStorage.removeItem('parentName');
    localStorage.removeItem('role');
    localStorage.removeItem('is_admin');
    
    // Redirect to login
    window.location.href = '/login';
  }, []);
  
  return <div>Logging out...</div>;
};

// Auth helpers
const isAuthenticated = () => Boolean(localStorage.getItem("token"));
const isAdminUser = () => localStorage.getItem("is_admin") === "true";

const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  return isAuthenticated() ? <>{element}</> : <Navigate to="/login" replace />;
};

// Admin Panel wrapper component
const AdminPanelWrapper: React.FC = () => {
  const isAdmin = localStorage.getItem("is_admin") === "true";
  const userId = localStorage.getItem('user_id') || '';
  return <AdminPanel isAdmin={isAdmin} userId={userId} />;
};

const AdminRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return isAdminUser() ? <>{element}</> : <Navigate to="/dashboard" replace />;
};

const PublicOnlyRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  if (isAuthenticated()) {
    // Redirect based on role
    return isAdminUser() ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
  }
  return <>{element}</>;
};

// Root redirect component
const RootRedirect: React.FC = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return isAdminUser() ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
};

// App content component with session timeout
const AppContent: React.FC = () => {
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  const { resetTimer, logout } = useSessionTimeout({
    timeout: 30 * 60 * 1000, // 30 minutes
    promptBefore: 5 * 60 * 1000, // Show warning 5 minutes before logout
    onPrompt: () => {
      setShowTimeoutDialog(true);
      setTimeLeft(300); // 5 minutes
    },
    onTimeout: () => {
      setShowTimeoutDialog(false);
    }
  });

  const handleExtendSession = () => {
    setShowTimeoutDialog(false);
    resetTimer();
  };

  const handleLogoutNow = () => {
    setShowTimeoutDialog(false);
    logout();
  };

  return (
    <>
      <div>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/login" element={<PublicOnlyRoute element={<Login />} />} />
          <Route path="/register" element={<PublicOnlyRoute element={<Register />} />} />
          <Route path="/forgotpassword" element={<PublicOnlyRoute element={<ForgotPassword />} />} />
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
          <Route path="/about" element={<ProtectedRoute element={<About />} />} />
          <Route path="/admin" element={<AdminRoute element={<AdminPanelWrapper />} />} />
          <Route path="/user/:userId" element={<AdminRoute element={<UserDetails />} />} />
          <Route path="/login/agent/link" element={<PublicOnlyRoute element={<AgentLink />} />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>

      <SessionTimeoutDialog
        open={showTimeoutDialog}
        onExtend={handleExtendSession}
        onLogout={handleLogoutNow}
        timeLeft={timeLeft}
      />
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;