import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Alert, Box, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { useApi } from '@/hooks/useApi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// Keys returned by GET /api/admin, in display order.
const SERIES = [
  ['productcount', 'Products'],
  ['customercount', 'Customers'],
  ['suppliercount', 'Suppliers'],
  ['categorycount', 'Categories'],
  ['unitcount', 'Units'],
  ['purchasescount', 'Purchases'],
  ['invoicecount', 'Invoices'],
  ['paymentcount', 'Payments'],
  ['subscriptioncount', 'Subscriptions'],
];

/** How many records of each kind exist across all shops. */
export default function PlatformCharts() {
  const theme = useTheme();
  const { data, loading, error } = useApi('/api/admin');

  if (loading) return <CircularProgress size={24} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const text = theme.palette.text.secondary;
  const chartData = {
    labels: SERIES.map(([, label]) => label),
    datasets: [
      {
        label: 'Records',
        data: SERIES.map(([key]) => data[key] ?? 0),
        backgroundColor: theme.palette.primary.main,
        borderRadius: 4,
      },
    ],
  };

  return (
    <Box sx={{ height: 320 }}>
      <Bar
        data={chartData}
        options={{
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: text, precision: 0 }, grid: { color: theme.palette.divider } },
            y: { ticks: { color: text }, grid: { display: false } },
          },
        }}
      />
    </Box>
  );
}
