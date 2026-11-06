import { CURRENCY } from '@stockflow/shared/plans';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: CURRENCY });
const shortDate = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });

/** 1234.5 -> "₹1,234.50" */
export const formatMoney = (value) => money.format(Number(value) || 0);

/** ISO string or Date -> "5 Nov 2026"; empty for missing values. */
export const formatDate = (value) => (value ? shortDate.format(new Date(value)) : '');

/**
 * Date -> "yyyy-mm-dd" in the user's own timezone, for <input type="date">.
 * (toISOString() would convert to UTC first, which shows the wrong day in
 * timezones ahead of UTC, e.g. 1 Nov 00:30 in India is still 31 Oct in UTC.)
 */
export const toInputDate = (date = new Date()) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
