import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const PlaceholderComponent = ({ title }) => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This feature is coming soon...
        </Typography>
      </Paper>
    </Box>
  );
};

export default PlaceholderComponent; 