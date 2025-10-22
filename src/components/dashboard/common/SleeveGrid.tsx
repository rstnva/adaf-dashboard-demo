"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { normalizeStringOrder, readStringOrder, writeStringOrder } from "@/lib/layout/persistence";
import { cn } from "@/lib/utils";

type SortableItemProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
  dataKey?: string;
};

function SortableItem({ id, children, className, dataKey }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={className}
      data-widget-key={dataKey}
    >
      {children}
    </div>
  );
}

export type SleeveWidget = {
  key: string;
  component: React.ReactNode;
  className?: string;
};

export interface SleeveGridProps {
  storageKey: string;
  widgets: SleeveWidget[];
  gridClassName?: string;
  orderAttribute?: string;
}

export function SleeveGrid({ storageKey, widgets, gridClassName, orderAttribute }: SleeveGridProps) {
  const sensors = useSensors(useSensor(PointerSensor));
  const keys = useMemo(() => widgets.map((widget) => widget.key), [widgets]);
  const widgetMap = useMemo(() => new Map(widgets.map((widget) => [widget.key, widget])), [widgets]);

  const initialOrderRef = useRef<string[] | null>(null);
  if (!initialOrderRef.current) {
    const stored = readStringOrder(storageKey);
    initialOrderRef.current = stored ? normalizeStringOrder(keys, stored) : [...keys];
  }

  const [order, setOrder] = useState<string[]>(initialOrderRef.current ?? [...keys]);
  const items = useMemo(() => normalizeStringOrder(keys, order), [keys, order]);

  useEffect(() => {
    setOrder((previous) => {
      const normalized = normalizeStringOrder(keys, previous);
      const isSameLength = normalized.length === previous.length;
      const isSameOrder = isSameLength && normalized.every((key, index) => previous[index] === key);
      return isSameOrder ? previous : normalized;
    });
  }, [keys]);

  useEffect(() => {
    if (!items.length) return;
    writeStringOrder(storageKey, items);
  }, [items, storageKey]);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setOrder((previous) => {
        const current = normalizeStringOrder(keys, previous);
        const oldIndex = current.indexOf(String(active.id));
        const newIndex = current.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) {
          return current;
        }
        return arrayMove(current, oldIndex, newIndex);
      });
    },
    [keys]
  );

  const containerProps = orderAttribute ? { [orderAttribute]: items.join(",") } : {};

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div
          className={cn("grid gap-6 grid-cols-1", gridClassName)}
          {...containerProps}
        >
          {items.map((key) => {
            const widget = widgetMap.get(key);
            if (!widget) return null;
            return (
              <SortableItem key={key} id={key} className={widget.className} dataKey={key}>
                <div className="h-full">{widget.component}</div>
              </SortableItem>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
