import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SideNav from "./SideNav";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem('parentName') || localStorage.getItem('email')?.split('@')[0] || 'User';
    const adminStatus = localStorage.getItem('is_admin') === 'true';
    
    setUserName(name);
    setIsAdmin(adminStatus);
  }, []);

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <SideNav />

        <Typography variant="h6" sx={{ ml: 2 }}>
          Time Based Break App
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {isAdmin && (
          <Button
            color="inherit"
            onClick={handleAdminClick}
            sx={{
              mr: 2,
              fontWeight: 600,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '5px 15px',
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            🔧 Admin
          </Button>
        )}

        <Typography sx={{ fontWeight: 500 }}>Hi, {userName}</Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
