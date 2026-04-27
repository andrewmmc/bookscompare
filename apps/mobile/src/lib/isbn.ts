export function normalizeIsbn(input: string): string {
  return input
    .trim()
    .replace(/[\s-]+/g, '')
    .toUpperCase();
}

export function isValidIsbn(input: string): boolean {
  const isbn = normalizeIsbn(input);

  return /^\d{13}$/.test(isbn) || /^\d{9}[\dX]$/.test(isbn);
}
