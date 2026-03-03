import React, { useState, ChangeEvent, FormEvent } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";

import axios from 'axios';
import { API_BASE } from "../config/api";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword:"",
    phone: "",
  });

  const [otp, setOtp] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const steps = ["Verify Email & Phone", "Enter OTP", "Complete Registration"];

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
  };

  const handleRequestOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE}/api/register/request-otp`, {
        email: formData.email,
        phone: formData.phone,
      });
      
      if (response.data.status === 'success') {
        setMessage("OTP sent to your email and phone!");
        setActiveStep(1);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE}/api/register/verify-otp`, {
        email: formData.email,
        otp: otp,
      });

      if (response.data.status === 'success') {
        setMessage("OTP verified successfully!");
        setActiveStep(2);
        setOtp("");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE}/api/register`, formData);
      setMessage(response.data.message);
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword:"",
        phone: "",
      });
      setActiveStep(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Register New User
        </Typography>

        <Stepper activeStep={activeStep} sx={{ marginBottom: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {message && <Alert severity="success" sx={{ marginBottom: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ marginBottom: 2 }}>{error}</Alert>}

        {/* Step 1: Request OTP */}
        {activeStep === 0 && (
          <Box component="form" onSubmit={handleRequestOtp}>
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="+1234567890"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ marginTop: 3 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Send OTP"}
            </Button>
          </Box>
        )}

        {/* Step 2: Verify OTP */}
        {activeStep === 1 && (
          <Box component="form" onSubmit={handleVerifyOtp}>
            <TextField
              fullWidth
              margin="normal"
              label="Enter OTP"
              name="otp"
              value={otp}
              onChange={handleOtpChange}
              required
              disabled={loading}
              placeholder="123456"
              inputProps={{ maxLength: 6 }}
            />

            <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
              Check your email and SMS for the OTP. It expires in 10 minutes.
            </Typography>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ marginTop: 3 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Verify OTP"}
            </Button>
          </Box>
        )}

        {/* Step 3: Complete Registration */}
        {activeStep === 2 && (
          <Box component="form" onSubmit={handleFinalRegister}>
            <TextField
              fullWidth
              margin="normal"
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              error={
                Boolean(
                  formData.confirmPassword &&
                  formData.password !== formData.confirmPassword
                )
              }
              helperText={
                formData.confirmPassword &&
                formData.password !== formData.confirmPassword
                  ? "Passwords do not match"
                  : ""
              }
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ marginTop: 3 }}
              disabled={
                loading ||
                !formData.password ||
                !formData.confirmPassword ||
                formData.password !== formData.confirmPassword
              }
            >
              {loading ? <CircularProgress size={24} /> : "Complete Registration"}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Register;
