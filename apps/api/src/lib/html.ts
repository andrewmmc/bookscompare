const NAMED_HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&gt;': '>',
  '&lt;': '<',
  '&nbsp;': ' ',
  '&#39;': "'",
  '&quot;': '"',
};

export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&(amp|gt|lt|nbsp|#39|quot);/g, (entity) => NAMED_HTML_ENTITIES[entity] ?? entity)
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([\da-f]+);/gi, (_, codePoint) => String.fromCodePoint(parseInt(codePoint, 16)));
}

export function stripTags(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

export function normalizeBookTitle(input: string): string {
  return normalizeWhitespace(input)
    .replace(/^\s*(?:【|\[)\s*電子書\s*(?:】|\])\s*/u, '')
    .replace(/\s*[（(]\s*電子書\s*[）)]\s*$/u, '')
    .trim();
}

export function toAbsoluteUrl(url: string): string {
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  return url;
}
