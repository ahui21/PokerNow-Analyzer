import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const SessionAnalysis = ({ sessionStats }) => {
  if (!sessionStats) return null;

  const { player_stats } = sessionStats;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Player Statistics
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Filter statistics by game type and table size
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Game Type</InputLabel>
          <Select
            value="No-Limit Hold'em"
            label="Game Type"
          >
            <MenuItem value="No-Limit Hold'em">No-Limit Hold'em</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Table Size</InputLabel>
          <Select
            value="All Sizes"
            label="Table Size"
          >
            <MenuItem value="All Sizes">All Sizes</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Player</TableCell>
              <TableCell align="right">VPIP</TableCell>
              <TableCell align="right">PFR</TableCell>
              <TableCell align="right">AF</TableCell>
              <TableCell align="right">WTSD</TableCell>
              <TableCell align="right">Hands</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(player_stats).map(([player, stats]) => (
              <TableRow key={player}>
                <TableCell>{player}</TableCell>
                <TableCell align="right">{stats.vpip.toFixed(1)}%</TableCell>
                <TableCell align="right">{stats.pfr.toFixed(1)}%</TableCell>
                <TableCell align="right">{stats.af.toFixed(1)}</TableCell>
                <TableCell align="right">{stats.wtsd.toFixed(1)}%</TableCell>
                <TableCell align="right">{stats.hands_played}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SessionAnalysis; 