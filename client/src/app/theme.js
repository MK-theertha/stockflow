import { createTheme } from '@mui/material/styles';

// One theme for the whole app. Components should use theme colors
// (`primary.main`, `text.secondary`, ...) instead of hard-coded values.
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#2f6bff' },
    secondary: { main: '#ff4d6d' },
    background: { default: '#000000', paper: '#121212' },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { fullWidth: true, size: 'small' } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } },
  },
});
