import { Box, Paper, Typography } from '@mui/material';

/** A single KPI: label, big value, optional hint line and icon. */
export default function StatCard({ label, value, hint, icon, color = 'primary.main' }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {icon && <Box sx={{ color, display: 'flex' }}>{icon}</Box>}
      </Box>
      <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Paper>
  );
}
