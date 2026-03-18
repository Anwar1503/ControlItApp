import React, { useState, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Monitor as MonitorIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import { API_BASE } from "../config/api";

// Styled Components
const LoginContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)",
  display: "flex",
  fontFamily: "'DM Sans', sans-serif",
  overflow: "hidden",
  position: "relative",
}));

const LeftPanel = styled(Paper)(({ theme }) => ({
  flex: "0 0 48%",
  background: "linear-gradient(160deg, #111128 0%, #0d0d20 60%, #0a0a15 100%)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: "64px 56px",
  position: "relative",
  overflow: "hidden",
  borderRadius: 0,
  [theme.breakpoints.down("md")]: {
    display: "none",
  },
}));

const GridLines = styled(Box)({
  position: "absolute",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
  pointerEvents: "none",
});

const Orb1 = styled(Box)({
  position: "absolute",
  top: "-80px",
  left: "-80px",
  width: "360px",
  height: "360px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
  pointerEvents: "none",
});

const Orb2 = styled(Box)({
  position: "absolute",
  bottom: "60px",
  right: "-60px",
  width: "280px",
  height: "280px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)",
  pointerEvents: "none",
});

const BrandTag = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(99,102,241,0.12)",
  border: "1px solid rgba(99,102,241,0.3)",
  borderRadius: "100px",
  padding: "6px 14px",
  marginBottom: "40px",
  width: "fit-content",
}));

const BrandDot = styled(Box)({
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "#6366f1",
  boxShadow: "0 0 8px #6366f1",
});

const Headline = styled(Typography)(({ theme }) => ({
  fontSize: "clamp(32px, 3vw, 48px)",
  fontWeight: 800,
  lineHeight: 1.15,
  color: "#f8fafc",
  marginBottom: "20px",
  letterSpacing: "-0.02em",
  "& .accent": {
    background: "linear-gradient(135deg, #6366f1, #a855f7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
}));

const Subtext = styled(Typography)({
  fontSize: "16px",
  color: "rgba(255,255,255,0.45)",
  lineHeight: 1.7,
  maxWidth: "340px",
  marginBottom: "48px",
});

const FeatureList = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
});

const FeatureItem = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "12px",
});

const FeatureIcon = styled(Box)(({ theme }) => ({
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  background: "rgba(99,102,241,0.15)",
  border: "1px solid rgba(99,102,241,0.25)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  flexShrink: 0,
}));

const RightPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px 40px",
  background: "#0a0a0f",
  [theme.breakpoints.down("md")]: {
    padding: "32px 24px",
  },
}));

const FormBox = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: "420px",
  [theme.breakpoints.down("sm")]: {
    maxWidth: "100%",
  },
}));

const FormTitle = styled(Typography)({
  fontSize: "26px",
  fontWeight: 700,
  color: "#f1f5f9",
  marginBottom: "8px",
  letterSpacing: "-0.01em",
});

const FormSubtitle = styled(Typography)({
  fontSize: "14px",
  color: "rgba(255,255,255,0.4)",
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  width: "100%",
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "10px",
    color: "#f1f5f9",
    fontSize: "15px",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.1)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(99,102,241,0.6)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(99,102,241,0.6)",
    },
    "&.Mui-focused": {
      background: "rgba(99,102,241,0.06)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.55)",
    "&.Mui-focused": {
      color: "#818cf8",
    },
  },
  "& .MuiOutlinedInput-input": {
    color: "#f1f5f9",
    padding: "14px 16px",
  },
  "& .MuiInputBase-input::placeholder": {
    color: "rgba(255,255,255,0.35)",
    opacity: 1,
  },
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  width: "100%",
  padding: "13px",
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "0.01em",
  textTransform: "none",
  "&:hover": {
    opacity: 0.88,
    transform: "translateY(-1px)",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  },
  "&:disabled": {
    opacity: 0.5,
  },
}));

const ForgotLink = styled("button")({
  fontSize: "13px",
  color: "#818cf8",
  textDecoration: "none",
  fontWeight: 500,
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: "0",
  "&:hover": {
    textDecoration: "underline",
  },
});

const RegisterLink = styled(Button)({
  color: "#818cf8",
  fontWeight: 600,
  cursor: "pointer",
  textTransform: "none",
  fontSize: "13px",
  padding: 0,
  minWidth: "auto",
  "&:hover": {
    background: "none",
    textDecoration: "underline",
  },
});

const features = [
  { icon: "⚡", label: "Real-time monitoring & alerts" },
  { icon: "🔒", label: "Role-based access control" },
  { icon: "📊", label: "Advanced analytics dashboard" },
];

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/api/login`, { email, password });

      if (response.data.message === "Login successful!") {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user_id", response.data.user_id);
        localStorage.setItem("email", response.data.email);
        localStorage.setItem("parentName", response.data.parentName);
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("is_admin", response.data.is_admin.toString());

        navigate(response.data.is_admin ? "/admin" : "/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      {/* Left Panel */}
      <LeftPanel elevation={0}>
        <GridLines />
        <Orb1 />
        <Orb2 />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <BrandTag>
            <BrandDot />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: "#a5b4fc",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              ControlIt
            </Typography>
          </BrandTag>

          <Headline>
            Take full control of<br />
            <span className="accent">your operations</span>
          </Headline>

          <Subtext>
            A unified platform for managing teams, monitoring systems, and making data-driven decisions.
          </Subtext>

          <FeatureList>
            {features.map((f) => (
              <FeatureItem key={f.label}>
                <FeatureIcon>{f.icon}</FeatureIcon>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                  {f.label}
                </Typography>
              </FeatureItem>
            ))}
          </FeatureList>
        </Box>
      </LeftPanel>

      {/* Right Panel */}
      <RightPanel>
        <FormBox sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <Box sx={{ marginBottom: 3 }}>
            <FormTitle>Sign in</FormTitle>
            <FormSubtitle>Enter your credentials to continue</FormSubtitle>
          </Box>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            {/* Email */}
            <Box sx={{ marginBottom: 2.5 }}>
              <StyledTextField
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: "rgba(255,255,255,0.4)", marginRight: 1 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Password */}
            <Box sx={{ marginBottom: 2.5 }}>
              <StyledTextField
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "rgba(255,255,255,0.4)", marginRight: 1 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: "rgba(255,255,255,0.4)" }}
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Remember + Forgot */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    sx={{
                      color: "rgba(255,255,255,0.3)",
                      "&.Mui-checked": {
                        color: "#6366f1",
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)" }}>
                    Remember me
                  </Typography>
                }
              />
              <ForgotLink onClick={() => navigate("/forgotpassword")}>
                Forgot password?
              </ForgotLink>
            </Box>

            {/* Submit */}
            <SubmitButton
              type="submit"
              disabled={loading}
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </SubmitButton>
          </Box>

          <Box sx={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "28px 0" }} />

          <Box sx={{ textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
            Don't have an account?
            <RegisterLink onClick={() => navigate("/register")}>
              Create one
            </RegisterLink>
          </Box>
        </FormBox>
      </RightPanel>
    </LoginContainer>
  );
};

export default Login;