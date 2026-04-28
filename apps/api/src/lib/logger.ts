type LogLevel = 'info' | 'warn' | 'error';

interface LogFields {
  [key: string]: string | number | boolean | null | undefined;
}

function emit(level: LogLevel, event: string, fields: LogFields = {}): void {
  const payload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  };

  const line = JSON.stringify(payload);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logProviderResult(fields: {
  providerId: string;
  status: 'ready' | 'error' | 'disabled';
  durationMs: number;
  offerCount?: number | undefined;
  message?: string | undefined;
}): void {
  emit(fields.status === 'error' ? 'warn' : 'info', 'provider.result', fields);
}

export function logFetchAttempt(fields: {
  providerId?: string | undefined;
  url: string;
  attempt: number;
  status?: number | undefined;
  durationMs?: number | undefined;
  error?: string | undefined;
}): void {
  emit(fields.error ? 'warn' : 'info', 'fetch.attempt', fields);
}

export function logParseFailure(fields: { providerId: string; reason: string }): void {
  emit('error', 'provider.parse_failure', fields);
}
