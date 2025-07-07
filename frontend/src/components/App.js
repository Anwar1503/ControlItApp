import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import Dashboard from "./Dashboard";
import About from "./About";
import LockPC from "./LockPC";

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About/>} />
          <Route path ="lockpc" element = {<LockPC/>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;