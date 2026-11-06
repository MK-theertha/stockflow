// Single source of truth for plan prices. The checkout API charges from this
// table, so the amount can never be chosen by the browser.
export const PLANS = {
  report: { title: 'Purchase 1 Report', monthly: 29, annual: 290 },
  starter: { title: 'Starter Plan', monthly: 19, annual: 190 },
  agency: { title: 'Agency Plan', monthly: 99, annual: 990 },
};

export const CURRENCY = 'INR';

export const getPlanPrice = (plan, billingPeriod) => PLANS[plan]?.[billingPeriod];
