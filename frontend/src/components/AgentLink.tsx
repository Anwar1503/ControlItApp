import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Link,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { API_BASE } from "../config/api";

// Styled Components
const GradientBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '500px',
    height: '500px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    top: '-250px',
    right: '-250px',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '50%',
    bottom: '-200px',
    left: '-200px',
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  position: 'relative',
  zIndex: 1,
  maxWidth: '450px',
  width: '100%',
}));

const StyledForm = styled('form')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2.5),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: theme.palette.mode === 'light' ? '#f8f9fa' : undefined,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    
    '&:hover': {
      backgroundColor: theme.palette.mode === 'light' ? '#f0f1f3' : undefined,
    },
    
    '&.Mui-focused': {
      backgroundColor: 'white',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
    },
  },
  '& .MuiOutlinedInput-input': {
    fontSize: '15px',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '10px',
  textTransform: 'none',
  fontSize: '15px',
  fontWeight: '600',
  padding: '12px 24px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f92 100%)',
    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
    transform: 'translateY(-2px)',
  },
  
  '&:disabled': {
    background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
    boxShadow: 'none',
  },
}));

const SuccessCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
  border: '1px solid rgba(76, 175, 80, 0.3)',
  borderRadius: '12px',
  padding: theme.spacing(3),
  textAlign: 'center',
}));

const AgentLink: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('agent_id');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linking, setLinking] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!agentId) {
      setError('Invalid agent link - missing agent ID');
    }
  }, [agentId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/login`, {
        email,
        password
      });

      if (response.data.message === 'Login successful!') {
        await linkAgent(response.data.user_id);
      } else {
        setError('Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const linkAgent = async (userId: string) => {
    setLinking(true);
    try {
      const response = await axios.post(`${API_BASE}/api/agent/link`, {
        agent_id: agentId,
        user_id: userId
      });

      if (response.data.status === 'success') {
        setSuccess(true);
        
        // Clear ALL existing session data to force re-login
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        localStorage.removeItem('is_admin');
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError('Failed to link agent');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to link agent');
    } finally {
      setLinking(false);
    }
  };

  // Invalid link state
  if (!agentId) {
    return (
      <GradientBox>
        <StyledCard>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <InfoIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: '700', mb: 1 }}>
              Invalid Link
            </Typography>
            <Typography variant="body2" color="textSecondary">
              This agent linking link is invalid. Please check the URL and try again, or contact support.
            </Typography>
          </CardContent>
        </StyledCard>
      </GradientBox>
    );
  }

  // Success state
  if (success) {
    return (
      <GradientBox>
        <StyledCard>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: '700', mb: 1 }}>
                Agent Linked Successfully!
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Your agent has been linked to your account. Please log in again to continue...
              </Typography>
              <CircularProgress size={24} />
            </Box>
          </CardContent>
        </StyledCard>
      </GradientBox>
    );
  }

  // Login form state
  return (
    <GradientBox>
      <StyledCard>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: '700',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              Link Agent
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Connect your device to your account
            </Typography>
          </Box>

          {/* Agent ID Info Card */}
          <Alert
            icon={<InfoIcon />}
            severity="info"
            sx={{
              mb: 3,
              backgroundColor: 'rgba(33, 150, 243, 0.08)',
              borderRadius: '10px',
              border: '1px solid rgba(33, 150, 243, 0.2)',
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: '600' }}>
              Agent ID:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontWeight: '600',
                color: 'primary.main',
                mt: 0.5,
                wordBreak: 'break-all',
              }}
            >
              {agentId}
            </Typography>
          </Alert>

          <Divider sx={{ my: 2 }} />

          {/* Error Message */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                borderRadius: '10px',
                backgroundColor: 'rgba(244, 67, 54, 0.08)',
                border: '1px solid rgba(244, 67, 54, 0.2)',
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <StyledForm onSubmit={handleLogin}>
            <Box>
              <Typography
                component="label"
                variant="subtitle2"
                sx={{
                  fontWeight: '600',
                  color: 'text.primary',
                  display: 'block',
                  mb: 1,
                }}
                htmlFor="email"
              >
                Email Address
              </Typography>
              <StyledTextField
                id="email"
                type="email"
                placeholder="you@example.com"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || linking}
                required
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'action.active', mr: 1 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box>
              <Typography
                component="label"
                variant="subtitle2"
                sx={{
                  fontWeight: '600',
                  color: 'text.primary',
                  display: 'block',
                  mb: 1,
                }}
                htmlFor="password"
              >
                Password
              </Typography>
              <StyledTextField
                id="password"
                type="password"
                placeholder="••••••••"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || linking}
                required
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'action.active', mr: 1 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || linking}
              sx={{ mt: 1.5 }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Logging in...
                </Box>
              ) : linking ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Linking Agent...
                </Box>
              ) : (
                'Login & Link Agent'
              )}
            </StyledButton>
          </StyledForm>

          {/* Footer */}
          <Divider sx={{ my: 2.5 }} />
          <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', display: 'block' }}>
            Don't have an account?{' '}
            <Link
              href="/register"
              underline="none"
              sx={{
                fontWeight: '600',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                cursor: 'pointer',
              }}
            >
              Create one
            </Link>
          </Typography>
        </CardContent>
      </StyledCard>
    </GradientBox>
  );
};

export default AgentLink;