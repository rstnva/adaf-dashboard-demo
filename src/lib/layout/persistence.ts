export type LayoutOrder = string[];

export function normalizeStringOrder(keys: string[], candidate: unknown): string[] {
  const base = Array.isArray(candidate)
    ? (candidate as unknown[]).filter((value): value is string => typeof value === "string")
    : [];

  const filtered = base.filter((key) => keys.includes(key));
  const missing = keys.filter((key) => !filtered.includes(key));

  return [...filtered, ...missing];
}

export function readStringOrder(key: string): string[] | undefined {
  if (typeof window === "undefined") return undefined;
  const stored = window.localStorage.getItem(key);
  if (!stored) return undefined;
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? (parsed as unknown[]).filter((value): value is string => typeof value === "string")
      : undefined;
  } catch (error) {
    console.warn(`[layout] Failed to parse stored order for ${key}`, error);
    return undefined;
  }
}

export function writeStringOrder(key: string, order: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(order));
}

export type LayoutItem<T extends { id: string }> = T & { order: number };

export function normalizeLayoutItems<T extends { id: string }>(
  defaults: LayoutItem<T>[],
  candidate: unknown
): LayoutItem<T>[] {
  const isLayoutArray = Array.isArray(candidate);
  const casted = isLayoutArray ? (candidate as LayoutItem<T>[]) : [];
  const byId = new Map(defaults.map((item) => [item.id, item] as const));

  const filtered: LayoutItem<T>[] = [];

  for (const entry of casted) {
    if (!entry || typeof entry !== "object") continue;
    if (!("id" in entry)) continue;
    const id = (entry as { id: unknown }).id;
    if (typeof id !== "string") continue;
    const reference = byId.get(id);
    if (!reference) continue;
    filtered.push({ ...reference, ...entry, id });
  }

  const missing = defaults.filter((item) => !filtered.some((value) => value.id === item.id));

  const combined = [...filtered, ...missing];

  return combined.map((item, index) => ({ ...item, order: index }));
}

export function readLayoutItems<T extends { id: string }>(
  key: string,
  defaults: LayoutItem<T>[]
): LayoutItem<T>[] {
  if (typeof window === "undefined") return defaults;
  const stored = window.localStorage.getItem(key);
  if (!stored) return defaults;
  try {
    const parsed = JSON.parse(stored);
    return normalizeLayoutItems(defaults, parsed);
  } catch (error) {
    console.warn(`[layout] Failed to parse stored layout for ${key}`, error);
    return defaults;
  }
}

export function writeLayoutItems<T extends { id: string }>(key: string, items: LayoutItem<T>[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}
