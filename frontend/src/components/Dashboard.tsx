import React from "react";
import { Grid, Box, Typography } from "@mui/material";
import Navbar from "./Navbar";

const Dashboard: React.FC = () => {
  return (
    <Box>
      <Navbar />
      <Grid >
      </Grid>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4">
          Welcome to Dashboard
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
