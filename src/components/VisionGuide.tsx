"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, X, ChevronRight } from "lucide-react";

type VisionGuideAction =
  | { type: "link"; label: string; href: string }
  | { type: "button"; label: string; onClick: () => void };

export interface VisionGuideItem {
  title: string;
  description: string;
  action?: VisionGuideAction;
  icon?: React.ReactNode;
}

interface VisionGuideProps {
  title?: string;
  subtitle?: string;
  items: VisionGuideItem[];
}

export function VisionGuide({
  title = "Guía rápida",
  subtitle = "Accesos inmediatos para esta vista",
  items,
}: VisionGuideProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[60]">
      <Button
        size="icon"
        className={cn(
          "h-12 w-12 rounded-full border border-amber-300/50 bg-gradient-to-br from-amber-500/90 to-yellow-300/90 text-zinc-900 shadow-[0_18px_45px_-20px_rgba(250,204,21,0.65)] hover:from-amber-400 hover:to-yellow-200",
          open && "scale-90 opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(true)}
        aria-label="Mostrar guía rápida"
      >
        <Sparkles className="h-5 w-5" />
      </Button>

      {open && (
        <div className="glass-panel w-80 rounded-3xl border border-amber-300/25 bg-zinc-950/75 px-5 py-6 text-amber-100 shadow-[0_35px_100px_-30px_rgba(15,23,42,0.95)]">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-200/60">
                {title}
              </p>
              <h4 className="mt-2 text-lg font-semibold text-amber-100">
                {subtitle}
              </h4>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-amber-200/60 hover:text-amber-100"
              onClick={() => setOpen(false)}
              aria-label="Cerrar guía"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="group flex items-start gap-3 rounded-2xl border border-amber-200/20 bg-black/45 px-4 py-3 transition-all duration-200 hover:border-amber-200/35 hover:bg-amber-500/10"
              >
                <div className="mt-1 text-amber-200/70">
                  {item.icon ?? <Sparkles className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>{item.title}</span>
                    {item.action && <ActionPill action={item.action} />}
                  </div>
                  <p className="mt-1 text-xs text-amber-100/70">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionPill({ action }: { action: VisionGuideAction }) {
  if (action.type === "link") {
    return (
      <Link
        href={action.href}
        className="inline-flex items-center gap-1 rounded-full border border-amber-200/40 bg-amber-500/20 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-amber-100/90 transition hover:bg-amber-500/30"
      >
        {action.label}
        <ChevronRight className="h-3 w-3" />
      </Link>
    );
  }

  return (
    <button
      onClick={action.onClick}
      className="inline-flex items-center gap-1 rounded-full border border-amber-200/40 bg-amber-500/20 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-amber-100/90 transition hover:bg-amber-500/30"
    >
      {action.label}
      <ChevronRight className="h-3 w-3" />
    </button>
  );
}
