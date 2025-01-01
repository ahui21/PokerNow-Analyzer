// src/components/FileUpload.js
import React, { useState } from 'react';
import { Box, Button, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';

const FileUpload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('http://localhost:5001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(`File processed successfully. Game ID: ${response.data.game_id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading file');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <input
        accept=".csv"
        style={{ display: 'none' }}
        id="raised-button-file"
        type="file"
        onChange={handleFileUpload}
      />
      <label htmlFor="raised-button-file">
        <Button variant="contained" component="span" disabled={loading}>
          Upload Log File
        </Button>
      </label>

      {loading && <CircularProgress sx={{ ml: 2 }} size={24} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
    </Box>
  );
};

export default FileUpload;