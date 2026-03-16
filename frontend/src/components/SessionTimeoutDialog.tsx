import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Clock, AlertTriangle } from 'lucide-react';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '16px',
    padding: theme.spacing(1),
    maxWidth: '400px',
  },
}));

const WarningIcon = styled(AlertTriangle)({
  color: '#f59e0b',
  width: '24px',
  height: '24px',
});

const TimerIcon = styled(Clock)({
  color: '#ef4444',
  width: '20px',
  height: '20px',
});

interface SessionTimeoutDialogProps {
  open: boolean;
  onExtend: () => void;
  onLogout: () => void;
  timeLeft: number; // in seconds
}

const SessionTimeoutDialog: React.FC<SessionTimeoutDialogProps> = ({
  open,
  onExtend,
  onLogout,
  timeLeft,
}) => {
  const [countdown, setCountdown] = useState(timeLeft);

  useEffect(() => {
    setCountdown(timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, onLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressValue = (countdown / timeLeft) * 100;

  return (
    <StyledDialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <WarningIcon />
          <Typography variant="h6" component="span" fontWeight={600}>
            Session Timeout Warning
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          Your session will expire in <strong>{formatTime(countdown)}</strong> due to inactivity.
        </Typography>

        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          You will be automatically logged out to protect your account security.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: countdown > 60 ? '#f59e0b' : '#ef4444',
                borderRadius: 4,
              },
            }}
          />
        </Box>

        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <TimerIcon />
          <Typography variant="caption" color="error">
            Auto-logout in {formatTime(countdown)}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
        <Button
          onClick={onLogout}
          variant="outlined"
          color="error"
          sx={{ minWidth: 100 }}
        >
          Logout Now
        </Button>
        <Button
          onClick={onExtend}
          variant="contained"
          sx={{
            minWidth: 100,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5855eb, #7c3aed)',
            },
          }}
        >
          Stay Logged In
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default SessionTimeoutDialog;