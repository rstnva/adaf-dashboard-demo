import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { trackUiEvent } from "@/lib/utils/telemetry";

describe("Equities telemetry events", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis as any, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }) as any
    );
    sessionStorage.clear();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("emits macro change events with metadata", async () => {
    await trackUiEvent.equitiesMacroChange("risk-on");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const requestInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(requestInit?.method).toBe("POST");
    const payload = JSON.parse(String(requestInit?.body ?? "{}"));
    expect(payload.action).toBe("macro_change");
    expect(payload.component).toBe("EquitiesSleeve");
    expect(payload.meta).toMatchObject({ macro: "risk-on" });
  });

  it("emits backtest run telemetry", async () => {
    await trackUiEvent.equitiesRunBacktest({
      sleeveId: "equities-ai-core",
      macro: "neutral",
      dryRun: true,
      tickers: ["AAPL", "MSFT"],
    });

    const requestInit = fetchSpy.mock.calls.at(-1)?.[1] as RequestInit;
    const payload = JSON.parse(String(requestInit?.body ?? "{}"));
    expect(payload.action).toBe("run_backtest");
    expect(payload.meta).toMatchObject({
      sleeveId: "equities-ai-core",
      dryRun: true,
      tickers: ["AAPL", "MSFT"],
    });
  });
});
