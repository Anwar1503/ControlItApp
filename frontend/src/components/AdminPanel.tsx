import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminPanel.css';
import { API_BASE } from "../config/api";
import DownloadsManagement from './DownloadsManagement';

interface AdminPanelProps {
  isAdmin: boolean;
  userId: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isAdmin, userId }) => {
  const navigate = useNavigate();
  const [emailSetupVisible, setEmailSetupVisible] = useState(false);
  const [credentialsStatus, setCredentialsStatus] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'users' | 'downloads'>('users');
  
  // Get user name for greeting
  const userName = localStorage.getItem('parentName') || localStorage.getItem('email')?.split('@')[0] || 'Admin';

  console.log("API BASE =", process.env.REACT_APP_API_URL);

  useEffect(() => {
    if (isAdmin) {
      checkEmailCredentials();
      fetchUsersWithAgents();
    }
  }, [isAdmin]);

  const checkEmailCredentials = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/admin/check-email-credentials`,
        {
          headers: {
            'user_role': 'admin'
          }
        }
      );
      setCredentialsStatus(response.data);
    } catch (error) {
      console.error('Error checking credentials:', error);
    }
  };

  const fetchUsersWithAgents = async () => {
    try {
      setUsersLoading(true);
      const response = await axios.get(`${API_BASE}/api/admin/users-with-agents`, {
        headers: {
          'user_role': 'admin'
        }
      });
      if (response.data.status === 'success') {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const changeUserRole = async (targetUserId: string, newRole: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm(`Are you sure you want to change this user to ${newRole}?`)) {
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/admin/change-user-role`, {
        user_id: targetUserId,
        role: newRole
      }, {
        headers: {
          'user_role': 'admin'
        }
      });

      if (response.data.status === 'success') {
        alert(`User role changed to ${newRole}!`);
        fetchUsersWithAgents(); // Refresh user list
      } else {
        alert(`Failed to change role: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Error changing user role:', error);
      alert(`Error changing role: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-panel admin-denied">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You do not have admin privileges.</p>
          <button onClick={() => navigate('/logout')}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '600', color: '#f1f5f9' }}>
              Hi {userName}! 👋
            </h2>
            <h1>Admin Panel</h1>
          </div>
          <button className="back-btn" onClick={() => navigate('/logout')}>
            🚪 Logout
          </button>
        </div>

        {/* Admin Navigation */}
        <div style={{display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px'}}>
          <button
            onClick={() => setActiveSection('users')}
            style={{
              background: activeSection === 'users' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
              border: activeSection === 'users' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            👥 Users Management
          </button>
          <button
            onClick={() => setActiveSection('downloads')}
            style={{
              background: activeSection === 'downloads' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
              border: activeSection === 'downloads' ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            📥 Downloads Management
          </button>
        </div>

        <div className="admin-content">
          {activeSection === 'users' ? (
            <>
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

          {/* User Management */}
          <div className="admin-card">
            <div className="card-header">
              <h2>User Management</h2>
            </div>
            <div className="card-body">
              {usersLoading ? (
                <p>Loading users...</p>
              ) : users.length === 0 ? (
                <p>No users found.</p>
              ) : (
                <div className="users-list">
                  {users.map((user) => {
                    const isCurrentAdmin = String(user.id) === String(userId);
                    return (
                      <div
                        key={user.id}
                        className="user-item"
                        onClick={() => navigate(`/user/${user.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="user-info">
                          <p>
                            <strong>Email:</strong> {user.email}
                            {isCurrentAdmin && (
                              <span style={{ marginLeft: 8, color: '#555', fontStyle: 'italic' }}>
                                (You)
                              </span>
                            )}
                          </p>
                          <p>
                            <strong>Role:</strong>
                            <span className={`role-badge ${user.role}`}>
                              {user.role === 'admin' ? 'Administrator' : 'User'}
                            </span>
                          </p>
                          <p><strong>Connected Agents:</strong> {user.agent_count}</p>
                        </div>
                        <div className="user-actions" onClick={(e) => e.stopPropagation()}>
                          {user.role === 'user' ? (
                            <button
                              className="action-btn promote-btn"
                              onClick={() => changeUserRole(user.id, 'admin')}
                            >
                              Promote to Admin
                            </button>
                          ) : (
                            <button
                              className="action-btn demote-btn"
                              disabled={isCurrentAdmin}
                              title={isCurrentAdmin ? "You cannot demote yourself" : "Demote this user to a regular user"}
                              onClick={() => changeUserRole(user.id, 'user')}
                            >
                              Demote to User
                            </button>
                          )}
                          <button
                            className="action-btn view-btn"
                            onClick={() => navigate(`/user/${user.id}`)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
            </>
          ) : (
            <DownloadsManagement />
          )}
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
        `${API_BASE}/api/admin/setup-email-credentials`,
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
      console.log("error during save",err)
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
