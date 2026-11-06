// How invoice states are shown everywhere in the app.

export const PAYMENT_STATUS = {
  full_paid: { label: 'Paid', color: 'success' },
  partial_paid: { label: 'Partly paid', color: 'warning' },
  full_due: { label: 'Unpaid', color: 'error' },
};

export const approvalStatus = (approved) =>
  approved ? { label: 'Approved', color: 'success' } : { label: 'Pending', color: 'default' };
