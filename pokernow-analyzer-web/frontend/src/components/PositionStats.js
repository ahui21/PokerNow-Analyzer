import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer
} from '@mui/material';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const PositionStats = ({ playerName }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/player/${playerName}/position-stats`);
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching position stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [playerName]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return <Alert severity="info">No position stats found for {playerName}</Alert>;

  const positions = ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'];
  const metrics = ['VPIP', 'PFR', 'ThreeB'];

  // Prepare data for radar chart
  const radarData = positions.map(pos => ({
    position: pos,
    VPIP: stats.position_stats[pos].vpip,
    PFR: stats.position_stats[pos].pfr,
    ThreeB: stats.position_stats[pos].threeb
  }));

  // Color scheme for different metrics
  const colors = {
    VPIP: '#8884d8',
    PFR: '#82ca9d',
    ThreeB: '#ffc658'
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Position Analysis for {playerName}
      </Typography>

      <Grid container spacing={3}>
        {/* Radar Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Position Tendencies</Typography>
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="position" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  {metrics.map(metric => (
                    <Radar
                      key={metric}
                      name={metric}
                      dataKey={metric}
                      stroke={colors[metric]}
                      fill={colors[metric]}
                      fillOpacity={0.3}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Detailed Stats Table */}
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Position</TableCell>
                  <TableCell>Hands</TableCell>
                  <TableCell>VPIP</TableCell>
                  <TableCell>PFR</TableCell>
                  <TableCell>3-Bet</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map(pos => (
                  <TableRow key={pos}>
                    <TableCell>{pos}</TableCell>
                    <TableCell>{stats.position_stats[pos].hands}</TableCell>
                    <TableCell>{stats.position_stats[pos].vpip.toFixed(1)}%</TableCell>
                    <TableCell>{stats.position_stats[pos].pfr.toFixed(1)}%</TableCell>
                    <TableCell>{stats.position_stats[pos].threeb.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Position Tips */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {positions.map(pos => {
              const posStats = stats.position_stats[pos];
              const vpipPfrGap = posStats.vpip - posStats.pfr;
              
              return (
                <Grid item xs={12} key={pos}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{pos} Analysis</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vpipPfrGap > 20 && 'Playing too loose/passive from this position. '}
                        {posStats.threeb < 5 && 'Could 3-bet more aggressively. '}
                        {posStats.vpip < 15 && 'Playing too tight from this position. '}
                        {posStats.vpip > 40 && 'Playing too many hands from this position. '}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PositionStats; 