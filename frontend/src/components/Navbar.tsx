import React from "react";
import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import SideNav from "./SideNav";

const Navbar: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <SideNav />

        <Typography variant="h6" sx={{ ml: 2 }}>
          Time Based Break App
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Typography>Hi, User</Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
