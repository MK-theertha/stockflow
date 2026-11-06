import { EXPENSE_CATEGORIES } from '@stockflow/shared/expenses';

import CrudPage from '@/components/common/CrudPage';
import { formatDate, formatMoney, toInputDate } from '@/lib/format';
import { thunks } from '@/store/slices/expenseSlice';

const columns = [
  { label: 'Date', render: (e) => formatDate(e.date) },
  { label: 'Category', render: (e) => e.category, search: (e) => e.category },
  { label: 'Paid to', render: (e) => e.paidTo, search: (e) => e.paidTo },
  { label: 'Note', render: (e) => e.note, search: (e) => e.note },
  { label: 'Amount', align: 'right', render: (e) => formatMoney(e.amount) },
];

const fields = [
  {
    name: 'date',
    label: 'Date',
    type: 'date',
    required: true,
    // <input type="date"> needs yyyy-mm-dd; the API sends a full ISO date.
    fromRow: (row) => (row?.date ? row.date.slice(0, 10) : toInputDate()),
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    defaultValue: EXPENSE_CATEGORIES[0],
    options: EXPENSE_CATEGORIES.map((category) => ({ value: category, label: category })),
  },
  { name: 'amount', label: 'Amount', type: 'number', required: true },
  { name: 'paidTo', label: 'Paid to' },
  { name: 'note', label: 'Note', type: 'textarea' },
];

/** Running costs that are not stock: rent, salaries, utilities... */
export default function ExpensesPage() {
  return (
    <CrudPage
      title="Expenses"
      subtitle="Money spent on running the shop. Stock purchases are recorded under Purchases."
      noun="expense"
      stateKey="expenses"
      thunks={thunks}
      columns={columns}
      fields={fields}
      describe={(e) => `${e.category} ${formatMoney(e.amount)} on ${formatDate(e.date)}`}
    />
  );
}
