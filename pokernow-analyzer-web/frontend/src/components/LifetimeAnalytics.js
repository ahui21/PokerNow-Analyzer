import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const LifetimeAnalytics = () => {
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)' }}>
        <Typography variant="h5" sx={{ color: 'white' }}>
          Lifetime Analytics
        </Typography>
      </Paper>
      <Typography>Coming soon...</Typography>
    </Box>
  );
};

export default LifetimeAnalytics; 