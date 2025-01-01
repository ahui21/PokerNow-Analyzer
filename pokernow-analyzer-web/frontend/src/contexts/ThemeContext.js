import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('dark');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'dark' ? {
            primary: {
              main: '#2196F3',
              light: '#64B5F6',
              dark: '#1976D2',
            },
            background: {
              default: '#0A1929',
              paper: '#132f4c',
            },
            text: {
              primary: '#fff',
              secondary: 'rgba(255, 255, 255, 0.7)',
            },
            divider: 'rgba(255, 255, 255, 0.12)',
          } : {
            primary: {
              main: '#1976D2',
              light: '#42a5f5',
              dark: '#1565c0',
            },
            background: {
              default: '#f5f5f5',
              paper: '#ffffff',
            },
            divider: 'rgba(0, 0, 0, 0.12)',
          }),
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h6: {
            fontWeight: 600,
            letterSpacing: '0.5px',
          },
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 