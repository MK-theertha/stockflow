import { Box, Paper, Typography } from '@mui/material';

import DashboardPage from '@/features/dashboard/DashboardPage';

import PlatformCharts from './PlatformCharts';

/** The shop dashboard with platform-wide totals, plus record counts for the whole system. */
export default function AdminDashboardPage() {
  return (
    <DashboardPage>
      <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Records in the system
        </Typography>
        <Box>
          <PlatformCharts />
        </Box>
      </Paper>
    </DashboardPage>
  );
}
