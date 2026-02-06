import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date: string | Date) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(amount);
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('en-US').format(num);
}
