import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from "../config/api";

interface Agent {
  agent_id: string;
  user_email?: string;
  system_info?: {
    type?: string;
    status?: string;
    lastSeen?: string;
    ipAddress?: string;
    osVersion?: string;
    ram?: string;
    cpu?: string;
    cpuUsage?: number;
    ramUsage?: number;
    uptime?: number;
    running_apps?: any[];
  };
  last_heartbeat?: string | Date;
}

const UserDetails: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  const fetchUserAgents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/admin/user-agents/${userId}`, {
        headers: {
          'user_role': 'admin'
        }
      });

      if (response.data.status === 'success') {
        setAgents(response.data.agents);
        if (response.data.agents.length > 0 && response.data.agents[0].user_email) {
          setUserEmail(response.data.agents[0].user_email);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching user agents:', err);
      setError('Failed to load user agents');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserAgents();
    }
  }, [userId, fetchUserAgents]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading user agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <p>{error}</p>
        <button onClick={() => navigate('/admin')}>Back to Admin Panel</button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: '0', fontSize: '2rem', fontWeight: '700' }}>
              User Details
            </h1>
            <p style={{ margin: '5px 0 0 0', opacity: '0.9' }}>
              {userEmail || 'Unknown User'} - {agents.length} Connected Agent{agents.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid white',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
          >
            ← Back to Admin
          </button>
        </div>

        <div style={{ padding: '30px' }}>
          {agents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ fontSize: '1.2rem', color: '#666' }}>
                No agents connected to this user.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {agents.map((agent) => (
                <div key={agent.agent_id} style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '20px',
                  background: '#f9f9f9'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>
                        Agent ID: {agent.agent_id}
                      </h3>
                      <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                        <strong>Last Heartbeat:</strong> {agent.last_heartbeat ?
                          new Date(agent.last_heartbeat).toLocaleString() : 'Never'}
                      </p>
                      {agent.system_info && (
                        <>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                            <strong>Status:</strong> {agent.system_info.status || 'Unknown'}
                          </p>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                            <strong>OS:</strong> {agent.system_info.osVersion || 'Unknown'}
                          </p>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                            <strong>IP Address:</strong> {agent.system_info.ipAddress || 'N/A'}
                          </p>
                        </>
                      )}
                    </div>
                    <div>
                      {agent.system_info && (
                        <div style={{
                          background: '#f0f0f0',
                          padding: '15px',
                          borderRadius: '5px'
                        }}>
                          <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>System Info</h4>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                            <strong>CPU:</strong> {agent.system_info.cpu || 'N/A'} ({agent.system_info.cpuUsage || 0}% usage)
                          </p>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                            <strong>RAM:</strong> {agent.system_info.ram || 'N/A'} ({agent.system_info.ramUsage || 0}% usage)
                          </p>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                            <strong>Uptime:</strong> {agent.system_info.uptime ?
                              `${Math.floor(agent.system_info.uptime / 3600)}h ${Math.floor((agent.system_info.uptime % 3600) / 60)}m` :
                              'N/A'}
                          </p>
                          <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                            <strong>Running Apps:</strong> {agent.system_info.running_apps?.length || 0}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '5px',
                    color: '#856404'
                  }}>
                    <strong>Note:</strong> As an administrator, you can view agent details but cannot control them.
                    Only the user who owns this agent can send lock/shutdown commands.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetails;