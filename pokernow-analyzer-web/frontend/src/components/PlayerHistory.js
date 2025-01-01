import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  TableContainer,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import axios from 'axios';

const PlayerHistory = ({ playerName, timezone }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/player/${playerName}/history`, {
          params: { timezone }
        });
        setHistory(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching player history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [playerName, timezone]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!history) return <Alert severity="info">No history found for {playerName}</Alert>;

  const statsOverTime = history.sessions.map(session => ({
    date: new Date(session.session_start).toLocaleDateString(),
    VPIP: session.stats.VPIP,
    PFR: session.stats.PFR,
    ThreeB: session.stats.ThreeB,
    AF: session.stats.AF,
    WTSD: session.stats.WTSD,
    WinRate: session.stats.WinRate
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {playerName}'s History
      </Typography>

      {/* Aggregate Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Overall Statistics</Typography>
              <Typography>Total Sessions: {history.total_sessions}</Typography>
              <Typography>Total Hands: {history.total_hands}</Typography>
              <Typography>Total Winnings: ${history.aggregate_stats.TotalWinnings}</Typography>
              <Typography>Biggest Pot: ${history.aggregate_stats.BiggestPot}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Average Stats</Typography>
              <Typography>VPIP: {history.aggregate_stats.VPIP.toFixed(1)}%</Typography>
              <Typography>PFR: {history.aggregate_stats.PFR.toFixed(1)}%</Typography>
              <Typography>3-Bet: {history.aggregate_stats.ThreeB.toFixed(1)}%</Typography>
              <Typography>AF: {history.aggregate_stats.AF.toFixed(2)}</Typography>
              <Typography>WTSD: {history.aggregate_stats.WTSD.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stats Over Time Chart */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Stats Progression</Typography>
        <Box sx={{ width: '100%', height: 400 }}>
          <LineChart data={statsOverTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="VPIP" stroke="#8884d8" />
            <Line type="monotone" dataKey="PFR" stroke="#82ca9d" />
            <Line type="monotone" dataKey="ThreeB" stroke="#ffc658" />
            <Line type="monotone" dataKey="WTSD" stroke="#ff7300" />
          </LineChart>
        </Box>
      </Paper>

      {/* Session History Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Game Type</TableCell>
              <TableCell>Table Size</TableCell>
              <TableCell>Hands</TableCell>
              <TableCell>VPIP</TableCell>
              <TableCell>PFR</TableCell>
              <TableCell>3-Bet</TableCell>
              <TableCell>AF</TableCell>
              <TableCell>WTSD</TableCell>
              <TableCell>Win Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.sessions.map((session, index) => (
              <TableRow key={index}>
                <TableCell>{new Date(session.session_start).toLocaleDateString()}</TableCell>
                <TableCell>{session.game_type}</TableCell>
                <TableCell>{session.table_size}</TableCell>
                <TableCell>{session.stats.Hands}</TableCell>
                <TableCell>{session.stats.VPIP.toFixed(1)}%</TableCell>
                <TableCell>{session.stats.PFR.toFixed(1)}%</TableCell>
                <TableCell>{session.stats.ThreeB.toFixed(1)}%</TableCell>
                <TableCell>{session.stats.AF.toFixed(2)}</TableCell>
                <TableCell>{session.stats.WTSD.toFixed(1)}%</TableCell>
                <TableCell>${session.stats.WinRate.toFixed(2)}/hand</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PlayerHistory; 