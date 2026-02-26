import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminPanel.css';

interface AdminPanelProps {
  isAdmin: boolean;
  userId: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isAdmin, userId }) => {
  const navigate = useNavigate();
  const [emailSetupVisible, setEmailSetupVisible] = useState(false);
  const [credentialsStatus, setCredentialsStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      checkEmailCredentials();
    }
  }, [isAdmin]);

  const checkEmailCredentials = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/admin/check-email-credentials`,
        {
          headers: {
            'user_role': 'admin'
          }
        }
      );
      setCredentialsStatus(response.data);
    } catch (error) {
      console.error('Error checking credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-panel admin-denied">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You do not have admin privileges.</p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
        </div>

        <div className="admin-content">
          {/* Email Credentials Setup Card */}
          <div className="admin-card">
            <div className="card-header">
              <h2>Email Credentials Setup</h2>
              {credentialsStatus?.configured && (
                <span className="status-badge success">✓ Configured</span>
              )}
              {credentialsStatus === false ||
                (!credentialsStatus?.configured && (
                  <span className="status-badge warning">⚠ Not Configured</span>
                ))}
            </div>

            <div className="card-body">
              {credentialsStatus?.configured && (
                <div className="configured-info">
                  <p>
                    <strong>Email:</strong> {credentialsStatus.email}
                  </p>
                  <p className="info-text">
                    Your email credentials are securely stored in the database.
                  </p>
                </div>
              )}

              {!credentialsStatus?.configured && (
                <div className="not-configured-info">
                  <p>
                    Email credentials are not set up. Setup is required to send OTPs
                    during user registration.
                  </p>
                </div>
              )}

              <button
                className="primary-btn"
                onClick={() => setEmailSetupVisible(!emailSetupVisible)}
              >
                {emailSetupVisible ? 'Cancel' : credentialsStatus?.configured ? 'Update Credentials' : 'Setup Now'}
              </button>
            </div>

            {emailSetupVisible && (
              <EmailCredentialsForm
                onSuccess={() => {
                  setEmailSetupVisible(false);
                  checkEmailCredentials();
                }}
                onCancel={() => setEmailSetupVisible(false)}
              />
            )}
          </div>

          {/* Additional Admin Info */}
          <div className="admin-card">
            <div className="card-header">
              <h2>System Information</h2>
            </div>
            <div className="card-body">
              <p>
                <strong>Your Role:</strong> Administrator
              </p>
              <p>
                <strong>User ID:</strong> {userId}
              </p>
              <p className="info-text">
                You have access to all admin functions and can configure system settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EmailCredentialsFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const EmailCredentialsForm: React.FC<EmailCredentialsFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/setup-email-credentials`,
        {
          email,
          password,
          user_role: 'admin'
        }
      );

      if (response.data.status === 'success') {
        setSuccess('Email credentials saved successfully!');
        setTimeout(() => {
          setEmail('');
          setPassword('');
          onSuccess();
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to save credentials');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="credentials-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email">Gmail Address</label>
        <input
          id="email"
          type="email"
          placeholder="your-email@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <small>Use your Gmail address</small>
      </div>

      <div className="form-group">
        <label htmlFor="password">Gmail App Password</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <small>
          Use{' '}
          <a
            href="https://myaccount.google.com/apppasswords"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gmail App Password
          </a>
          , not your regular password
        </small>
      </div>

      {error && <div className="error-message form-message">{error}</div>}
      {success && <div className="success-message form-message">{success}</div>}

      <div className="form-actions">
        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? 'Saving...' : 'Save Credentials'}
        </button>
        <button
          type="button"
          className="secondary-btn"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AdminPanel;
