import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '@mui/material/styles';

import { formatMoney } from '@/lib/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/** Monthly sales for the last few months, from /api/user/dashboard's salesTrend. */
export default function SalesTrendChart({ trend }) {
  const theme = useTheme();
  const text = theme.palette.text.secondary;
  const grid = theme.palette.divider;

  const data = {
    labels: trend.map((row) => row.month),
    datasets: [
      {
        label: 'Sales',
        data: trend.map((row) => row.total),
        backgroundColor: theme.palette.primary.main,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (item) => formatMoney(item.raw) } },
    },
    scales: {
      x: { ticks: { color: text }, grid: { display: false } },
      y: { ticks: { color: text }, grid: { color: grid }, beginAtZero: true },
    },
  };

  return <Bar data={data} options={options} />;
}
