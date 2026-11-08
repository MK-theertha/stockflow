import { lazy } from 'react';

// Pages are loaded on demand, so the first visit only downloads what it shows.
const page = (load) => lazy(load);

const InvoiceListPage = page(() => import('@/features/sales/InvoiceListPage'));
const AdminRecordsPage = page(() => import('@/features/admin/AdminRecordsPage'));

export const PUBLIC_ROUTES = [
  { path: '/', Component: page(() => import('@/features/home/HomePage')) },
  { path: '/login', Component: page(() => import('@/features/auth/LoginPage')) },
  { path: '/register', Component: page(() => import('@/features/auth/RegisterPage')) },
  { path: '/pricing', Component: page(() => import('@/features/billing/PricingPage')) },
  { path: '/success', Component: page(() => import('@/features/billing/CheckoutSuccessPage')) },
  { path: '/cancel', Component: page(() => import('@/features/billing/CheckoutCancelPage')) },
];

// Available to both roles under their own /dashboard/<role> prefix.
const ACCOUNT_ROUTES = [
  { path: 'profile', Component: page(() => import('@/features/account/ProfilePage')) },
  {
    path: 'change-password',
    Component: page(() => import('@/features/account/ChangePasswordPage')),
  },
  { path: 'logout', Component: page(() => import('@/features/auth/LogoutPage')) },
];

// Paths are relative to /dashboard/user. Sidebar entries live in navigation.js.
export const USER_ROUTES = [
  { index: true, Component: page(() => import('@/features/dashboard/DashboardPage')) },

  // Sales
  // The keys stop React reusing one page's state (filter, search) for the other.
  { path: 'invoices', element: <InvoiceListPage key="all" /> },
  { path: 'invoices/pending', element: <InvoiceListPage key="pending" initialFilter="pending" /> },
  { path: 'invoices/new', Component: page(() => import('@/features/sales/CreateInvoicePage')) },
  { path: 'invoices/:id', Component: page(() => import('@/features/sales/InvoiceDetailPage')) },
  {
    path: 'receivables',
    Component: page(() => import('@/features/receivables/ReceivablesPage')),
  },
  {
    path: 'invoices/paid',
    Component: page(() => import('@/features/receivables/PaidInvoicesPage')),
  },

  // Purchasing
  { path: 'purchases', Component: page(() => import('@/features/purchases/PurchasesPage')) },
  { path: 'expenses', Component: page(() => import('@/features/expenses/ExpensesPage')) },

  // Inventory
  { path: 'products', Component: page(() => import('@/features/catalog/ProductsPage')) },
  {
    path: 'stock-ledger',
    Component: page(() => import('@/features/inventory/StockLedgerPage')),
  },
  { path: 'low-stock', Component: page(() => import('@/features/inventory/LowStockPage')) },

  // Master data
  { path: 'customers', Component: page(() => import('@/features/customers/CustomersPage')) },
  { path: 'suppliers', Component: page(() => import('@/features/catalog/SuppliersPage')) },
  { path: 'categories', Component: page(() => import('@/features/catalog/CategoriesPage')) },
  { path: 'units', Component: page(() => import('@/features/catalog/UnitsPage')) },

  // Reports
  { path: 'reports/stock', Component: page(() => import('@/features/inventory/StockReport')) },
  { path: 'reports/sales', Component: page(() => import('@/features/reports/DailyInvoiceReport')) },
  {
    path: 'reports/purchases',
    Component: page(() => import('@/features/reports/DailyPurchaseReport')),
  },
  {
    path: 'reports/supplier-category',
    Component: page(() => import('@/features/reports/SupplierProductReport')),
  },

  // Subscription
  { path: 'subscription', Component: page(() => import('@/features/billing/SubscriptionPage')) },
  {
    path: 'subscription/payments',
    Component: page(() => import('@/features/billing/PaymentHistoryPage')),
  },

  ...ACCOUNT_ROUTES,
];

// Paths are relative to /dashboard/admin.
export const ADMIN_ROUTES = [
  { index: true, Component: page(() => import('@/features/admin/AdminDashboardPage')) },
  { path: 'shops', Component: page(() => import('@/features/admin/ShopsPage')) },
  ...['products', 'purchases', 'invoices', 'suppliers', 'categories', 'units'].map((resource) => ({
    path: resource,
    element: <AdminRecordsPage key={resource} resource={resource} />,
  })),
  ...ACCOUNT_ROUTES,
];
