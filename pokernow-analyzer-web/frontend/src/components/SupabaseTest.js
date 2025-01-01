import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import config from '../config';

// Log the environment variables (remove in production)
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('Supabase Key:', process.env.REACT_APP_SUPABASE_ANON_KEY?.slice(0, 10) + '...');

const supabase = createClient(
  config.supabaseUrl,
  config.supabaseKey
);

const SupabaseTest = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Try to fetch sessions
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .limit(5);

        if (sessionsError) throw sessionsError;

        // Try to fetch players
        const { data: players, error: playersError } = await supabase
          .from('players')
          .select('*')
          .limit(5);

        if (playersError) throw playersError;

        setData({
          sessions: sessions || [],
          players: players || []
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Connection Error: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="success" sx={{ mb: 2 }}>
        Successfully connected to Supabase!
      </Alert>
      
      <Typography variant="h6" gutterBottom>
        Sessions ({data.sessions.length})
      </Typography>
      <pre>
        {JSON.stringify(data.sessions, null, 2)}
      </pre>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Players ({data.players.length})
      </Typography>
      <pre>
        {JSON.stringify(data.players, null, 2)}
      </pre>
    </Box>
  );
};

export default SupabaseTest; 