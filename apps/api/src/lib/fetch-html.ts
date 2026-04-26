interface FetchHtmlOptions {
  headers?: HeadersInit
  notFoundStatus?: number
  errorLabel?: string
}

export async function fetchHtml(url: string, options: FetchHtmlOptions = {}): Promise<string | null> {
  const response = await fetch(url, options.headers ? { headers: options.headers } : undefined)

  if (options.notFoundStatus && response.status === options.notFoundStatus) {
    return null
  }

  if (!response.ok) {
    throw new Error(options.errorLabel ? `${options.errorLabel} returned ${response.status}.` : `Request failed with ${response.status}.`)
  }

  return response.text()
}
