import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseSessionTimeoutOptions {
  timeout?: number; // in milliseconds, default 30 minutes
  promptBefore?: number; // show warning before logout, in milliseconds, default 5 minutes
  onPrompt?: () => void;
  onTimeout?: () => void;
}

export const useSessionTimeout = (options: UseSessionTimeoutOptions = {}) => {
  const {
    timeout = 30 * 60 * 1000, // 30 minutes
    promptBefore = 5 * 60 * 1000, // 5 minutes
    onPrompt,
    onTimeout
  } = options;

  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const promptRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(() => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('email');
    localStorage.removeItem('parentName');
    localStorage.removeItem('role');
    localStorage.removeItem('is_admin');

    // Call custom timeout handler if provided
    onTimeout?.();

    // Redirect to login
    navigate('/login');
  }, [navigate, onTimeout]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (promptRef.current) {
      clearTimeout(promptRef.current);
    }

    // Only set timers if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) return;

    // Set prompt timer (show warning before actual logout)
    promptRef.current = setTimeout(() => {
      onPrompt?.();
    }, timeout - promptBefore);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeout);
  }, [timeout, promptBefore, onPrompt, logout]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Set initial timer
    resetTimer();

    // Activity event listeners
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (promptRef.current) {
        clearTimeout(promptRef.current);
      }
    };
  }, [handleActivity, resetTimer]);

  // Return function to manually reset timer (useful for programmatic resets)
  return {
    resetTimer,
    logout
  };
};