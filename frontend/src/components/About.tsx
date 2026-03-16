import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Navbar from "./Navbar";
import {
  Shield as ShieldIcon,
  Monitor as MonitorIcon,
  Users as UsersIcon,
  Zap as ZapIcon,
  Lock as LockIcon,
  Smartphone as SmartphoneIcon,
} from "lucide-react";

const AboutContainer = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)",
  minHeight: "100vh",
  color: "white",
}));

const AboutCard = styled(Card)(({ theme }) => ({
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  borderRadius: "16px",
  color: "white",
}));

const About = () => (
  <AboutContainer>
    <Navbar />

    <Box sx={{ p: 3, maxWidth: "1000px", mx: "auto" }}>
      <Typography
        variant="h3"
        sx={{
          fontWeight: "800",
          mb: 2,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center",
        }}
      >
        About ControlIt
      </Typography>

      <Typography
        variant="h6"
        sx={{
          color: "rgba(255, 255, 255, 0.7)",
          textAlign: "center",
          mb: 4,
          fontWeight: "400",
        }}
      >
        Remote Agent Management System
      </Typography>

      <Grid container spacing={3}>
        {/* Main Description */}
        <Grid item xs={12}>
          <AboutCard>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: "700", mb: 2, color: "primary.main" }}>
                🚀 What is ControlIt?
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                <strong>ControlIt</strong> is a comprehensive remote agent management system designed for secure and efficient control of client machines.
                Our platform enables administrators and users to remotely monitor, manage, and control connected agents with enterprise-grade security.
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                Built with modern web technologies, ControlIt provides a seamless experience for linking agents, sending commands,
                and maintaining real-time oversight of your connected devices.
              </Typography>
            </CardContent>
          </AboutCard>
        </Grid>

        {/* Key Features */}
        <Grid item xs={12} md={6}>
          <AboutCard>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", mb: 3, color: "primary.main" }}>
                ✨ Key Features
              </Typography>
              <List sx={{ p: 0 }}>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ShieldIcon style={{ width: "20px", height: "20px", color: "#4caf50" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Secure Agent Linking"
                    secondary="JWT-based authentication with OTP verification"
                    primaryTypographyProps={{ sx: { color: "white", fontWeight: "600" } }}
                    secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.7)" } }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <MonitorIcon style={{ width: "20px", height: "20px", color: "#2196f3" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Real-time Monitoring"
                    secondary="Live system metrics and heartbeat tracking"
                    primaryTypographyProps={{ sx: { color: "white", fontWeight: "600" } }}
                    secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.7)" } }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ZapIcon style={{ width: "20px", height: "20px", color: "#ff9800" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Remote Commands"
                    secondary="Lock screen, shutdown, and custom commands"
                    primaryTypographyProps={{ sx: { color: "white", fontWeight: "600" } }}
                    secondaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.7)" } }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </AboutCard>
        </Grid>

        {/* Technology Stack */}
        <Grid item xs={12} md={6}>
          <AboutCard>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", mb: 3, color: "primary.main" }}>
                🛠 Technology Stack
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
                <Chip label="React" sx={{ bgcolor: "rgba(97, 218, 251, 0.2)", color: "#61dafb" }} />
                <Chip label="TypeScript" sx={{ bgcolor: "rgba(0, 122, 204, 0.2)", color: "#007acc" }} />
                <Chip label="Material-UI" sx={{ bgcolor: "rgba(25, 118, 210, 0.2)", color: "#1976d2" }} />
                <Chip label="Flask" sx={{ bgcolor: "rgba(0, 0, 0, 0.2)", color: "white" }} />
                <Chip label="Python" sx={{ bgcolor: "rgba(52, 101, 164, 0.2)", color: "#3465a4" }} />
                <Chip label="MongoDB" sx={{ bgcolor: "rgba(71, 162, 56, 0.2)", color: "#47a238" }} />
                <Chip label="Docker" sx={{ bgcolor: "rgba(13, 183, 237, 0.2)", color: "#0db7ed" }} />
                <Chip label="JWT" sx={{ bgcolor: "rgba(255, 193, 7, 0.2)", color: "#ffc107" }} />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: "700", mb: 2, color: "primary.main" }}>
                🔒 Security Features
              </Typography>
              <List sx={{ p: 0 }}>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <LockIcon style={{ width: "16px", height: "16px", color: "#f44336" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Password Strength Validation"
                    primaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.9)", fontSize: "0.9rem" } }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <ShieldIcon style={{ width: "16px", height: "16px", color: "#4caf50" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="OTP Email Verification"
                    primaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.9)", fontSize: "0.9rem" } }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <UsersIcon style={{ width: "16px", height: "16px", color: "#2196f3" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Role-Based Access Control"
                    primaryTypographyProps={{ sx: { color: "rgba(255,255,255,0.9)", fontSize: "0.9rem" } }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </AboutCard>
        </Grid>

        {/* Mission Statement */}
        <Grid item xs={12}>
          <AboutCard>
            <CardContent sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: "700", mb: 2, color: "primary.main" }}>
                🎯 Our Mission
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.6, maxWidth: "600px", mx: "auto" }}>
                To provide a secure, reliable, and user-friendly platform for remote device management.
                We believe in empowering organizations and individuals with the tools they need to maintain
                control and oversight of their digital infrastructure while prioritizing security and ease of use.
              </Typography>
              <Box sx={{ mt: 3, display: "flex", justifyContent: "center", alignItems: "center", gap: 1 }}>
                <SmartphoneIcon style={{ width: "20px", height: "20px", color: "primary.main" }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  Built with ❤️ for secure remote management
                </Typography>
              </Box>
            </CardContent>
          </AboutCard>
        </Grid>
      </Grid>
    </Box>
  </AboutContainer>
);

export default About;