import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => (
  <nav style={{
    background: "#222",
    color: "#fff",
    padding: "1rem",
    display: "flex",
    justifyContent: "space-between"
  }}>
    <div style={{ fontWeight: "bold" }}>Time Based Break App</div>
    <div>
      <Link to="/dashboard" style={{ color: "#fff", marginRight: "1rem" }}>Dashboard</Link>
        <Link to="/lockpc" style={{ color: "#fff", marginRight: "1rem" }}>Lock PC</Link>
      <Link to ="/about" style ={{color:"#fff",marginRight:"1rem"}}>About</Link>
      <Link to="/login" style={{ color: "#fff" }}>Logout</Link>
    </div>
  </nav>
);

export default Navbar;