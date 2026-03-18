import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Step,
  Stepper,
  StepLabel,
  InputAdornment,
  IconButton,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { API_BASE } from "../config/api";

const StyledTextField = styled(TextField)(({ theme }) => ({
  width: "100%",
  "& .MuiOutlinedInput-root": {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "8px",
    color: "#f1f5f9",
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
  },
}));

const SubmitButton = styled(Button)({
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  color: "#fff",
  fontWeight: 600,
  textTransform: "none",
  "&:hover": {
    opacity: 0.88,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  },
  "&:disabled": {
    opacity: 0.5,
  },
});

interface ForgotPasswordProps {}

const ForgotPassword: React.FC<ForgotPasswordProps> = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: email, 1: OTP + password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestOTP = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_BASE}/api/user/request-password-otp`,
        { email }
      );

      if (response.data.status === "success") {
        setSuccess("OTP sent to your email!");
        setStep(1);
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error requesting OTP");
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    const passwordPolicy = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordPolicy.test(password)) {
      return "Password must be at least 8 characters long, include an uppercase letter and a special character.";
    }
    return null;
  };

  const handleChangePassword = async () => {
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/api/user/change-password`,
        {
          email,
          otp,
          new_password: newPassword,
        }
      );

      if (response.data.status === "success") {
        setSuccess("Password changed successfully!");
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(response.data.message || "Failed to change password");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error changing password");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
    navigate("/login");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 500,
          background: "#0a0a0f",
          borderRadius: "12px",
          border: "1px solid rgba(99,102,241,0.2)",
          padding: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "#f1f5f9",
            fontWeight: 700,
            mb: 3,
            textAlign: "center",
          }}
        >
          Reset Password
        </Typography>

        <Stepper activeStep={step} sx={{ mb: 3 }}>
          <Step>
            <StepLabel sx={{ "& .MuiStepLabel-label": { color: "rgba(255,255,255,0.7)" } }}>
              Email
            </StepLabel>
          </Step>
          <Step>
            <StepLabel sx={{ "& .MuiStepLabel-label": { color: "rgba(255,255,255,0.7)" } }}>
              Verify & Reset
            </StepLabel>
          </Step>
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {step === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <StyledTextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="Enter your email address"
            />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
              We'll send you a one-time password to reset your account.
            </Typography>
            <SubmitButton
              onClick={handleRequestOTP}
              disabled={loading || !email}
              fullWidth
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={20} /> : "Send OTP"}
            </SubmitButton>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <StyledTextField
              label="One-Time Password"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
              placeholder="Enter OTP from email"
            />
            <StyledTextField
              label="New Password"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter new password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <StyledTextField
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder="Confirm new password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <SubmitButton
              onClick={handleChangePassword}
              disabled={loading || !otp || !newPassword || !confirmPassword}
              fullWidth
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={20} /> : "Reset Password"}
            </SubmitButton>
          </Box>
        )}

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button
            onClick={() => navigate("/login")}
            sx={{ color: "rgba(99,102,241,0.8)", textTransform: "none" }}
          >
            Back to Login
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
