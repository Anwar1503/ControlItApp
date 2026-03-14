import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import Dashboard from "./Dashboard";
import About from "./About";
import LockPC from "./LockPC";
import AdminPanel from "./AdminPanel";
import AgentLink from "./AgentLink";
import UserDetails from "./UserDetails";
// Import API service to initialize axios interceptor
import "../services/api";

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
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <>{element}</>;
};

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute element={<Login />} />} />
          <Route path="/register" element={<PublicOnlyRoute element={<Register />} />} />
          <Route path="/forgotpassword" element={<PublicOnlyRoute element={<ForgotPassword />} />} />
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/about" element={<ProtectedRoute element={<About />} />} />
          <Route path="/lockpc" element={<ProtectedRoute element={<LockPC />} />} />
          <Route path="/admin" element={<AdminRoute element={<AdminPanelWrapper />} />} />
          <Route path="/user/:userId" element={<AdminRoute element={<UserDetails />} />} />
          <Route path="/login/agent/link" element={<PublicOnlyRoute element={<AgentLink />} />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;