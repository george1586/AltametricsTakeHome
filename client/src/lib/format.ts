const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const date = new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

export const formatAmount = (value: number) => currency.format(value);
export const formatDate = (value: Date) => date.format(value);