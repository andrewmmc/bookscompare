export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs?: number
): Promise<Response> {
  if (!timeoutMs) {
    return fetch(url, init);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
