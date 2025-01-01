import React, { useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  Button,
  Stack,
  Tooltip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import axios from 'axios';

const STAT_TOOLTIPS = {
  vpip: "Voluntarily Put Money In Pot - Percentage of hands where player voluntarily put money in the pot",
  pfr: "Pre-Flop Raise - Percentage of hands where player raised pre-flop",
  af: "Aggression Factor - Ratio of aggressive actions (bets/raises) to passive actions (calls)",
  wtsd: "Went to Showdown - Percentage of hands that reached showdown",
  hands: "Total number of hands played in this session",
  threeBet: "3-Bet Percentage - Percentage of hands where player made a 3-bet",
  fourBet: "4-Bet Percentage - Percentage of hands where player made a 4-bet",
  fiveBet: "5-Bet Percentage - Percentage of hands where player made a 5-bet"
};

const GameByGame = () => {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [gameStats, setGameStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    gameType: 'all',
    tableSize: 'all'
  });

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await axios.get('http://localhost:5001/sessions');
      // Only show active (visible) sessions
      setGames(response.data.filter(game => game.is_active));
    } catch (err) {
      setError('Error fetching games: ' + err.message);
    }
  };

  const fetchGameStats = async (gameId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5001/games/${gameId}/stats`);
      setGameStats(response.data);
    } catch (err) {
      setError('Error fetching game stats: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGameChange = (event) => {
    const gameId = event.target.value;
    setSelectedGame(gameId);
    if (gameId) {
      fetchGameStats(gameId);
    } else {
      setGameStats(null);
    }
  };

  // Filter games based on selected game type and table size
  const filteredGames = games.filter(game => {
    if (!game.game_stats) return true; // Don't filter if no stats
    
    try {
      const stats = JSON.parse(game.game_stats);
      
      if (filters.gameType !== 'all') {
        const gameTypes = stats.game_types || {};
        if (!Object.entries(gameTypes).some(([type, data]) => 
          type === filters.gameType && data.percentage > 50)) {
          return false;
        }
      }
      
      if (filters.tableSize !== 'all') {
        const tableSizes = stats.table_sizes || {};
        if (!Object.entries(tableSizes).some(([size, data]) => 
          parseInt(size) === parseInt(filters.tableSize) && data.percentage > 50)) {
          return false;
        }
      }
      
      return true;
    } catch (e) {
      // If there's any error parsing, just include the game
      return true;
    }
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Game by Game Statistics
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <Select
            value={filters.gameType}
            onChange={(e) => setFilters({ ...filters, gameType: e.target.value })}
            displayEmpty
          >
            <MenuItem value="all">All Game Types</MenuItem>
            <MenuItem value="NLHE">No-Limit Hold'em</MenuItem>
            <MenuItem value="PLO">Pot-Limit Omaha</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <Select
            value={filters.tableSize}
            onChange={(e) => setFilters({ ...filters, tableSize: e.target.value })}
            displayEmpty
          >
            <MenuItem value="all">All Table Sizes</MenuItem>
            {[2,3,4,5,6,7,8,9,10].map(size => (
              <MenuItem key={size} value={size}>{size}-handed</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <Select
          value={selectedGame}
          onChange={handleGameChange}
          displayEmpty
        >
          <MenuItem value="">Select a Game</MenuItem>
          {filteredGames.map(game => (
            <MenuItem key={game.id} value={game.id}>
              {game.display_name} ({new Date(game.start_time).toLocaleDateString()})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading && <CircularProgress />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {gameStats && (
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
                  3B %
                  <Tooltip title={STAT_TOOLTIPS.threeBet}>
                    <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  4B %
                  <Tooltip title={STAT_TOOLTIPS.fourBet}>
                    <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  5B %
                  <Tooltip title={STAT_TOOLTIPS.fiveBet}>
                    <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  Hands
                  <Tooltip title={STAT_TOOLTIPS.hands}>
                    <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(gameStats?.player_stats || {}).map(([player, stats]) => (
                <TableRow key={player}>
                  <TableCell component="th" scope="row">{player}</TableCell>
                  <TableCell align="right">{(stats.vpip || 0).toFixed(1)}</TableCell>
                  <TableCell align="right">{(stats.pfr || 0).toFixed(1)}</TableCell>
                  <TableCell align="right">{(stats.af || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{(stats.wtsd || 0).toFixed(1)}</TableCell>
                  <TableCell align="right">
                    {(((stats.hands_3bet || 0) / (stats.hands_dealt || 1)) * 100).toFixed(1)}
                  </TableCell>
                  <TableCell align="right">
                    {(((stats.hands_4bet || 0) / (stats.hands_dealt || 1)) * 100).toFixed(1)}
                  </TableCell>
                  <TableCell align="right">
                    {(((stats.hands_5bet || 0) / (stats.hands_dealt || 1)) * 100).toFixed(1)}
                  </TableCell>
                  <TableCell align="right">{stats.hands_dealt || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default GameByGame; 