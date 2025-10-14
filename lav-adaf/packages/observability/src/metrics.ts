export interface CounterLabels {
  readonly [key: string]: string;
}

export interface MetricSnapshot {
  readonly counters: ReadonlyArray<{
    name: string;
    value: number;
    labels: CounterLabels;
  }>;
  readonly histograms: ReadonlyArray<{
    name: string;
    count: number;
    sum: number;
    labels: CounterLabels;
  }>;
}

export class MetricRegistry {
  private readonly counters = new Map<string, number>();
  private readonly histograms = new Map<
    string,
    { count: number; sum: number }
  >();

  increment(name: string, labels: CounterLabels = {}, value = 1): void {
    const key = this.serialize(name, labels);
    const current = this.counters.get(key) ?? 0;
    this.counters.set(key, current + value);
  }

  observe(name: string, value: number, labels: CounterLabels = {}): void {
    const key = this.serialize(name, labels);
    const entry = this.histograms.get(key) ?? { count: 0, sum: 0 };
    entry.count += 1;
    entry.sum += value;
    this.histograms.set(key, entry);
  }

  snapshot(): MetricSnapshot {
    return {
      counters: Array.from(this.counters.entries()).map(([key, value]) => ({
        name: this.parseName(key),
        value,
        labels: this.parseLabels(key),
      })),
      histograms: Array.from(this.histograms.entries()).map(([key, entry]) => ({
        name: this.parseName(key),
        count: entry.count,
        sum: entry.sum,
        labels: this.parseLabels(key),
      })),
    };
  }

  clear(): void {
    this.counters.clear();
    this.histograms.clear();
  }

  private serialize(name: string, labels: CounterLabels): string {
    const sorted = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    return `${name}|${sorted}`;
  }

  private parseName(serialized: string): string {
    return serialized.split('|')[0] ?? serialized;
  }

  private parseLabels(serialized: string): CounterLabels {
    const [, labelPart] = serialized.split('|');
    if (!labelPart) return {};
    return Object.fromEntries(
      labelPart
        .split(',')
        .filter(Boolean)
        .map(pair => {
          const [key, value] = pair.split('=');
          return [key, value];
        })
    );
  }
}
