import { Box, Typography } from '@mui/material';

/** Page title with an optional subtitle and buttons on the right. */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
        pb: 2,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
    </Box>
  );
}
