import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Navbar from "./Navbar";
import { API_BASE } from "../config/api";
import axios from "axios";

// Types
interface UserData {
  email: string;
  parentName?: string;
  phone?: string;
  role: string;
  created_at?: string;
  agent_count?: number;
  online_agents?: number;
  avg_cpu?: number;
}

// Styled Components
const ProfileContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)",
  fontFamily: "'DM Sans', sans-serif",
  color: "#f1f5f9",
  padding: "24px",
  width: "100%",
  boxSizing: "border-box",
  [theme.breakpoints.up("md")]: {
    padding: "40px",
  },
}));

const PageHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: "36px",
  flexWrap: "wrap",
  gap: "12px",
  width: "100%",
}));

const PageTitle = styled(Typography)({
  fontSize: "28px",
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: "#f1f5f9",
  marginBottom: "4px",
});

const PageSubtitle = styled(Typography)({
  fontSize: "14px",
  color: "rgba(255,255,255,0.35)",
});

const HeroCard = styled(Card)(({ theme }) => ({
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "28px 32px",
  display: "flex",
  alignItems: "center",
  gap: "24px",
  marginBottom: "20px",
  position: "relative",
  overflow: "hidden",
  width: "100%",
  flexWrap: "wrap",
  [theme.breakpoints.down("sm")]: {
    padding: "20px 20px",
    flexDirection: "column",
    textAlign: "center",
  },
}));

const HeroGlow = styled(Box)({
  position: "absolute",
  top: "-60px",
  right: "-60px",
  width: "220px",
  height: "220px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
  pointerEvents: "none",
});

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: "72px",
  height: "72px",
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  fontSize: "26px",
  fontWeight: 700,
  color: "#fff",
  flexShrink: 0,
  boxShadow: "0 0 0 3px rgba(99,102,241,0.25)",
}));

const HeroInfo = styled(Box)({
  flex: 1,
  minWidth: 0,
});

const HeroEmail = styled(Typography)({
  fontSize: "20px",
  fontWeight: 700,
  color: "#f1f5f9",
  marginBottom: "8px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const RoleBadge = styled(Chip)<{ role: string }>(({ role }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "4px 12px",
  borderRadius: "100px",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  ...(role === "admin"
    ? {
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.3)",
        color: "#fca5a5",
        "& .MuiChip-dot": {
          background: "#f87171",
        },
      }
    : {
        background: "rgba(99,102,241,0.12)",
        border: "1px solid rgba(99,102,241,0.3)",
        color: "#a5b4fc",
        "& .MuiChip-dot": {
          background: "#818cf8",
        },
      }),
}));

const StatusBadge = styled(Chip)({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "3px 10px",
  borderRadius: "100px",
  fontSize: "12px",
  fontWeight: 600,
  background: "rgba(34,197,94,0.1)",
  border: "1px solid rgba(34,197,94,0.25)",
  color: "#86efac",
  "& .MuiChip-dot": {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 6px #4ade80",
  },
});

const InfoGrid = styled(Grid)(({ theme }) => ({
  gap: "20px",
  marginBottom: "20px",
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}));

const InfoCard = styled(Card)(({ theme }) => ({
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "24px",
  width: "100%",
  [theme.breakpoints.down("sm")]: {
    padding: "16px",
  },
}));

const CardTitle = styled(Typography)({
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.35)",
  marginBottom: "20px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const FieldRow = styled(Box)({
  marginBottom: "18px",
});

const FieldLabel = styled(Typography)({
  fontSize: "12px",
  color: "rgba(255,255,255,0.35)",
  marginBottom: "4px",
  fontWeight: 500,
});

const FieldValue = styled(Typography)({
  fontSize: "15px",
  fontWeight: 500,
  color: "#e2e8f0",
});

const Divider = styled(Box)({
  height: "1px",
  background: "rgba(255,255,255,0.06)",
  margin: "16px 0",
});

const StatsCard = styled(Card)(({ theme }) => ({
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "24px",
  width: "100%",
  [theme.breakpoints.down("sm")]: {
    padding: "16px",
  },
}));

const StatsGrid = styled(Grid)(({ theme }) => ({
  gap: "16px",
  marginTop: "8px",
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

const StatBox = styled(Box)(({ theme }) => ({
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center",
  width: "100%",
  [theme.breakpoints.down("sm")]: {
    padding: "12px",
  },
}));

const StatNumber = styled(Typography)<{ color: string }>(({ color }) => ({
  fontSize: "32px",
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color,
  lineHeight: 1,
  marginBottom: "6px",
}));

const StatLabel = styled(Typography)({
  fontSize: "12px",
  color: "rgba(255,255,255,0.4)",
  fontWeight: 500,
});

const CenteredBox = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "60vh",
  gap: "16px",
});

const Spinner = styled(CircularProgress)({
  color: "#6366f1",
});

const SpinnerLabel = styled(Typography)({
  fontSize: "14px",
  color: "rgba(255,255,255,0.35)",
});

// Component
const Profile: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ parentName: '', phone: '' });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordStep, setPasswordStep] = useState(0);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpDialog, setOtpDialog] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await axios.get(`${API_BASE}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === "success") {
        setUserData(response.data.user);
        setEditData({
          parentName: response.data.user.parentName || '',
          phone: response.data.user.phone || ''
        });
      } else {
        setError("Failed to load profile");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!editData.parentName.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setSaving(true);
      setError(""); // Clear any previous errors
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await axios.put(`${API_BASE}/api/user/profile`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === "success") {
        setUserData(prev => prev ? { ...prev, ...editData } : null);
        // Update localStorage for navbar greeting
        localStorage.setItem('parentName', editData.parentName);
        setError(""); // Clear any errors on success
      } else {
        setError("Failed to update profile");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestPasswordOTP = async () => {
    try {
      setPasswordLoading(true);
      setError(null);

      const response = await axios.post(`${API_BASE}/api/user/request-password-otp`, {
        email: userData?.email
      });

      if (response.data.status === 'success') {
        setOtpSent(true);
        setPasswordStep(1);
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyOTPAndChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordPolicy = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordPolicy.test(newPassword)) {
      setError('Password must be at least 8 characters long and include an uppercase letter and a special character.');
      return;
    }

    try {
      setPasswordLoading(true);
      setError(null);

      const response = await axios.post(`${API_BASE}/api/user/change-password`, {
        email: userData?.email,
        otp,
        new_password: newPassword
      });

      if (response.data.status === 'success') {
        setSuccessMessage('Password changed successfully!');
        setTimeout(() => {
          setPasswordDialogOpen(false);
          setPasswordStep(0);
          setOtp('');
          setNewPassword('');
          setConfirmPassword('');
          setOtpSent(false);
          setSuccessMessage(null);
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to change password');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordStep(0);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpSent(false);
    setError(null);
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

  // Loading
  if (loading) {
    return (
      <ProfileContainer>
        <Navbar />
        <CenteredBox>
          <Spinner />
          <SpinnerLabel>Loading profile…</SpinnerLabel>
        </CenteredBox>
      </ProfileContainer>
    );
  }

  // Error
  if (error) {
    return (
      <ProfileContainer>
        <Navbar />
        <Box sx={{ paddingTop: "48px" }}>
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        </Box>
      </ProfileContainer>
    );
  }

  const initial = userData?.parentName?.charAt(0).toUpperCase() ?? userData?.email?.charAt(0).toUpperCase() ?? "?";
  const role = userData?.role ?? "user";

  return (
    <ProfileContainer>
      <Navbar />

      <PageHeader>
        <Box>
          <PageTitle>Profile</PageTitle>
          <PageSubtitle>Your account details and agent stats</PageSubtitle>
        </Box>
      </PageHeader>

      {/* Hero card */}
      <HeroCard>
        <HeroGlow />
        <UserAvatar>{initial}</UserAvatar>
        <HeroInfo>
          <HeroEmail>{userData?.parentName || userData?.email}</HeroEmail>
          <RoleBadge
            role={role}
            label={role}
            size="small"
            icon={
              <Box
                sx={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: role === "admin" ? "#f87171" : "#818cf8",
                }}
              />
            }
          />
        </HeroInfo>
        <StatusBadge
          label="Active"
          size="small"
          icon={
            <Box
              sx={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 6px #4ade80",
              }}
            />
          }
        />
      </HeroCard>

      {/* Two info cards */}
      <InfoGrid container>
        {/* Contact */}
        <Grid item xs={12} md={6}>
          <InfoCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <CardTitle>
                <span>✉</span> Contact
              </CardTitle>
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: '#6366f1',
                  '&:hover': { backgroundColor: '#4f46e5' },
                  textTransform: 'none',
                  fontSize: '12px',
                  padding: '4px 12px',
                }}
              >
                {saving ? <CircularProgress size={14} /> : 'Save Changes'}
              </Button>
            </Box>

            <FieldRow>
              <FieldLabel>Email address</FieldLabel>
              <FieldValue sx={{ color: 'rgba(255,255,255,0.5)' }}>{userData?.email} (Cannot be changed)</FieldValue>
            </FieldRow>

            <Divider />

            <FieldRow>
              <FieldLabel>Name</FieldLabel>
              <TextField
                fullWidth
                required
                value={editData.parentName}
                onChange={(e) => setEditData(prev => ({ ...prev, parentName: e.target.value }))}
                placeholder="Enter your name"
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                  },
                  '& .MuiInputBase-input': {
                    padding: '8px 12px',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255,255,255,0.4)',
                  },
                }}
              />
            </FieldRow>

            <Divider />

            <FieldRow>
              <FieldLabel>Phone number</FieldLabel>
              <TextField
                fullWidth
                value={editData.phone}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
                sx={{
                  '& .MuiInputBase-root': {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                  },
                  '& .MuiInputBase-input': {
                    padding: '8px 12px',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255,255,255,0.4)',
                  },
                }}
              />
            </FieldRow>
          </InfoCard>
        </Grid>

        {/* Account */}
        <Grid item xs={12} md={6}>
          <InfoCard>
            <CardTitle>
              <span>🔐</span> Account
            </CardTitle>

            <FieldRow>
              <FieldLabel>Role</FieldLabel>
              <FieldValue>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </FieldValue>
            </FieldRow>

            <Divider />

            <FieldRow>
              <FieldLabel>Member since</FieldLabel>
              <FieldValue>{formatDate(userData?.created_at)}</FieldValue>
            </FieldRow>

            <Divider />

            <FieldRow>
              <FieldLabel>Account status</FieldLabel>
              <StatusBadge
                label="Active"
                size="small"
                icon={
                  <Box
                    sx={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#4ade80",
                      boxShadow: "0 0 6px #4ade80",
                    }}
                  />
                }
              />
            </FieldRow>

            <Divider />

            <FieldRow>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setPasswordDialogOpen(true)}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  textTransform: "none",
                  fontWeight: 600,
                  padding: "10px 16px",
                  "&:hover": {
                    background: "linear-gradient(135deg, #5568d3 0%, #65398a 100%)",
                  },
                }}
              >
                🔑 Change Password
              </Button>
            </FieldRow>
          </InfoCard>
        </Grid>
      </InfoGrid>

      {/* Stats */}
      <StatsCard>
        <CardTitle>
          <span>🤖</span> Agent Overview
        </CardTitle>
        <StatsGrid container>
          <Grid item xs={12} sm={4}>
            <StatBox>
              <StatNumber color="#818cf8">{userData?.agent_count ?? 0}</StatNumber>
              <StatLabel>Connected Agents</StatLabel>
            </StatBox>
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatBox>
              <StatNumber color="#4ade80">{userData?.online_agents ?? 0}</StatNumber>
              <StatLabel>Online Now</StatLabel>
            </StatBox>
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatBox>
              <StatNumber color="#fb923c">{userData?.avg_cpu ?? 0}%</StatNumber>
              <StatLabel>Avg CPU Usage</StatLabel>
            </StatBox>
          </Grid>
        </StatsGrid>
      </StatsCard>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={handleClosePasswordDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(20, 20, 35, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle sx={{ color: "white", fontWeight: "700", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          Change Password
        </DialogTitle>
        <DialogContent sx={{ color: "rgba(255,255,255,0.8)", pt: 3 }}>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2, backgroundColor: "rgba(76, 175, 80, 0.1)", border: "1px solid rgba(76, 175, 80, 0.3)", color: "rgba(76, 175, 80, 0.9)" }}>
              {successMessage}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2, backgroundColor: "rgba(244, 67, 54, 0.1)", border: "1px solid rgba(244, 67, 54, 0.3)", color: "rgba(244, 67, 54, 0.9)" }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={passwordStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel sx={{ color: "white" }}>New Password</StepLabel>
            </Step>
            <Step>
              <StepLabel sx={{ color: "white" }}>Verify OTP</StepLabel>
            </Step>
          </Stepper>

          {passwordStep === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={passwordLoading}
                sx={{
                  "& .MuiInputBase-root": {
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.6)",
                  },
                }}
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={passwordLoading}
                error={Boolean(confirmPassword && newPassword !== confirmPassword)}
                helperText={confirmPassword && newPassword !== confirmPassword ? "Passwords do not match" : ""}
                sx={{
                  "& .MuiInputBase-root": {
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.6)",
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>
                Password must be at least 8 characters long and include at least one uppercase letter and one special character (e.g., !@#$%^&*()).
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                We've sent an OTP to your email. Please enter it below to confirm the password change.
              </Typography>
              <TextField
                fullWidth
                label="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={passwordLoading}
                placeholder="123456"
                inputProps={{ maxLength: 6 }}
                sx={{
                  "& .MuiInputBase-root": {
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                  },
                  "& .MuiInputLabel-root": {
                    color: "rgba(255,255,255,0.6)",
                  },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <Button
            onClick={handleClosePasswordDialog}
            disabled={passwordLoading}
            sx={{ color: "rgba(255,255,255,0.6)" }}
          >
            Cancel
          </Button>
          {passwordStep === 0 ? (
            <Button
              onClick={handleRequestPasswordOTP}
              disabled={passwordLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                fontWeight: 600,
              }}
            >
              {passwordLoading ? <CircularProgress size={20} /> : "Continue"}
            </Button>
          ) : (
            <Button
              onClick={handleVerifyOTPAndChangePassword}
              disabled={passwordLoading || !otp}
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
                color: "white",
                fontWeight: 600,
              }}
            >
              {passwordLoading ? <CircularProgress size={20} /> : "Verify & Change Password"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </ProfileContainer>
  );
};

export default Profile;