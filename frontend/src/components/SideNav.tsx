import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";

const SideNav: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (state: boolean) => () => {
    setOpen(state);
  };

  const menuItems = [
    { text: "Dashboard", path: "/dashboard" },
    { text: "Profile", path: "/profile" },
    { text: "Settings", path: "/settings" },
    { text: "LockPC", path: "/lockpc" },
    { text: "Logout", path: "/login" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    setOpen(false);
    navigate("/login");
  };

  return (
    <>
      {/* Menu Icon (Top Left) */}
      <IconButton
        edge="start"
        color="inherit"
        onClick={toggleDrawer(true)}
      >
        <MenuIcon />
      </IconButton>

      {/* Drawer */}
      <Drawer anchor="left" open={open} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 260, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            ControlIt
          </Typography>

          <List>
            {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                    {item.text === "Logout" ? (
                        <ListItemButton
                            onClick={handleLogout}
                        >
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    ) : (
                        <ListItemButton
                            component={Link}
                            to={item.path}
                            onClick={() => setOpen(false)} // close drawer
                        >
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    )}
                </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default SideNav;
