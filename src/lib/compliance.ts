export function normalizeKey(input: string): string {
  const x = input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9.-]/g, '-');
  return x.replace(/--+/g, '-').replace(/^[-.]+|[-.]+$/g, '');
}

export function isSlugLike(key: string): boolean {
  return /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(key);
}

export function safeUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function sanitizeTitle(t?: string | null): string | undefined {
  if (!t) return undefined;
  const sanitized = Array.from(t)
    .filter(char => {
      const code = char.charCodeAt(0);
      const isControl = code < 0x20 || code === 0x7f;
      return !isControl && char !== '<' && char !== '>';
    })
    .join('');

  return sanitized.slice(0, 200);
}
