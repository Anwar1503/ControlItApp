import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/login", {
        email,
        password,
      });
      alert(response.data.message);
      if (response.data.message === "Login successful!") {
      navigate("/dashboard");
    }
    } catch (error) {
      console.error("Login error:", error);
      //alert("Login failed!");
    }
  };

  const buttonStyle = {
    width: "100%",
    padding: "14px",
    background: "rgba(5, 0, 0, 0.25)",
    color: "#fff",
    border: "none",
    borderRadius: "24px",
    fontWeight: "bold",
    fontSize: "1.1rem",
    cursor: "pointer",
    letterSpacing: "1px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
      }}
    >
      {/* Left side with image */}
      <div
        style={{
          flex: 1,
          backgroundImage: "url('/app_icon.png')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundColor: "#333",
        }}
      />
      {/* Right side with login form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(120deg,rgb(58, 59, 59) 0%,rgb(164, 168, 251) 100%)",
        }}
      >
        <div
          style={{
            padding: "2.5rem 2rem",
            background: "rgba(7, 0, 0, 0.1)",
            borderRadius: "18px",
            boxShadow: "0 8px 32px 0 rgba(31,38,135,0.37)",
            width: "100%",
            maxWidth: "400px",
            zIndex: 1,
            backdropFilter: "blur(8px)",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              marginBottom: "2rem",
              color: "#fff",
              fontWeight: 500,
            }}
          >
            Login
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
              <i
                className="fa fa-user"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#aaa",
                  fontSize: "1.1rem",
                }}
              />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="User Name"
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  borderRadius: "8px",
                  border: "1px solid #fff",
                  background: "rgba(8, 0, 0, 0.25)",
                  color: "#fff",
                  fontSize: "1rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
              <i
                className="fa fa-lock"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#aaa",
                  fontSize: "1.1rem",
                }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  borderRadius: "8px",
                  border: "1px solid #fff",
                  background: "rgba(7, 0, 0, 0.25)",
                  color: "#fff",
                  fontSize: "1rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "2rem",
              }}
            >
              <label style={{ color: "#fff", fontSize: "0.95rem" }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                  style={{ marginRight: "8px" }}
                />
                Remember Me
              </label>
              <a
                href="/forgotpassword"
                style={{
                  color: "#fff",
                  fontSize: "0.95rem",
                  textDecoration: "underline",
                }}
              >
                Forget Me?
              </a>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "18px" }}
            >
              <button type="submit" style={buttonStyle}>
                Login
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                style={buttonStyle}
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;