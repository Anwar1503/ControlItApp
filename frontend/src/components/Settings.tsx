import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
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

const SettingsContainer = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)",
  minHeight: "100vh",
  color: "white",
}));

const SettingsCard = styled(Card)(({ theme }) => ({
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  borderRadius: "16px",
  color: "white",
}));

const Settings: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password change dialog
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [otpDialog, setOtpDialog] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.status === 'success') {
        const user = response.data.user;
        setUserData(user);
        setEmail(user.email || "");
        setPhone(user.phone || "");
      } else {
        setError('Failed to load profile');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);

      const response = await axios.put(`${API_BASE}/api/user/profile`, {
        email,
        phone
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.status === 'success') {
        setSuccess('Profile updated successfully!');
        // Update local storage if email changed
        if (email !== userData.email) {
          localStorage.setItem('email', email);
        }
        setUserData({ ...userData, email, phone });
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestPasswordOTP = async () => {
    try {
      setOtpLoading(true);
      setError(null);

      const response = await axios.post(`${API_BASE}/api/user/request-password-otp`, {
        email: userData.email
      });

      if (response.data.status === 'success') {
        setOtpSent(true);
        setOtpDialog(true);
        setPasswordDialog(false);
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      console.error('Error requesting OTP:', err);
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTPAndChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setOtpLoading(true);
      setError(null);

      const response = await axios.post(`${API_BASE}/api/user/change-password`, {
        email: userData.email,
        otp,
        new_password: newPassword
      });

      if (response.data.status === 'success') {
        setSuccess('Password changed successfully!');
        setOtpDialog(false);
        setOtp("");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setOtpSent(false);
      } else {
        setError(response.data.message || 'Failed to change password');
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setOtpLoading(false);
    }
  };

  const passwordSteps = ['Enter New Password', 'Verify OTP'];

  if (loading) {
    return (
      <SettingsContainer>
        <Navbar />
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <CircularProgress />
        </Box>
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer>
      <Navbar />

      <Box sx={{ p: 3, maxWidth: "800px", mx: "auto" }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: "800",
            mb: 4,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Account Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Settings */}
          <Grid item xs={12}>
            <SettingsCard>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "700", mb: 3, color: "primary.main" }}>
                  📝 Profile Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      sx={{
                        '& .MuiInputBase-root': {
                          color: 'white',
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255,255,255,0.7)',
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255,255,255,0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      sx={{
                        '& .MuiInputBase-root': {
                          color: 'white',
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255,255,255,0.7)',
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255,255,255,0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleUpdateProfile}
                    disabled={updating}
                    sx={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      '&:hover': {
                        background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                      }
                    }}
                  >
                    {updating ? <CircularProgress size={20} /> : 'Update Profile'}
                  </Button>
                </Box>
              </CardContent>
            </SettingsCard>
          </Grid>

          {/* Password Settings */}
          <Grid item xs={12}>
            <SettingsCard>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: "700", mb: 3, color: "primary.main" }}>
                  🔐 Change Password
                </Typography>

                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}>
                  Password changes require email verification for security.
                </Typography>

                <Button
                  variant="outlined"
                  onClick={() => setPasswordDialog(true)}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.5)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    }
                  }}
                >
                  Change Password
                </Button>
              </CardContent>
            </SettingsCard>
          </Grid>
        </Grid>
      </Box>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialog}
        onClose={() => setPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            color: "white",
          }
        }}
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
            InputProps={{
              sx: { color: 'white' }
            }}
            InputLabelProps={{
              sx: { color: 'rgba(255,255,255,0.7)' }
            }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: { color: 'white' }
            }}
            InputLabelProps={{
              sx: { color: 'rgba(255,255,255,0.7)' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleRequestPasswordOTP}
            disabled={otpLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            sx={{ color: 'primary.main' }}
          >
            {otpLoading ? <CircularProgress size={20} /> : 'Send OTP'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog
        open={otpDialog}
        onClose={() => setOtpDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            color: "white",
          }
        }}
      >
        <DialogTitle>Verify Email</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            We've sent a verification code to {userData?.email}
          </Typography>
          <TextField
            fullWidth
            label="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: { color: 'white' }
            }}
            InputLabelProps={{
              sx: { color: 'rgba(255,255,255,0.7)' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpDialog(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleVerifyOTPAndChangePassword}
            disabled={otpLoading || !otp}
            sx={{ color: 'primary.main' }}
          >
            {otpLoading ? <CircularProgress size={20} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </SettingsContainer>
  );
};

export default Settings;