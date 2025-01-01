// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  CssBaseline,
  Collapse,
  Divider,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Casino as CasinoIcon,
  Timeline as TimelineIcon,
  DateRange as DateRangeIcon,
  Assessment as AssessmentIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  FolderOpen as FolderIcon,
  ExpandLess,
  ExpandMore,
  Brightness7,
  Brightness4
} from '@mui/icons-material';
import { useTheme } from './contexts/ThemeContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';

import GameBreakdown from './components/GameBreakdown';
import SessionsManager from './components/SessionsManager';
import Settings from './components/Settings';
import FileUpload from './components/FileUpload';
import LifetimeTotals from './components/LifetimeTotals';
import RangeAnalysis from './components/RangeAnalysis';
import PlayerTendencies from './components/PlayerTendencies';
import GameStatistics from './components/GameStatistics';
import LifetimeStatistics from './components/LifetimeStatistics';
import SupabaseTest from './components/SupabaseTest';
// Import other components as needed

const drawerWidth = 240;

function App() {
  const { mode, setMode } = useTheme();
  const theme = useMuiTheme();
  const [individualStatsOpen, setIndividualStatsOpen] = useState(true);

  const handleIndividualStatsClick = () => {
    setIndividualStatsOpen(!individualStatsOpen);
  };

  const listItemStyles = {
    '&:hover': { 
      backgroundColor: mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(0, 0, 0, 0.04)'
    },
    '& .MuiListItemText-primary': {
      color: mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.87)',
    },
    '& .MuiListItemIcon-root': {
      color: mode === 'dark' ? '#90caf9' : '#1976d2',
    }
  };

  const nestedListItemStyles = {
    pl: 4,
    '&:hover': { 
      backgroundColor: mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(0, 0, 0, 0.04)'
    },
    '& .MuiListItemText-primary': {
      color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    },
    '& .MuiListItemIcon-root': {
      color: mode === 'dark' ? '#90caf9' : '#1976d2',
    }
  };

  return (
    <Router>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <CssBaseline />
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: mode === 'dark' ? 'background.paper' : 'primary.main'
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" noWrap>
              PokerNow Sessions Analyzer
            </Typography>
            <IconButton
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              sx={{
                color: 'inherit',
              }}
            >
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: theme => theme.palette.background.paper,
              borderRight: '1px solid',
              borderColor: theme => theme.palette.divider,
            },
          }}
        >
          <Toolbar />
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <List>
              <ListItem 
                button 
                onClick={handleIndividualStatsClick}
                sx={listItemStyles}
              >
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Individual Statistics" />
                {individualStatsOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              
              <Collapse in={individualStatsOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem 
                    button 
                    component={Link} 
                    to="/game-breakdowns"
                    sx={nestedListItemStyles}
                  >
                    <ListItemIcon><AssessmentIcon /></ListItemIcon>
                    <ListItemText primary="Game Breakdowns" />
                  </ListItem>
                  
                  <ListItem 
                    button 
                    component={Link} 
                    to="/lifetime-totals"
                    sx={nestedListItemStyles}
                  >
                    <ListItemIcon><TimelineIcon /></ListItemIcon>
                    <ListItemText primary="Lifetime Totals" />
                  </ListItem>
                  
                  <ListItem 
                    button 
                    component={Link} 
                    to="/range-analysis"
                    sx={nestedListItemStyles}
                  >
                    <ListItemIcon><DateRangeIcon /></ListItemIcon>
                    <ListItemText primary="Range Analysis" />
                  </ListItem>

                  <ListItem 
                    button 
                    component={Link} 
                    to="/player-tendencies"
                    sx={nestedListItemStyles}
                  >
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText primary="Player Tendencies" />
                  </ListItem>
                </List>
              </Collapse>

              <ListItem 
                button 
                component={Link} 
                to="/game-statistics"
                sx={listItemStyles}
              >
                <ListItemIcon><CasinoIcon /></ListItemIcon>
                <ListItemText primary="Game Statistics" />
              </ListItem>
              
              <ListItem 
                button 
                component={Link} 
                to="/lifetime-statistics"
                sx={listItemStyles}
              >
                <ListItemIcon><AnalyticsIcon /></ListItemIcon>
                <ListItemText primary="Lifetime Statistics" />
              </ListItem>
            </List>

            <Box sx={{ flexGrow: 1 }} />

            <List>
              <Divider sx={{ borderColor: theme => theme.palette.divider }} />
              <ListItem 
                button 
                component={Link} 
                to="/sessions"
                sx={listItemStyles}
              >
                <ListItemIcon><FolderIcon /></ListItemIcon>
                <ListItemText primary="Sessions Manager" />
              </ListItem>
              
              <ListItem 
                button 
                component={Link} 
                to="/settings"
                sx={listItemStyles}
              >
                <ListItemIcon><SettingsIcon /></ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItem>
            </List>
          </Box>
        </Drawer>
        
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            p: 3,
            backgroundColor: 'background.default',
            marginTop: '64px'
          }}
        >
          <Routes>
            <Route path="/" element={<GameBreakdown />} />
            <Route path="/game-breakdowns" element={<GameBreakdown />} />
            <Route path="/lifetime-totals" element={<LifetimeTotals />} />
            <Route path="/range-analysis" element={<RangeAnalysis />} />
            <Route path="/player-tendencies" element={<PlayerTendencies />} />
            <Route path="/game-statistics" element={<GameStatistics />} />
            <Route path="/lifetime-statistics" element={<LifetimeStatistics />} />
            <Route path="/sessions" element={<SessionsManager />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/test-connection" element={<SupabaseTest />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;