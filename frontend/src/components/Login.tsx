import React, { useState ,FormEvent} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from '@mui/material/Button';
import Grid from "@mui/material/Grid";
import { Typography } from "@mui/material";

const Login :React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
    <Grid
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
      }}
    >
      {/* Left side with image */}
      <Grid
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
      <Grid
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(120deg,rgb(58, 59, 59) 0%,rgb(164, 168, 251) 100%)",
        }}
      >
        <Grid
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
          <Typography
            style={{
              textAlign: "center",
              marginBottom: "2rem",
              color: "#fff",
              fontSize:40,
            }}
          >
            Login
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid style={{ position: "relative", marginBottom: "1.5rem" }}>
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
            </Grid>
            <Grid style={{ position: "relative", marginBottom: "1.5rem" }}>
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
            </Grid>
            <Grid
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
                Forgot Password ?
              </a>
            </Grid>
            <Grid
              style={{ display: "flex", flexDirection: "column", gap: "18px" }}
            >
              <Button type="submit" style={buttonStyle}>
                Login
              </Button>
              <Button
                type="button"
                onClick={() => navigate("/register")}
                style={buttonStyle}
              >
                Sign In
              </Button>
            </Grid>
          </form>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Login;