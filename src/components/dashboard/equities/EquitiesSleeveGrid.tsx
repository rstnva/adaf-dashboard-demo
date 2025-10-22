"use client";

import React from "react";
import { SleeveGrid, type SleeveWidget } from "@/components/dashboard/common/SleeveGrid";

export interface EquitiesSleeveGridProps {
  widgets: SleeveWidget[];
}

const STORAGE_KEY = "equities-sleeve-layout-v1";

export function EquitiesSleeveGrid({ widgets }: EquitiesSleeveGridProps) {
  return (
    <SleeveGrid
      storageKey={STORAGE_KEY}
      widgets={widgets}
      gridClassName="lg:grid-cols-2 xl:grid-cols-3"
      orderAttribute="data-equities-order"
    />
  );
}
