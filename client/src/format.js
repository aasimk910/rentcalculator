export const npr = (amount) => `NPR ${amount.toLocaleString()}`;

export const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const billForMonth = (tenant, month) => tenant.billHistory?.find((b) => b.month === month);
