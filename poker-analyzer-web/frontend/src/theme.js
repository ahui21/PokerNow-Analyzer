import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',  // Lighter blue
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    background: {
      default: '#1a1a1a',  // Slightly lighter dark background
      paper: 'rgba(45, 45, 45, 0.95)',  // Lighter paper background
    },
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
}); 