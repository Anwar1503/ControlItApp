import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Box,
  Typography,
  Divider,
  Avatar,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import {
  LayoutDashboard as DashboardIcon,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut as LogoutIcon,
} from "lucide-react";

const SideNav: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (state: boolean) => () => {
    setOpen(state);
  };

  const menuItems = [
    { text: "Dashboard", path: "/dashboard", icon: DashboardIcon },
    { text: "Profile", path: "/profile", icon: UserIcon },
    { text: "Settings", path: "/settings", icon: SettingsIcon },
  ];

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('email');
    localStorage.removeItem('parentName');
    localStorage.removeItem('role');
    localStorage.removeItem('is_admin');
    
    // Close drawer and navigate to login
    setOpen(false);
    navigate('/login');
  };

  const userEmail = localStorage.getItem('email') || 'User';
  const userName = localStorage.getItem('parentName') || userEmail.split('@')[0];
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Menu Icon (Top Left) */}
      <IconButton
        edge="start"
        color="inherit"
        onClick={toggleDrawer(true)}
        sx={{
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Drawer */}
      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            background: "linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)",
            backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }
        }}
      >
        <Box sx={{ width: 300, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: "primary.main",
                  mr: 2,
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                {userInitial}
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "700",
                    color: "white",
                    fontSize: "1.2rem",
                  }}
                >
                  ControlIt
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "0.85rem",
                  }}
                >
                  Remote Agent Control
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "0.9rem",
              }}
            >
              Welcome back, {userName}
            </Typography>
          </Box>

          {/* Menu Items */}
          <Box sx={{ flex: 1, p: 2 }}>
            <List sx={{ p: 0 }}>
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                    <ListItemButton
                      component={item.text === "Logout" ? "div" : Link}
                      to={item.path}
                      onClick={item.text === "Logout" ? handleLogout : () => setOpen(false)}
                      sx={{
                        borderRadius: "12px",
                        p: 2,
                        transition: "all 0.3s ease",
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.1)',
                          transform: 'translateX(4px)',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                        },
                        '&:active': {
                          transform: 'translateX(2px)',
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <IconComponent
                          style={{
                            width: "20px",
                            height: "20px",
                            color: "rgba(255, 255, 255, 0.8)"
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          sx: {
                            fontWeight: "600",
                            color: "white",
                            fontSize: "1rem",
                          }
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>

            <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

            {/* Logout Button */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  borderRadius: "12px",
                  p: 2,
                  transition: "all 0.3s ease",
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)',
                  },
                  '&:active': {
                    transform: 'translateX(2px)',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LogoutIcon
                    style={{
                      width: "20px",
                      height: "20px",
                      color: "rgba(244, 67, 54, 0.8)"
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Logout"
                  primaryTypographyProps={{
                    sx: {
                      fontWeight: "600",
                      color: "rgba(244, 67, 54, 0.9)",
                      fontSize: "1rem",
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          </Box>

          {/* Footer */}
          <Box sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "0.75rem",
                textAlign: "center",
                display: "block",
              }}
            >
              © 2026 ControlIt App
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default SideNav;
