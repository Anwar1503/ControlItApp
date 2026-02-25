import React from "react";
import Navbar from "./Navbar";
import axios from "axios";

const LockPC = () => {
  const handleLock = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/lock", {
        choice: "yes",
      });
      alert(response.data.status);
    } catch (error) {
      alert("Failed to lock PC.");
    }
  };

  return (
    <div style={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <button
          onClick={handleLock}
          style={{
            padding: "1rem 2rem",
            fontSize: "1.2rem",
            borderRadius: "8px",
            border: "none",
            background: "#4f8cff",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}
        >
          Lock PC
        </button>
      </div>
    </div>
  );
};

export default LockPC;