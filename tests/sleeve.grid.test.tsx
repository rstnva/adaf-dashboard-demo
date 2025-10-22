import React from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";

import { SleeveGrid, type SleeveWidget } from "@/components/dashboard/common/SleeveGrid";

describe("SleeveGrid", () => {
  const storageKey = "test-sleeve-layout";

  const widgets: SleeveWidget[] = [
    { key: "alpha", component: <div data-widget="alpha">Alpha</div> },
    { key: "beta", component: <div data-widget="beta">Beta</div> },
    { key: "gamma", component: <div data-widget="gamma">Gamma</div> },
  ];

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders widgets in default order when no storage is present", async () => {
    const { container } = render(
      <SleeveGrid storageKey={storageKey} widgets={widgets} orderAttribute="data-order" />
    );

    await waitFor(() => {
      const order = container.querySelector("[data-order]");
      expect(order?.getAttribute("data-order")).toBe("alpha,beta,gamma");
    });
  });

  it("applies stored order from localStorage", async () => {
    window.localStorage.setItem(storageKey, JSON.stringify(["gamma", "alpha", "beta"]));

    const { container } = render(
      <SleeveGrid storageKey={storageKey} widgets={widgets} orderAttribute="data-order" />
    );

    await waitFor(() => {
      const order = container.querySelector("[data-order]");
      expect(order?.getAttribute("data-order")).toBe("gamma,alpha,beta");
    });
  });
});
