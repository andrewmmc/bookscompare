import { activeLocale } from '../i18n/strings';

const dateFormatter = new Intl.DateTimeFormat(activeLocale, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(activeLocale, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/** Format a timestamp as a localized date (no time). Falls back to ISO date. */
export function formatDate(timestamp: number): string {
  try {
    return dateFormatter.format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString().slice(0, 10);
  }
}

/** Format a timestamp as a localized date and time. Falls back to ISO date-time. */
export function formatDateTime(timestamp: number): string {
  try {
    return dateTimeFormatter.format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toISOString().slice(0, 16);
  }
}
