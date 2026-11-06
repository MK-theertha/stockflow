import {
  AccountBalanceWallet,
  Assessment,
  Category,
  CreditCard,
  Dashboard,
  Groups,
  History,
  Inventory2,
  LocalShipping,
  PlaylistAddCheck,
  PointOfSale,
  Receipt,
  ReceiptLong,
  RequestQuote,
  ShoppingCart,
  Storefront,
  Straighten,
  SwapVert,
  TaskAlt,
  WarningAmber,
} from '@mui/icons-material';

// Sidebar menus. `path` is relative to /dashboard/<role>; '' is the dashboard itself.
// Every path here must have a matching route in routes.jsx.
export const NAVIGATION = {
  user: [
    { items: [{ label: 'Dashboard', path: '', icon: Dashboard }] },
    {
      heading: 'Sales',
      items: [
        { label: 'New invoice', path: 'invoices/new', icon: PointOfSale },
        { label: 'Approve invoices', path: 'invoices/pending', icon: PlaylistAddCheck },
        { label: 'Invoices', path: 'invoices', icon: ReceiptLong },
        { label: 'Receivables', path: 'receivables', icon: AccountBalanceWallet },
        { label: 'Paid invoices', path: 'invoices/paid', icon: TaskAlt },
      ],
    },
    {
      heading: 'Purchasing',
      items: [
        { label: 'Purchases', path: 'purchases', icon: ShoppingCart },
        { label: 'Expenses', path: 'expenses', icon: Receipt },
      ],
    },
    {
      heading: 'Inventory',
      items: [
        { label: 'Products', path: 'products', icon: Inventory2 },
        { label: 'Stock ledger', path: 'stock-ledger', icon: SwapVert },
        { label: 'Low stock', path: 'low-stock', icon: WarningAmber },
      ],
    },
    {
      heading: 'Master data',
      items: [
        { label: 'Customers', path: 'customers', icon: Groups },
        { label: 'Suppliers', path: 'suppliers', icon: LocalShipping },
        { label: 'Categories', path: 'categories', icon: Category },
        { label: 'Units', path: 'units', icon: Straighten },
      ],
    },
    {
      heading: 'Reports',
      items: [
        { label: 'Stock report', path: 'reports/stock', icon: Assessment },
        { label: 'Daily sales', path: 'reports/sales', icon: RequestQuote },
        { label: 'Daily purchases', path: 'reports/purchases', icon: RequestQuote },
        { label: 'Supplier / category', path: 'reports/supplier-category', icon: Assessment },
      ],
    },
    {
      heading: 'Subscription',
      items: [
        { label: 'My plan', path: 'subscription', icon: CreditCard },
        { label: 'Payment history', path: 'subscription/payments', icon: History },
      ],
    },
  ],
  admin: [
    {
      items: [
        { label: 'Dashboard', path: '', icon: Dashboard },
        { label: 'Shops', path: 'shops', icon: Storefront },
      ],
    },
    {
      heading: 'All shops',
      items: [
        { label: 'Products', path: 'products', icon: Inventory2 },
        { label: 'Purchases', path: 'purchases', icon: ShoppingCart },
        { label: 'Invoices', path: 'invoices', icon: ReceiptLong },
        { label: 'Suppliers', path: 'suppliers', icon: LocalShipping },
        { label: 'Categories', path: 'categories', icon: Category },
        { label: 'Units', path: 'units', icon: Straighten },
      ],
    },
  ],
};
