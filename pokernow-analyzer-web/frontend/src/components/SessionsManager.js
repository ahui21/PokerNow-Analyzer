import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Checkbox,
  Divider,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Stack,
  FormControlLabel
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Label as LabelIcon,
  VisibilityOff as VisibilityOffIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Brightness4,
  Brightness7
} from '@mui/icons-material';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import { alpha } from '@mui/material/styles';

const TAG_COLORS = [
  '#e53935', // bright red
  '#8e24aa', // purple
  '#3949ab', // indigo
  '#00897b', // teal
  '#7cb342', // light green
  '#fb8c00', // orange
  '#d81b60', // pink
  '#1e88e5', // blue
  '#43a047', // green
  '#6d4c41', // brown
  '#757575', // grey
  '#546e7a', // blue grey
];

const TRANSITIONS = {
  transform: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: 'opacity 0.2s ease-in-out',
  expand: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

const SessionsManager = () => {
  const { mode, setMode } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortBy, setSortBy] = useState('session_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    dateRange: {
      start: '',
      end: ''
    },
    gameTypes: [],
    tableSizes: []
  });
  const [gameTypeAnchorEl, setGameTypeAnchorEl] = useState(null);
  const [tableSizeAnchorEl, setTableSizeAnchorEl] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playersAnchorEl, setPlayersAnchorEl] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [hoveredSession, setHoveredSession] = useState(null);

  const GLASSMORPHISM = {
    background: mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.2)' 
      : 'rgba(0, 0, 0, 0.1)'}`,
    boxShadow: mode === 'dark'
      ? '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
      : '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const updateAllTagsAndPlayers = (sessionsData) => {
    const tags = new Set();
    const players = new Set();
    
    sessionsData.forEach(session => {
      // Add tags
      session.tags?.forEach(tag => tags.add(tag));
      
      // Add players - handle both string and array formats
      try {
        const sessionPlayers = typeof session.players === 'string' 
          ? JSON.parse(session.players) 
          : session.players;
        
        if (Array.isArray(sessionPlayers)) {
          sessionPlayers.forEach(player => players.add(player));
        }
      } catch (e) {
        console.error('Error parsing players:', e);
      }
    });
    
    setAllTags(Array.from(tags));
    setAllPlayers(Array.from(players).sort((a, b) => a.localeCompare(b)));
  };

  const parseGameStats = (statsString) => {
    try {
      if (!statsString) {
        return {
          game_types: {},
          table_sizes: {}
        };
      }
      return JSON.parse(statsString);
    } catch (e) {
      console.error('Error parsing game stats:', e);
      return {
        game_types: {},
        table_sizes: {}
      };
    }
  };

  const fetchSessions = async () => {
    try {
      console.log('Fetching sessions...');
      const response = await axios.get('http://localhost:5001/sessions');
      console.log('Sessions response:', response.data);
      const sortedSessions = response.data.sort((a, b) => {
        return new Date(b.start_time) - new Date(a.start_time);
      });
      setSessions(sortedSessions);
      updateAllTagsAndPlayers(sortedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Error fetching sessions');
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    console.log(`Attempting to upload ${files.length} files:`, files.map(f => f.name));
    setLoading(true);
    setError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('file', file));

      console.log('Sending upload request...');
      const response = await axios.post('http://localhost:5001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Received response:', response.data);
      const results = response.data;
      const messages = [];

      if (Array.isArray(results.processed) && results.processed.length > 0) {
        messages.push(`Successfully processed: ${results.processed.join(', ')}`);
      }

      if (Array.isArray(results.skipped) && results.skipped.length > 0) {
        messages.push(`Already uploaded (skipped): ${results.skipped.join(', ')}`);
      }

      if (Array.isArray(results.failed) && results.failed.length > 0) {
        const failedMessages = results.failed.map(f => `${f.filename}: ${f.error}`);
        messages.push(`Failed to process: ${failedMessages.join(', ')}`);
      }

      console.log('Status:', results.status);
      console.log('Messages:', messages);

      if (results.status === 'success') {
        setUploadSuccess(messages.join('\n'));
        fetchSessions();
      } else {
        setError(messages.join('\n') || 'No files were processed successfully');
      }
    } catch (err) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response);
      setError('Error uploading files: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      event.target.value = null; // Reset file input
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }
    
    try {
      console.log(`Deleting session ${sessionId}`);
      const response = await axios.delete(`http://localhost:5001/sessions/${sessionId}`);
      console.log('Delete response:', response.data);
      setSelectedSessions(prev => prev.filter(id => id !== sessionId));
      fetchSessions();
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Error deleting session: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleActive = async (sessionId, currentStatus) => {
    try {
      console.log(`Toggling session ${sessionId} visibility from ${currentStatus} to ${!currentStatus}`);
      const response = await axios.patch(
        `http://localhost:5001/sessions/${sessionId}/active`,
        { is_active: !currentStatus },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Toggle response:', response.data);
      if (response.data.status === 'success') {
        // Update local state immediately
        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, is_active: !currentStatus }
            : session
        ));
      } else {
        throw new Error(response.data.message || 'Failed to update visibility');
      }
    } catch (err) {
      console.error('Error toggling visibility:', err);
      setError('Error updating visibility: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddTag = async (tagToAdd) => {
    if (!tagToAdd || !selectedSession) return;

    try {
      await axios.post(`http://localhost:5001/sessions/${selectedSession.id}/tags`, {
        tag: tagToAdd.trim()
      });
      setNewTag('');
      setTagDialogOpen(false);
      fetchSessions();
    } catch (err) {
      setError('Error adding tag: ' + err.message);
    }
  };

  const handleRemoveTag = async (sessionId, tag) => {
    try {
      await axios.delete(`http://localhost:5001/sessions/${sessionId}/tags/${encodeURIComponent(tag)}`);
      setError(null);
      fetchSessions();
    } catch (err) {
      setError('Error removing tag: ' + (err.response?.data?.message || err.message));
      console.error('Remove tag error:', err);
    }
  };

  const getTagColor = (tag) => {
    const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return TAG_COLORS[hash % TAG_COLORS.length];
  };

  const getFilteredAndSortedSessions = (sessions) => {
    return sessions.filter(session => {
      // Filter by tags
      if (selectedTags.length > 0) {
        if (!session.tags || !selectedTags.every(tag => session.tags.includes(tag))) {
          return false;
        }
      }

      // Filter by players
      if (selectedPlayers.length > 0) {
        const sessionPlayers = Array.isArray(session.players) ? session.players : [];
        if (!selectedPlayers.some(player => sessionPlayers.includes(player))) {
          return false;
        }
      }

      // Filter by table size
      if (filters.tableSizes.length > 0) {
        try {
          const stats = parseGameStats(session.game_stats);
          const sessionTableSizes = Object.keys(stats.table_sizes);
          if (!filters.tableSizes.some(size => sessionTableSizes.includes(size.toString()))) {
            return false;
          }
        } catch (e) {
          console.error('Error parsing table sizes:', e);
          return false;
        }
      }

      // Filter by game type
      if (filters.gameTypes.length > 0) {
        try {
          const stats = parseGameStats(session.game_stats);
          const sessionGameTypes = Object.keys(stats.game_types);
          if (!filters.gameTypes.some(type => sessionGameTypes.includes(type))) {
            return false;
          }
        } catch (e) {
          console.error('Error parsing game types:', e);
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by date
      return new Date(b.start_time) - new Date(a.start_time);
    });
  };

  const filteredSessions = getFilteredAndSortedSessions(sessions);

  const filterButtonStyle = { 
    width: 100,
  };

  const wideFilterButtonStyle = {
    width: 150,
  };

  const renderFilterControls = () => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: 2,
      flex: 1,
      justifyContent: 'flex-end'
    }}>
      {(selectedTags.length > 0 || selectedPlayers.length > 0 || 
        filters.gameTypes.length > 0 || filters.tableSizes.length > 0) && (
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          onClick={() => {
            setSelectedTags([]);
            setSelectedPlayers([]);
            setFilters({
              ...filters,
              gameTypes: [],
              tableSizes: []
            });
          }}
        >
          Clear All Filters
        </Button>
      )}

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          input={<OutlinedInput label="Sort By" />}
        >
          <MenuItem value="session_date">Session Date</MenuItem>
          <MenuItem value="upload_date">Upload Date</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel>Order</InputLabel>
        <Select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          input={<OutlinedInput label="Order" />}
        >
          <MenuItem value="desc">Newest First</MenuItem>
          <MenuItem value="asc">Oldest First</MenuItem>
        </Select>
      </FormControl>

      <Button
        size="small"
        variant="outlined"
        onClick={(event) => setGameTypeAnchorEl(event.currentTarget)}
        endIcon={<FilterListIcon />}
        sx={wideFilterButtonStyle}
      >
        Game Type
      </Button>

      <Button
        size="small"
        variant="outlined"
        onClick={(event) => setTableSizeAnchorEl(event.currentTarget)}
        endIcon={<FilterListIcon />}
        sx={wideFilterButtonStyle}
      >
        Table Size
      </Button>

      <Button
        size="small"
        variant="outlined"
        onClick={(event) => setPlayersAnchorEl(event.currentTarget)}
        endIcon={<FilterListIcon />}
        sx={filterButtonStyle}
      >
        Players
      </Button>

      <Button
        endIcon={<FilterListIcon />}
        onClick={(event) => setFilterAnchorEl(event.currentTarget)}
        variant="outlined"
        size="small"
        sx={filterButtonStyle}
      >
        Tags
      </Button>
    </Box>
  );

  const handleBulkAddTag = async (tag) => {
    try {
      await Promise.all(
        selectedSessions.map(sessionId =>
          axios.post(`http://localhost:5001/sessions/${sessionId}/tags`, { tag })
        )
      );
      await fetchSessions();
      setTagDialogOpen(false);
      setNewTag('');
      setSelectedSessions([]);
    } catch (err) {
      setError('Error adding tags: ' + err.message);
    }
  };

  const handleBulkToggleVisibility = async (makeVisible) => {
    try {
      await Promise.all(
        selectedSessions.map(sessionId =>
          axios.patch(`http://localhost:5001/sessions/${sessionId}/active`, {
            is_active: makeVisible
          })
        )
      );
      await fetchSessions();
      setSelectedSessions([]); // Clear selection after action
    } catch (err) {
      setError('Error updating visibility: ' + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedSessions.length} sessions?`)) {
      return;
    }
    
    try {
      await Promise.all(
        selectedSessions.map(sessionId =>
          axios.delete(`http://localhost:5001/sessions/${sessionId}`)
        )
      );
      await fetchSessions();
      setSelectedSessions([]); // Clear selection after deletion
    } catch (err) {
      setError('Error deleting sessions: ' + err.message);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      // Select all visible sessions
      const visibleSessionIds = filteredSessions.map(session => session.id);
      setSelectedSessions(visibleSessionIds);
    } else {
      // Deselect all
      setSelectedSessions([]);
    }
  };

  const handleTableSizeFilterChange = (size) => {
    setFilters(prev => ({
      ...prev,
      tableSizes: prev.tableSizes.includes(size)
        ? prev.tableSizes.filter(s => s !== size)
        : [...prev.tableSizes, size]
    }));
  };

  const handleGameTypeFilterChange = (type) => {
    setFilters(prev => ({
      ...prev,
      gameTypes: prev.gameTypes.includes(type)
        ? prev.gameTypes.filter(t => t !== type)
        : [...prev.gameTypes, type]
    }));
  };

  const handlePlayerFilterChange = (player) => {
    setSelectedPlayers(prev => 
      prev.includes(player)
        ? prev.filter(p => p !== player)
        : [...prev, player]
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2 
      }}>
        <Typography variant="h5">Sessions Manager</Typography>
        <input
          accept=".csv"
          style={{ display: 'none' }}
          id="raised-button-file"
          type="file"
          onChange={handleFileUpload}
          multiple
        />
        <label htmlFor="raised-button-file">
          <Button variant="contained" component="span" disabled={loading}>
            Upload New Session(s)
          </Button>
        </label>
      </Box>

      {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}
      {uploadSuccess && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setUploadSuccess(null)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {uploadSuccess}
        </Alert>
      )}

      <Paper 
        sx={{ 
          p: 2,
          backgroundColor: theme => mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.8)
            : theme.palette.background.paper,
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: theme => `1px solid ${
            mode === 'dark' 
              ? alpha(theme.palette.common.white, 0.1)
              : alpha(theme.palette.common.black, 0.1)
          }`,
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: TRANSITIONS.transform,
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Typography variant="h6">
            Uploaded Sessions ({filteredSessions.length}
            {(selectedTags.length > 0 || filters.gameTypes.length > 0 || filters.tableSizes.length > 0 || selectedPlayers.length > 0) 
              ? ' filtered' 
              : ' total'})
          </Typography>
          {renderFilterControls()}
        </Box>

        {filteredSessions.length > 0 && (
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedSessions.length === filteredSessions.length && filteredSessions.length > 0}
                  indeterminate={selectedSessions.length > 0 && selectedSessions.length < filteredSessions.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  {selectedSessions.length > 0 
                    ? `Selected ${selectedSessions.length} of ${filteredSessions.length}`
                    : "Select all sessions"
                  }
                </Typography>
              }
            />
          </Box>
        )}

        <Menu
          anchorEl={gameTypeAnchorEl}
          open={Boolean(gameTypeAnchorEl)}
          onClose={() => setGameTypeAnchorEl(null)}
        >
          <MenuItem sx={{ backgroundColor: 'transparent', cursor: 'default' }}>
            <Typography variant="subtitle2">Select game types:</Typography>
          </MenuItem>
          <MenuItem 
            onClick={() => {
              setFilters({ ...filters, gameTypes: [] });
              setGameTypeAnchorEl(null);
            }}
            sx={{ color: 'text.secondary' }}
          >
            Clear Game Type Filters
          </MenuItem>
          <Divider />
          {['NLHE', 'PLO'].map(type => (
            <MenuItem 
              key={type}
              onClick={() => {
                const newTypes = filters.gameTypes.includes(type)
                  ? filters.gameTypes.filter(t => t !== type)
                  : [...filters.gameTypes, type];
                setFilters({ ...filters, gameTypes: newTypes });
              }}
            >
              <Checkbox 
                checked={filters.gameTypes.includes(type)}
                size="small"
              />
              <Typography>{type}</Typography>
            </MenuItem>
          ))}
        </Menu>

        <Menu
          anchorEl={tableSizeAnchorEl}
          open={Boolean(tableSizeAnchorEl)}
          onClose={() => setTableSizeAnchorEl(null)}
        >
          <MenuItem sx={{ backgroundColor: 'transparent', cursor: 'default' }}>
            <Typography variant="subtitle2">Select table sizes:</Typography>
          </MenuItem>
          <MenuItem 
            onClick={() => {
              setFilters({ ...filters, tableSizes: [] });
              setTableSizeAnchorEl(null);
            }}
            sx={{ color: 'text.secondary' }}
          >
            Clear Table Size Filters
          </MenuItem>
          <Divider />
          {['2', '3', '4', '5', '6', '7', '8', '9', '10'].map(size => (
            <MenuItem key={size}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.tableSizes.includes(size)}
                    onChange={() => handleTableSizeFilterChange(size)}
                  />
                }
                label={`${size}-handed`}
              />
            </MenuItem>
          ))}
        </Menu>

        <Menu
          anchorEl={playersAnchorEl}
          open={Boolean(playersAnchorEl)}
          onClose={() => setPlayersAnchorEl(null)}
          PaperProps={{
            style: {
              maxHeight: '400px',
              width: '250px',
            },
          }}
        >
          {allPlayers.length > 0 ? (
            <>
              <MenuItem dense>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedPlayers.length === allPlayers.length}
                      indeterminate={selectedPlayers.length > 0 && selectedPlayers.length < allPlayers.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlayers(allPlayers);
                        } else {
                          setSelectedPlayers([]);
                        }
                      }}
                    />
                  }
                  label="Select All"
                />
              </MenuItem>
              <Divider />
              {allPlayers.map(player => (
                <MenuItem key={player} dense>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedPlayers.includes(player)}
                        onChange={() => {
                          setSelectedPlayers(prev =>
                            prev.includes(player)
                              ? prev.filter(p => p !== player)
                              : [...prev, player]
                          );
                        }}
                      />
                    }
                    label={player}
                    style={{ width: '100%' }}
                  />
                </MenuItem>
              ))}
            </>
          ) : (
            <MenuItem disabled>No players found</MenuItem>
          )}
        </Menu>

        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
        >
          <MenuItem sx={{ backgroundColor: 'transparent', cursor: 'default' }}>
            <Typography variant="subtitle2">Select tags to filter:</Typography>
          </MenuItem>
          <MenuItem 
            onClick={() => {
              setSelectedTags([]);
              setFilterAnchorEl(null);
            }}
            sx={{ color: 'text.secondary' }}
          >
            Clear Tag Filters
          </MenuItem>
          <Divider />
          {allTags.map(tag => (
            <MenuItem 
              key={tag}
              onClick={() => {
                if (selectedTags.includes(tag)) {
                  setSelectedTags(selectedTags.filter(t => t !== tag));
                } else {
                  setSelectedTags([...selectedTags, tag]);
                }
              }}
            >
              <Checkbox 
                checked={selectedTags.includes(tag)}
                size="small"
              />
              <Chip
                label={tag}
                size="small"
                sx={{
                  backgroundColor: getTagColor(tag),
                  color: 'white',
                  ml: 1
                }}
              />
            </MenuItem>
          ))}
        </Menu>

        <List sx={{ pt: 0 }}>
          {selectedSessions.length > 0 && (
            <Box 
              sx={{ 
                p: 2, 
                backgroundColor: theme => mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.2)
                  : alpha(theme.palette.primary.main, 0.1),
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography>{selectedSessions.length} sessions selected</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setSelectedSession(null);
                      setTagDialogOpen(true);
                    }}
                    startIcon={<LabelIcon />}
                  >
                    Tag
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleBulkToggleVisibility(true)}
                    startIcon={<VisibilityIcon />}
                  >
                    Make Visible
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleBulkToggleVisibility(false)}
                    startIcon={<VisibilityOffIcon />}
                  >
                    Make Invisible
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleBulkDelete}
                    startIcon={<DeleteIcon />}
                  >
                    Delete
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}
          {filteredSessions.map((session) => (
            <ListItem 
              key={session.id} 
              divider 
              onMouseEnter={() => setHoveredSession(session.id)}
              onMouseLeave={() => setHoveredSession(null)}
              onClick={(e) => {
                if (
                  e.target.closest('.MuiIconButton-root') || 
                  e.target.closest('.MuiChip-root')
                ) {
                  return;
                }
                if (selectedSessions.includes(session.id)) {
                  setSelectedSessions(selectedSessions.filter(id => id !== session.id));
                } else {
                  setSelectedSessions([...selectedSessions, session.id]);
                }
              }}
              sx={{ 
                py: 1.5,
                px: 2,
                borderRadius: 2,
                mb: 1,
                opacity: session.is_active ? 1 : 0.5,
                backgroundColor: theme => session.is_active 
                  ? (mode === 'dark' ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.main, 0.05))
                  : (mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'),
                '&:hover': {
                  backgroundColor: theme => session.is_active 
                    ? (mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1))
                    : (mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)'),
                  transform: 'scale(1.005)',
                  transition: TRANSITIONS.transform,
                },
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                  transform: 'translateX(-100%)',
                  transition: 'transform 0.5s',
                },
                '&:hover::before': {
                  transform: 'translateX(100%)',
                }
              }}
            >
              <Checkbox
                checked={selectedSessions.includes(session.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  if (e.target.checked) {
                    setSelectedSessions([...selectedSessions, session.id]);
                  } else {
                    setSelectedSessions(selectedSessions.filter(id => id !== session.id));
                  }
                }}
                sx={{ mr: 1 }}
              />
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: theme => theme.palette.text.primary,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {session.display_name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: session.is_active ? 'text.secondary' : 'text.disabled'
                        }}
                      >
                        ({session.file_id || ''})
                      </Typography>
                    </Box>
                    {session.status === 'processing' && <CircularProgress size={16} />}
                    {session.tags?.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onDelete={() => handleRemoveTag(session.id, tag)}
                        sx={{
                          backgroundColor: getTagColor(tag),
                          color: 'white',
                          fontWeight: 600,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      />
                    ))}
                  </Box>
                }
                secondary={
                  <Box 
                    sx={{ 
                      color: session.is_active ? 'inherit' : 'text.disabled',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease-in-out',
                      maxHeight: hoveredSession === session.id ? '200px' : '24px'
                    }}
                  >
                    <Typography component="span" variant="subtitle1" sx={{ fontWeight: 500 }}>
                      Uploaded: {new Date(session.start_time).toLocaleString()}
                    </Typography>
                    
                    <Box 
                      sx={{ 
                        height: 8,
                        opacity: hoveredSession === session.id ? 1 : 0,
                        transition: 'opacity 0.2s ease-in-out',
                      }} 
                    />
                    
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 1,
                        opacity: hoveredSession === session.id ? 1 : 0,
                        transform: hoveredSession === session.id ? 'translateY(0)' : 'translateY(10px)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <Typography component="span" variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Game Type: {(() => {
                          try {
                            const stats = parseGameStats(session.game_stats);
                            return Object.entries(stats.game_types)
                              .sort((a, b) => b[1].percentage - a[1].percentage)
                              .map(([type, data], index) => (
                                <span key={type}>
                                  <span style={{ fontWeight: index === 0 ? 700 : 400 }}>
                                    {type} ({data.percentage}%)
                                  </span>
                                  {index < Object.entries(stats.game_types).length - 1 ? ', ' : ''}
                                </span>
                              ));
                          } catch (e) {
                            return 'N/A';
                          }
                        })()}
                      </Typography>
                      <Typography component="span" variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Table Size: {(() => {
                          try {
                            const stats = parseGameStats(session.game_stats);
                            return Object.entries(stats.table_sizes)
                              .sort((a, b) => b[1].percentage - a[1].percentage)
                              .map(([size, data], index) => (
                                <span key={size}>
                                  <span style={{ fontWeight: index === 0 ? 700 : 400 }}>
                                    {size}-handed ({data.percentage}%)
                                  </span>
                                  {index < Object.entries(stats.table_sizes).length - 1 ? ', ' : ''}
                                </span>
                              ));
                          } catch (e) {
                            return 'N/A';
                          }
                        })()}
                      </Typography>
                      <Typography component="span" variant="subtitle1" sx={{ fontWeight: 500 }}>
                        Players: {Array.isArray(session.players) ? session.players.join(', ') : 'No players'}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setSelectedSession(session);
                    setTagDialogOpen(true);
                  }}
                >
                  <LabelIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleToggleActive(session.id, session.is_active)}
                  sx={{
                    color: session.is_active ? 'default' : 'text.disabled',
                    '&:hover': {
                      color: session.is_active ? 'error.main' : 'primary.main'
                    }
                  }}
                >
                  {session.is_active ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteSession(session.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {filteredSessions.length === 0 && (
            <ListItem>
              <ListItemText primary="No sessions uploaded yet" />
            </ListItem>
          )}
        </List>
      </Paper>

      <Dialog open={tagDialogOpen} onClose={() => {
        setTagDialogOpen(false);
        setSelectedSession(null);
      }}>
        <DialogTitle>
          {selectedSessions.length > 0 
            ? `Add Tag to ${selectedSessions.length} Sessions`
            : 'Add Tag'
          }
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Select existing tag:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {allTags
                .filter(tag => !selectedSession?.tags?.includes(tag))
                .map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => {
                      if (selectedSessions.length > 0) {
                        handleBulkAddTag(tag);
                      } else {
                        handleAddTag(tag);
                      }
                      setTagDialogOpen(false);
                    }}
                    sx={{
                      backgroundColor: getTagColor(tag),
                      color: 'white',
                    }}
                  />
                ))}
            </Box>
            <Typography variant="subtitle2" gutterBottom>
              Or create new tag:
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="New Tag"
              fullWidth
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setTagDialogOpen(false);
            setSelectedSession(null);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (selectedSessions.length > 0) {
                handleBulkAddTag(newTag);
              } else {
                handleAddTag(newTag);
              }
            }} 
            color="primary"
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionsManager; 