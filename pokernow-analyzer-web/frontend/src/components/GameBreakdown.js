import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';

// Add tooltips for each stat
const STAT_TOOLTIPS = {
  vpip: "Voluntarily Put Money In Pot - The percentage of hands where a player voluntarily put money in the pot preflop",
  pfr: "Pre-Flop Raise - The percentage of hands where a player raised preflop",
  af: "Aggression Factor - The ratio of aggressive actions (bets/raises) to passive actions (calls)",
  wtsd: "Went to Showdown - The percentage of hands that went to showdown when seeing the flop",
  threebet: "3-Bet Percentage - The percentage of times a player re-raised when facing a raise",
  fourbet: "4-Bet Percentage - The percentage of times a player re-raised when facing a 3-bet",
  fivebet: "5-Bet Percentage - The percentage of times a player re-raised when facing a 4-bet",
  hands: "Total number of hands played in this session"
};

const GameBreakdown = () => {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [gameStats, setGameStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/sessions');
      const activeGames = response.data
        .filter(game => game.is_active)
        .sort((a, b) => {
          const dateA = new Date(a.display_name.replace(' at ', ' '));
          const dateB = new Date(b.display_name.replace(' at ', ' '));
          return dateB - dateA;
        });
      setGames(activeGames);
      setError(null);
    } catch (err) {
      setError('Error fetching games: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchGameStats = async () => {
      if (!selectedGame) {
        setGameStats(null);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5001/games/${selectedGame}/stats`);
        setGameStats(response.data);
        setError(null);
      } catch (err) {
        setError('Error fetching game stats: ' + (err.response?.data?.message || err.message));
        setGameStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGameStats();
  }, [selectedGame]);

  return (
    <Box sx={{ p: 3 }}>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Game</InputLabel>
        <Select
          value={selectedGame}
          label="Select Game"
          onChange={(e) => setSelectedGame(e.target.value)}
        >
          <MenuItem value="">Select a Game</MenuItem>
          {games.map(game => (
            <MenuItem key={game.id} value={game.id}>
              {game.display_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : gameStats?.players ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell align="right">
                  VPIP %
                  <Tooltip title={STAT_TOOLTIPS.vpip}>
                    <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  PFR %
                  <Tooltip title={STAT_TOOLTIPS.pfr}>
                    <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  AF
                  <Tooltip title={STAT_TOOLTIPS.af}>
                    <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  WTSD %
                  <Tooltip title={STAT_TOOLTIPS.wtsd}>
                    <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  3-Bet %
                  <Tooltip title={STAT_TOOLTIPS.threebet}>
                    <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  4-Bet %
                  <Tooltip title={STAT_TOOLTIPS.fourbet}>
                    <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  5-Bet %
                  <Tooltip title={STAT_TOOLTIPS.fivebet}>
                    <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  # Hands
                  <Tooltip title={STAT_TOOLTIPS.hands}>
                    <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gameStats.players.map((player) => (
                <TableRow key={player.name}>
                  <TableCell component="th" scope="row">
                    {player.name}
                  </TableCell>
                  <TableCell align="right">{(player.vpip || 0).toFixed(1)}</TableCell>
                  <TableCell align="right">{(player.pfr || 0).toFixed(1)}</TableCell>
                  <TableCell align="right">{(player.af || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{(player.wtsd || 0).toFixed(1)}</TableCell>
                  <TableCell align="right">{(player.threebet || 0).toFixed(1)}</TableCell>
                  <TableCell align="right">{(player.fourbet || 0).toFixed(1)}</TableCell>
                  <TableCell align="right">{(player.fivebet || 0).toFixed(1)}</TableCell>
                  <TableCell align="right">{player.hands || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Box>
  );
};

export default GameBreakdown; 