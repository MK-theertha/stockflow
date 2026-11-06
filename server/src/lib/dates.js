export const endOfDay = (date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const addBillingPeriod = (date, billingPeriod) => {
  const result = new Date(date);
  if (billingPeriod === 'annual') result.setFullYear(result.getFullYear() + 1);
  else result.setMonth(result.getMonth() + 1);
  return result;
};
