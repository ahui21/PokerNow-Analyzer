import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Box, Typography, Alert, CircularProgress, Paper } from '@mui/material';

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const SupabaseTest = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('Testing Supabase connection...');
        
        // Try to fetch sessions
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .limit(5);

        if (sessionsError) {
          console.error('Sessions error:', sessionsError);
          throw sessionsError;
        }

        // Try to fetch players
        const { data: players, error: playersError } = await supabase
          .from('players')
          .select('*')
          .limit(5);

        if (playersError) {
          console.error('Players error:', playersError);
          throw playersError;
        }

        setData({
          sessions: sessions || [],
          players: players || []
        });
      } catch (err) {
        console.error('Connection error:', err);
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

  return (
    <Box sx={{ p: 3 }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Connection Error: {error}
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 2 }}>
          Successfully connected to Supabase!
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Sessions ({data?.sessions?.length || 0})
        </Typography>
        <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
          {JSON.stringify(data?.sessions, null, 2)}
        </pre>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Players ({data?.players?.length || 0})
        </Typography>
        <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
          {JSON.stringify(data?.players, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
};

export default SupabaseTest; 