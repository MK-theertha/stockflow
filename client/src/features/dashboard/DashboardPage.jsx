import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Inventory2,
  PendingActions,
  ShoppingCart,
  TrendingUp,
} from '@mui/icons-material';

import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import AiAssistant from '@/features/ai/AiAssistant';
import { useApi } from '@/hooks/useApi';
import { formatDate, formatMoney } from '@/lib/format';
import { useSession } from '@/lib/session';

import { PAYMENT_STATUS } from '@/features/sales/status';

import SalesTrendChart from './SalesTrendChart';

function Panel({ title, action, children }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

const PanelLink = ({ to, children }) => (
  <Link component={RouterLink} to={to} variant="body2">
    {children}
  </Link>
);

/**
 * The home screen after login: today's numbers, trends and things that need attention.
 * Admins see the same view with totals across every shop.
 */
export default function DashboardPage({ children }) {
  const { data: session } = useSession();
  const { data, loading, error } = useApi('/api/user/dashboard');
  const base = `/dashboard/${session?.user?.role}`;

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const { sales, purchases, expenses, receivables, counts, salesTrend, topProducts, lowStock } =
    data;

  return (
    <>
      <PageHeader
        title={`Welcome, ${session?.user?.name ?? ''}`}
        subtitle={session?.user?.role === 'admin' ? 'Totals across every shop' : 'Your shop today'}
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Sales today"
            value={formatMoney(sales.today.total)}
            hint={`${sales.today.invoices} approved invoices`}
            icon={<TrendingUp />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Sales this month"
            value={formatMoney(sales.thisMonth.total)}
            hint={`Purchases ${formatMoney(purchases.thisMonth.total)} · Expenses ${formatMoney(
              expenses.thisMonth.total
            )}`}
            icon={<ShoppingCart />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Receivables"
            value={formatMoney(receivables.total)}
            hint={`${receivables.invoices} invoices with money due`}
            icon={<AccountBalanceWallet />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Waiting for approval"
            value={counts.pendingInvoices + counts.pendingPurchases}
            hint={`${counts.pendingInvoices} invoices, ${counts.pendingPurchases} purchases`}
            icon={<PendingActions />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} lg={8}>
          <Panel title="Sales, last 6 months">
            <Box sx={{ height: 280 }}>
              <SalesTrendChart trend={salesTrend} />
            </Box>
          </Panel>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Panel title="Best sellers">
            {topProducts.length === 0 && (
              <Typography color="text.secondary">No approved sales yet.</Typography>
            )}
            <List dense disablePadding>
              {topProducts.map((product) => (
                <ListItem key={product._id} disableGutters>
                  <ListItemText
                    primary={product.productName}
                    secondary={`${product.quantity} sold · ${formatMoney(product.revenue)}`}
                  />
                </ListItem>
              ))}
            </List>
          </Panel>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Panel
            title="Low stock"
            action={<PanelLink to={`${base}/low-stock`}>View all</PanelLink>}
          >
            {lowStock.length === 0 && (
              <Typography color="text.secondary">Nothing needs reordering.</Typography>
            )}
            <List dense disablePadding>
              {lowStock.map((product) => (
                <ListItem
                  key={product._id}
                  disableGutters
                  secondaryAction={
                    <Chip
                      size="small"
                      color={product.quantity === 0 ? 'error' : 'warning'}
                      label={`${product.quantity} / ${product.reorderLevel}`}
                    />
                  }
                >
                  <ListItemText primary={product.productName} />
                </ListItem>
              ))}
            </List>
          </Panel>
        </Grid>
        <Grid item xs={12} md={6}>
          <Panel
            title="Recent invoices"
            action={<PanelLink to={`${base}/invoices`}>View all</PanelLink>}
          >
            {data.recentPayments.length === 0 && (
              <Typography color="text.secondary">No invoices yet.</Typography>
            )}
            <List dense disablePadding>
              {data.recentPayments.map((payment) => (
                <ListItem
                  key={payment._id}
                  disableGutters
                  secondaryAction={<Chip size="small" {...PAYMENT_STATUS[payment.paid_status]} />}
                >
                  <ListItemText
                    primary={`${payment.invoice_id?.invoice_no ?? ''} · ${
                      payment.customer_id?.name ?? ''
                    }`}
                    secondary={`${formatMoney(payment.total_amount)} · ${formatDate(
                      payment.invoice_id?.date
                    )}`}
                  />
                </ListItem>
              ))}
            </List>
          </Panel>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <StatCard label="Products" value={counts.products} icon={<Inventory2 />} />
        </Grid>
        <Grid item xs={4}>
          <StatCard label="Customers" value={counts.customers} />
        </Grid>
        <Grid item xs={4}>
          <StatCard label="Suppliers" value={counts.suppliers} />
        </Grid>
      </Grid>

      {children}

      <Panel title="Ask the AI assistant">
        <AiAssistant />
      </Panel>
    </>
  );
}
