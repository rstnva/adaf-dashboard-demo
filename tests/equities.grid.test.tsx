import React from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";

import { EquitiesSleeveGrid } from "@/components/dashboard/equities/EquitiesSleeveGrid";

describe("EquitiesSleeveGrid", () => {
  const storageKey = "equities-sleeve-layout-v1";

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("applies persisted order from localStorage", async () => {
    window.localStorage.setItem(storageKey, JSON.stringify(["signals", "overview"]));
    expect(window.localStorage.getItem(storageKey)).toBe('["signals","overview"]');

    const { container } = render(
      <EquitiesSleeveGrid
        widgets={[
          { key: "overview", component: <div data-widget="overview">Overview</div> },
          { key: "signals", component: <div data-widget="signals">Signals</div> },
        ]}
      />
    );

    await waitFor(() => {
      const grid = container.querySelector("[data-equities-order]");
      expect(grid).not.toBeNull();
      expect(grid?.getAttribute("data-equities-order")).toBe("signals,overview");
    });
  });

  it("falls back to default ordering when storage is empty", async () => {
    const { container } = render(
      <EquitiesSleeveGrid
        widgets={[
          { key: "overview", component: <div data-widget="overview">Overview</div> },
          { key: "signals", component: <div data-widget="signals">Signals</div> },
        ]}
      />
    );

    await waitFor(() => {
      const grid = container.querySelector("[data-equities-order]");
      expect(grid).not.toBeNull();
      expect(grid?.getAttribute("data-equities-order")).toBe("overview,signals");
    });
  });
});
