"use client";
import { useEffect } from "react";

// Auto-recover from chunk load failures by reloading once with cache-busting.
// Guards against reload loops via sessionStorage.
export default function ChunkRecovery() {
  useEffect(() => {
    const key = "adaf:lastChunkRecovery";
    const minIntervalMs = 5000; // avoid rapid loops

    function shouldReload() {
      try {
        const last = sessionStorage.getItem(key);
        const lastMs = last ? Number(last) : 0;
        return Date.now() - lastMs > minIntervalMs;
      } catch {
        return true;
      }
    }

    function markReload() {
      try { sessionStorage.setItem(key, String(Date.now())); } catch {}
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = String((event.reason && event.reason.message) || event.reason || "");
      if (/Loading chunk .* failed|ChunkLoadError|import\(\) chunk loading/i.test(msg)) {
        if (shouldReload()) {
          markReload();
          // Bust caches with a search param to avoid stale SW/CDN entries
          const url = new URL(window.location.href);
          url.searchParams.set("_r", String(Date.now()));
          window.location.replace(url.toString());
        }
      }
    };

    const onResourceError = (event: Event) => {
      const target = event.target as HTMLScriptElement | null;
      const src = target && (target as any).src;
      if (src && /\/_next\/static\/chunks\//.test(src)) {
        if (shouldReload()) {
          markReload();
          const url = new URL(window.location.href);
          url.searchParams.set("_r", String(Date.now()));
          window.location.replace(url.toString());
        }
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onResourceError, true);
    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onResourceError, true);
    };
  }, []);

  return null;
}
