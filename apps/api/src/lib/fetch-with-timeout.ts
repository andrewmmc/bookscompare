export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs?: number
): Promise<Response> {
  if (!timeoutMs) {
    return fetch(url, init);
  }

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(init.signal?.reason);
  if (init.signal?.aborted) {
    abortFromCaller();
  } else {
    init.signal?.addEventListener('abort', abortFromCaller, { once: true });
  }
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException(`Request timed out after ${timeoutMs}ms.`, 'TimeoutError'));
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    init.signal?.removeEventListener('abort', abortFromCaller);
  }
}
