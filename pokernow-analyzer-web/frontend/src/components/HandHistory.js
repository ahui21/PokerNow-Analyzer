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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

const HandHistory = ({ sessionId, timezone }) => {
  const [hands, setHands] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHands = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/sessions/${sessionId}/hands`, {
          params: { timezone }
        });
        setHands(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching hands');
      } finally {
        setLoading(false);
      }
    };

    fetchHands();
  }, [sessionId, timezone]);

  const formatAction = (action) => {
    const { player, action: actionType, amount, street, position } = action;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label={position} size="small" />
        <Typography>
          {player} {actionType} {amount > 0 ? `$${amount}` : ''}
        </Typography>
      </Box>
    );
  };

  const formatBoard = (cards) => {
    if (!cards || cards.length === 0) return null;
    return (
      <Stack direction="row" spacing={1}>
        {cards.map((card, i) => (
          <Chip 
            key={i} 
            label={card} 
            size="small"
            sx={{ 
              bgcolor: card.endsWith('♥') || card.endsWith('♦') ? '#ffebee' : 'inherit'
            }}
          />
        ))}
      </Stack>
    );
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!hands) return <Alert severity="info">No hands found for this session</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Hand History
      </Typography>

      {hands.map((hand) => (
        <Accordion key={hand.hand_number}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Typography>Hand #{hand.hand_number}</Typography>
              <Stack direction="row" spacing={2}>
                <Typography>Pot: ${hand.pot_size}</Typography>
                <Typography>
                  {new Date(hand.timestamp).toLocaleTimeString()}
                </Typography>
              </Stack>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {/* Players */}
              <Typography variant="subtitle2" gutterBottom>Players:</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {hand.players.map((player, i) => (
                  <Chip 
                    key={i} 
                    label={`${player} (${hand.positions[player]})`}
                    size="small"
                  />
                ))}
              </Stack>

              {/* Actions by street */}
              {['preflop', 'flop', 'turn', 'river'].map(street => {
                const streetActions = hand.actions.filter(a => a.street === street);
                if (streetActions.length === 0) return null;

                return (
                  <Box key={street} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                      {street}:
                    </Typography>
                    {street !== 'preflop' && (
                      <Box sx={{ my: 1 }}>
                        {formatBoard(hand.board.slice(
                          street === 'flop' ? 0 : street === 'turn' ? 3 : 4,
                          street === 'flop' ? 3 : street === 'turn' ? 4 : 5
                        ))}
                      </Box>
                    )}
                    <Stack spacing={1}>
                      {streetActions.map((action, i) => (
                        <Box key={i}>
                          {formatAction(action)}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                );
              })}

              {/* Winners */}
              {hand.winners && hand.winners.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Results:</Typography>
                  <Stack direction="row" spacing={1}>
                    {hand.winners.map(([player, amount], i) => (
                      <Chip 
                        key={i}
                        label={`${player} wins $${amount}`}
                        color="success"
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default HandHistory; 