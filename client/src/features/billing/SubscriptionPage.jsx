import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';

import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import { useApi } from '@/hooks/useApi';
import { formatDate, formatMoney } from '@/lib/format';
import { useSession } from '@/lib/session';

const DAY = 24 * 60 * 60 * 1000;

/** The shop's StockFlow subscription: status, dates and time left. */
export default function SubscriptionPage() {
  const { data: session } = useSession();
  const userId = session?.user?._id;
  const {
    data: subscription,
    loading,
    error,
  } = useApi(userId ? `/api/user/billing/${userId}` : null);

  if (loading) return <CircularProgress />;

  const renew = (
    <Button variant="contained" component={RouterLink} to="/pricing">
      Renew or change plan
    </Button>
  );

  if (error || !subscription) {
    return (
      <>
        <PageHeader title="My plan" actions={renew} />
        <Alert severity="info">{error ?? 'You do not have a subscription yet.'}</Alert>
      </>
    );
  }

  const start = new Date(subscription.startDate);
  const end = new Date(subscription.endDate);
  const daysLeft = Math.max(0, Math.ceil((end - Date.now()) / DAY));
  const totalDays = Math.max(1, Math.round((end - start) / DAY));
  const active = daysLeft > 0;

  return (
    <>
      <PageHeader title="My plan" subtitle="Your StockFlow subscription." actions={renew} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Status"
            value={
              <Chip label={active ? 'Active' : 'Expired'} color={active ? 'success' : 'error'} />
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Days left" value={daysLeft} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Renews / ends" value={formatDate(end)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Last payment" value={formatMoney(subscription.price)} />
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {formatDate(start)} → {formatDate(end)}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, (daysLeft / totalDays) * 100)}
          color={daysLeft < 7 ? 'warning' : 'primary'}
          sx={{ height: 8, borderRadius: 4 }}
        />
        {active && daysLeft < 7 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Your plan ends in {daysLeft} days. Renew now so the dashboard keeps working.
          </Alert>
        )}
      </Paper>
    </>
  );
}
