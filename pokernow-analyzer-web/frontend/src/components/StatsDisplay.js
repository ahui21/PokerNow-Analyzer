// src/components/StatsDisplay.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import axios from 'axios';

const StatsDisplay = ({ sessionId, timezone, onPlayerSelect }) => {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const fetchSessionStats = async () => {
      try {
        console.log('Fetching stats for session:', sessionId);
        const response = await axios.get(`http://localhost:5001/sessions/${sessionId}`, {
          params: { timezone }
        });
        console.log('Received session data:', response.data);
        
        // Format the data structure
        const formattedData = {
          session_info: response.data.session_info,
          player_stats: response.data.player_stats?.player_stats || response.data.player_stats || {},
          biggest_pots: response.data.biggest_pots || []
        };
        
        setSessionData(formattedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching session stats:', err);
        setError(err.response?.data?.message || err.message || 'Error fetching session stats');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionStats();
  }, [sessionId, timezone]);

  if (!sessionId) {
    return (
      <Alert severity="info">
        Please select a session from the Sessions Manager to view statistics
      </Alert>
    );
  }

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!sessionData) return <Alert severity="error">No data found for this session</Alert>;
  if (!sessionData.session_info || !sessionData.player_stats) {
    return <Alert severity="error">Invalid session data structure</Alert>;
  }

  const { session_info, player_stats } = sessionData;

  return (
    <Box>
      {/* Session Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)' }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>
          Session Analysis: {session_info.display_name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label={`Game: ${session_info.game_type}`} 
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }} 
          />
          <Chip 
            label={`Players: ${session_info.table_size}`} 
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }} 
          />
          <Chip 
            label={`Hands: ${session_info.total_hands}`} 
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }} 
          />
        </Box>
      </Paper>

      {/* Player Stats Grid */}
      <Grid container spacing={3}>
        {Object.entries(player_stats || {}).map(([player, stats]) => (
          <Grid item xs={12} md={6} lg={4} key={player}>
            <Card 
              sx={{ cursor: 'pointer' }}
              onClick={() => onPlayerSelect(player)}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {player}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">VPIP</Typography>
                    <Typography>{(stats.vpip || 0).toFixed(1)}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">PFR</Typography>
                    <Typography>{(stats.pfr || 0).toFixed(1)}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">3-Bet</Typography>
                    <Typography>{(stats.threeb || 0).toFixed(1)}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">AF</Typography>
                    <Typography>{(stats.af || 0).toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">WTSD</Typography>
                    <Typography>{(stats.wtsd || 0).toFixed(1)}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Won/Lost</Typography>
                    <Typography 
                      sx={{ 
                        color: (stats.won_money || 0) > 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold'
                      }}
                    >
                      ${stats.won_money || 0}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Biggest Pots Table */}
      {sessionData.biggest_pots && sessionData.biggest_pots.length > 0 && (
        <Paper sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            Biggest Pots
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Hand #</TableCell>
                  <TableCell>Pot Size</TableCell>
                  <TableCell>Winner</TableCell>
                  <TableCell>Players</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessionData.biggest_pots.map((hand, index) => (
                  <TableRow key={index}>
                    <TableCell>{hand.hand_number}</TableCell>
                    <TableCell>${hand.pot_size}</TableCell>
                    <TableCell>{hand.winners?.join(', ') || 'N/A'}</TableCell>
                    <TableCell>{hand.players?.join(', ') || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default StatsDisplay;