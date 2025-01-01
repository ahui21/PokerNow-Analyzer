import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';

const PlayerStats = ({ stats }) => {
  // Add validation
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography>No stats available</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>Player Statistics</Typography>
      <Grid container spacing={2}>
        {Object.entries(stats).map(([player, contexts]) => (
          <Grid item xs={12} md={6} lg={4} key={player}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>{player}</Typography>
              {contexts.by_combined && Object.entries(contexts.by_combined).map(([context, stats]) => (
                <Box key={context} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>{context}</Typography>
                  <Grid container spacing={1}>
                    <StatItem label="Hands Dealt" value={stats.Hands} />
                    <StatItem label="Hands Played" value={stats['Hands Played']} />
                    <StatItem label="PFR" value={stats['Preflop Raises']} />
                    <StatItem label="Showdowns" value={stats.Showdowns} />
                    <StatItem label="Bets" value={stats.Bets} />
                    <StatItem label="Raises" value={stats.Raises} />
                    <StatItem label="Calls" value={stats.Calls} />
                    <StatItem label="3Bets" value={stats['3Bets']} />
                    <StatItem label="4Bets" value={stats['4Bets']} />
                    <StatItem label="5Bets" value={stats['5Bets']} />
                  </Grid>
                </Box>
              ))}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const StatItem = ({ label, value }) => (
  <Grid item xs={6}>
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      bgcolor: 'background.paper',
      p: 1,
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <Typography variant="body2" color="text.secondary">{label}:</Typography>
      <Typography variant="body2" fontWeight="medium">
        {typeof value === 'number' ? value.toFixed(0) : value}
      </Typography>
    </Box>
  </Grid>
);

export default PlayerStats; 