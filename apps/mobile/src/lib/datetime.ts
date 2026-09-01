import { i18n } from '../i18n';

/** Format a timestamp as a localized date (no time). Falls back to ISO date. */
export function formatDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString().slice(0, 10);
  }
}

/** Format a timestamp as a localized date and time. Falls back to ISO date-time. */
export function formatDateTime(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString().slice(0, 16);
  }
}
