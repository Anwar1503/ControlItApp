import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  LinearProgress,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Navbar from "./Navbar";
import { API_BASE } from "../config/api";
import {
  Monitor as MonitorIcon,
  Power as PowerIcon,
  Lock as LockIcon,
  Smartphone as SmartphoneIcon,
  MoreHorizontal as MoreVertIcon,
  RotateCw as RefreshIcon,
  AlertCircle as AlertCircleIcon,
  CheckCircle as CheckCircleIcon,
  Activity as ActivityIcon,
  Users as UsersIcon,
  Clock as ClockIcon,
  Zap as ZapIcon,
} from "lucide-react";

// Styled Components
const DashboardContainer = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)",
  minHeight: "100vh",
  padding: theme.spacing(3),
  color: "white",
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "16px",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",

  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%)",
    opacity: 0,
    transition: "opacity 0.3s",
    pointerEvents: "none",
  },

  "&:hover": {
    background: "rgba(255, 255, 255, 0.12)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    transform: "translateY(-4px)",
    boxShadow: "0 20px 40px rgba(102, 126, 234, 0.2)",

    "&::before": {
      opacity: 1,
    },
  },
}));

const AgentCard = styled(Card)(({ theme }) => ({
  background: "rgba(255, 255, 255, 0.06)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "14px",
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(2),
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

  "&:hover": {
    background: "rgba(255, 255, 255, 0.09)",
    border: "1px solid rgba(102, 126, 234, 0.4)",
    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.15)",
  },
}));

const StatusBadge = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  borderRadius: "8px",
  fontSize: "13px",
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: "600",
  padding: "6px 14px",
  fontSize: "13px",
  transition: "all 0.3s ease",

  "&:hover": {
    transform: "translateY(-2px)",
  },
}));

// Mock Data - Used as fallback only
const mockAgents = [
  {
    agent_id: "agent-001",
    user_email: "john@example.com",
    system_info: {
      type: "Windows",
      status: "online",
      lastSeen: "2 mins ago",
      ipAddress: "192.168.1.45",
      osVersion: "Windows 11 Pro",
      ram: "16GB",
      cpu: "Intel i7",
      cpuUsage: 45,
      ramUsage: 62,
    },
    last_heartbeat: new Date(),
  },
];

interface Agent {
  agent_id: string;
  id?: string;
  name?: string;
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
  };
  last_heartbeat?: string | Date;
  type?: string;
  status?: string;
  ipAddress?: string;
  osVersion?: string;
  ram?: string;
  cpu?: string;
  cpuUsage?: number;
  ramUsage?: number;
  lastSeen?: string;
}

const Dashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [infoAgent, setInfoAgent] = useState<Agent | null>(null);
  const [commandDialog, setCommandDialog] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is admin and redirect to admin panel
  useEffect(() => {
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    if (isAdmin) {
      // Redirect admins to admin panel
      window.location.href = '/admin';
      return;
    }
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const role = localStorage.getItem('role') || 'user';
      const userId = localStorage.getItem('user_id');
      
      if (!userId) {
        setError('User not logged in');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE}/api/admin/agents`, {
        params: {
          user_role: role,
          user_id: userId,
        },
      });
      
      if (response.data.agents) {
        const formatteAgents = response.data.agents.map((agent: any) => ({
          ...agent,
          name: agent.name || agent.user_email || agent.agent_id,
          type: agent.system_info?.type || 'Unknown',
          status: agent.system_info?.status || 'offline',
          ipAddress: agent.system_info?.ipAddress || 'N/A',
          osVersion: agent.system_info?.osVersion || 'Unknown',
          ram: agent.system_info?.ram || 'N/A',
          cpu: agent.system_info?.cpu || 'N/A',
          cpuUsage: agent.system_info?.cpuUsage || 0,
          ramUsage: agent.system_info?.ramUsage || 0,
          lastSeen: 'Just now',
          id: agent.agent_id,
        }));
        setAgents(formatteAgents);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents');
      // Fall back to mock data
      setAgents(mockAgents.map((agent: any) => ({
        ...agent,
        name: agent.name || agent.user_email || agent.agent_id,
        type: agent.system_info?.type || 'Unknown',
        status: agent.system_info?.status || 'offline',
        ipAddress: agent.system_info?.ipAddress || 'N/A',
        osVersion: agent.system_info?.osVersion || 'Unknown',
        ram: agent.system_info?.ram || 'N/A',
        cpu: agent.system_info?.cpu || 'N/A',
        cpuUsage: agent.system_info?.cpuUsage || 0,
        ramUsage: agent.system_info?.ramUsage || 0,
        lastSeen: 'Unknown',
        id: agent.agent_id,
      })));
    } finally {
      setLoading(false);
    }
  };

  const onlineAgents = agents.filter((a) => a.status === "online").length;
  const offlineAgents = agents.filter((a) => a.status === "offline").length;
  const avgCpuUsage =
    Math.round(
      agents.reduce((sum, a) => sum + (a.cpuUsage || 0), 0) / (agents.length || 1)
    );
  const avgRamUsage =
    Math.round(
      agents.reduce((sum, a) => sum + (a.ramUsage || 0), 0) / (agents.length || 1)
    );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAgents();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, agent: Agent) => {
    setAnchorEl(event.currentTarget);
    setSelectedAgent(agent);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCommand = (command: string) => {
    setSelectedCommand(command);
    setCommandDialog(true);
    handleMenuClose();
  };

  const executeCommand = async () => {
    if (selectedAgent && selectedCommand) {
      try {
        const role = localStorage.getItem('role') || 'user';
        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
          alert('User not logged in');
          return;
        }
        
        await axios.post(`${API_BASE}/api/admin/agent/command`, {
          agent_id: selectedAgent.agent_id || selectedAgent.id,
          command: selectedCommand,
          user_role: role,
          user_id: userId,
        });
        console.log(`Executing ${selectedCommand} on ${selectedAgent.name}`);
        
        // Show success message or refresh agents
        await fetchAgents();
      } catch (err) {
        console.error('Error executing command:', err);
        alert('Failed to execute command');
      }
    }
    setCommandDialog(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "success";
      case "offline":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <DashboardContainer>
      <Navbar />

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            mb: 3,
            backgroundColor: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.3)",
            color: "rgba(244, 67, 54, 0.9)",
          }}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
      {/* Header Section */}
      <Box sx={{ mb: 4, mt: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: "800",
                background:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 0.5,
              }}
            >
              Control Center
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
              Manage and monitor all your connected agents in real-time
            </Typography>
          </Box>
          <Tooltip title="Refresh data">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                color: "white",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "10px",
                padding: "12px",

                "&:hover": {
                  background: "rgba(102, 126, 234, 0.1)",
                },
              }}
            >
              {refreshing ? (
                <CircularProgress size={20} />
              ) : (
                <RefreshIcon style={{ width: "20px", height: "20px" }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        fontWeight: "600",
                        mb: 1,
                      }}
                    >
                      Total Agents
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: "800", color: "white" }}
                    >
                      {agents.length}
                    </Typography>
                  </Box>
                  <SmartphoneIcon
                    style={{ width: "32px", height: "32px", color: "rgba(102, 126, 234, 0.7)" }}
                  />
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        fontWeight: "600",
                        mb: 1,
                      }}
                    >
                      Online
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: "800", color: "#4caf50" }}
                    >
                      {onlineAgents}
                    </Typography>
                  </Box>
                  <CheckCircleIcon
                    style={{ width: "32px", height: "32px", color: "rgba(76, 175, 80, 0.7)" }}
                  />
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        fontWeight: "600",
                        mb: 1,
                      }}
                    >
                      Offline
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: "800", color: "#f44336" }}
                    >
                      {offlineAgents}
                    </Typography>
                  </Box>
                  <AlertCircleIcon
                    style={{ width: "32px", height: "32px", color: "rgba(244, 67, 54, 0.7)" }}
                  />
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        fontWeight: "600",
                        mb: 1,
                      }}
                    >
                      Avg CPU Usage
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: "800", color: "white" }}
                    >
                      {avgCpuUsage}%
                    </Typography>
                  </Box>
                  <ZapIcon
                    style={{ width: "32px", height: "32px", color: "rgba(255, 193, 7, 0.7)" }}
                  />
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
        </Grid>
      </Box>

      {/* Agents Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: "700",
            mb: 2.5,
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <MonitorIcon style={{ width: "20px", height: "20px" }} />
          Connected Agents
        </Typography>

        <Grid container spacing={2}>
          {agents.map((agent) => (
            <Grid item xs={12} md={6} key={agent.id}>
              <AgentCard>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: "700", color: "white", mb: 0.5 }}
                    >
                      {agent.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {agent.type} • {agent.ipAddress}
                    </Typography>
                  </Box>
                  <StatusBadge
                    label={(agent.status || "offline").charAt(0).toUpperCase() + (agent.status || "offline").slice(1)}
                    color={getStatusColor(agent.status || "offline")}
                    icon={
                      (agent.status || "offline") === "online" ? (
                        <CheckCircleIcon style={{ width: "14px", height: "14px" }} />
                      ) : (
                        <AlertCircleIcon style={{ width: "14px", height: "14px" }} />
                      )
                    }
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.6)", fontWeight: "600" }}
                    >
                      CPU Usage
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "white", fontWeight: "700" }}
                    >
                      {agent.cpuUsage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={agent.cpuUsage || 0}
                    sx={{
                      height: 6,
                      borderRadius: "3px",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      "& .MuiLinearProgress-bar": {
                        background:
                          "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                      },
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.6)", fontWeight: "600" }}
                    >
                      RAM Usage
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "white", fontWeight: "700" }}
                    >
                      {agent.ramUsage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={agent.ramUsage || 0}
                    sx={{
                      height: 6,
                      borderRadius: "3px",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      "& .MuiLinearProgress-bar": {
                        background:
                          (agent.ramUsage || 0) > 80
                            ? "linear-gradient(90deg, #f44336 0%, #e91e63 100%)"
                            : "linear-gradient(90deg, #4caf50 0%, #45a049 100%)",
                      },
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.5)",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ClockIcon style={{ width: "14px", height: "14px" }} />
                    Last seen: {agent.lastSeen}
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <ActionButton
                    size="small"
                    variant="outlined"
                    startIcon={<MonitorIcon style={{ width: "16px", height: "16px" }} />}
                    disabled={agent.status === "offline"}
                    onClick={() => setInfoAgent(agent)}
                    sx={{
                      color: "white",
                      borderColor: "rgba(255,255,255,0.2)",
                      flex: 1,

                      "&:hover": {
                        borderColor: "rgba(102, 126, 234, 0.6)",
                        backgroundColor: "rgba(102, 126, 234, 0.1)",
                      },
                    }}
                  >
                    Info
                  </ActionButton>
                  <Tooltip title="More options">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, agent)}
                      disabled={agent.status === "offline"}
                      sx={{
                        color: "white",
                        borderColor: "rgba(255,255,255,0.2)",
                        border: "1px solid",
                        borderRadius: "8px",

                        "&:hover": {
                          borderColor: "rgba(102, 126, 234, 0.6)",
                          backgroundColor: "rgba(102, 126, 234, 0.1)",
                        },
                      }}
                    >
                      <MoreVertIcon style={{ width: "16px", height: "16px" }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </AgentCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: "rgba(20, 20, 35, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "10px",

            "& .MuiMenuItem-root": {
              color: "white",
              fontSize: "14px",
              fontWeight: "500",

              "&:hover": {
                backgroundColor: "rgba(102, 126, 234, 0.1)",
              },
            },
          },
        }}
      >
        <MenuItem onClick={() => handleCommand("lock")}>
          <LockIcon style={{ width: "16px", height: "16px", marginRight: "8px" }} />
          Lock Device
        </MenuItem>
        <MenuItem onClick={() => handleCommand("shutdown")}>
          <PowerIcon style={{ width: "16px", height: "16px", marginRight: "8px" }} />
          Shutdown
        </MenuItem>
        <MenuItem onClick={() => handleCommand("restart")}>
          <RefreshIcon style={{ width: "16px", height: "16px", marginRight: "8px" }} />
          Restart
        </MenuItem>
      </Menu>

      {/* Command Confirmation Dialog */}
      <Dialog
        open={commandDialog}
        onClose={() => setCommandDialog(false)}
        PaperProps={{
          sx: {
            background: "rgba(20, 20, 35, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle sx={{ color: "white", fontWeight: "700" }}>
          Confirm Action
        </DialogTitle>
        <DialogContent sx={{ color: "rgba(255,255,255,0.8)" }}>
          <Alert
            severity="warning"
            sx={{
              backgroundColor: "rgba(255, 193, 7, 0.1)",
              border: "1px solid rgba(255, 193, 7, 0.3)",
              color: "rgba(255, 193, 7, 0.9)",
            }}
          >
            Are you sure you want to{" "}
            <strong>
              {selectedCommand === "lock"
                ? "lock"
                : selectedCommand === "shutdown"
                ? "shutdown"
                : "restart"}
            </strong>{" "}
            <strong>{selectedAgent?.name}</strong>?
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setCommandDialog(false)}
            sx={{ color: "rgba(255,255,255,0.6)" }}
          >
            Cancel
          </Button>
          <Button
            onClick={executeCommand}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #f44336 0%, #e91e63 100%)",
              color: "white",
              fontWeight: "600",

              "&:hover": {
                background:
                  "linear-gradient(135deg, #e53935 0%, #c2185b 100%)",
              },
            }}
          >
            {selectedCommand === "lock"
              ? "Lock"
              : selectedCommand === "shutdown"
              ? "Shutdown"
              : "Restart"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Agent Info Dialog */}
      <Dialog
        open={Boolean(infoAgent)}
        onClose={() => setInfoAgent(null)}
        PaperProps={{
          sx: {
            background: "rgba(20, 20, 35, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle sx={{ color: "white", fontWeight: "700" }}>
          Agent Details
        </DialogTitle>
        <DialogContent sx={{ color: "rgba(255,255,255,0.8)" }}>
          <Typography sx={{ mb: 1 }}>
            {`PC Name: ${infoAgent?.name || infoAgent?.agent_id}`}
          </Typography>
          <Typography sx={{ mb: 1 }}>
            {`Status: ${infoAgent?.status || "Unknown"}`}
          </Typography>
          <Typography sx={{ mb: 1 }}>
            {`Last Heartbeat: ${infoAgent?.last_heartbeat || "N/A"}`}
          </Typography>
          {infoAgent?.system_info && (
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>
                System Info
              </Typography>
              <Typography>
                {`OS: ${infoAgent.system_info.osVersion || "N/A"}`}
              </Typography>
              <Typography>
                {`IP: ${infoAgent.system_info.ipAddress || "N/A"}`}
              </Typography>
              <Typography>
                {`CPU: ${infoAgent.system_info.cpu || "N/A"}`}
              </Typography>
              <Typography>
                {`RAM: ${infoAgent.system_info.ram || "N/A"}`}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setInfoAgent(null)}
            sx={{ color: "rgba(255,255,255,0.6)" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
        </>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;