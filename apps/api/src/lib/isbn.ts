export function normalizeIsbn(input: string): string {
  return input
    .trim()
    .replace(/[\s-]+/g, '')
    .toUpperCase();
}

function isValidIsbn10(isbn: string): boolean {
  if (!/^\d{9}[\dX]$/.test(isbn)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += (10 - i) * Number(isbn[i]);
  }
  const checkChar = isbn[9];
  sum += checkChar === 'X' ? 10 : Number(checkChar);

  return sum % 11 === 0;
}

function isValidIsbn13(isbn: string): boolean {
  if (!/^\d{13}$/.test(isbn)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += (i % 2 === 0 ? 1 : 3) * Number(isbn[i]);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === Number(isbn[12]);
}

export function isValidIsbn(input: string): boolean {
  const isbn = normalizeIsbn(input);

  return isValidIsbn13(isbn) || isValidIsbn10(isbn);
}
