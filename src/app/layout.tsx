import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { RBACProvider } from "@/contexts/RBACContext";
import { Toaster } from "@/components/ui/toaster";
import ChunkRecovery from "@/components/ChunkRecovery";
import SystemHealthMonitor from "@/components/SystemHealthMonitor";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ADAF Dashboard Pro",
  description: "Advanced Algorithmic Digital Asset Framework - Professional Trading Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <body
        className={cn(
          inter.className,
          "relative min-h-screen overflow-x-hidden bg-transparent text-slate-100 antialiased"
        )}
      >
        <div className="pointer-events-none fixed inset-0 z-[-1] select-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.25),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.2),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.18),transparent_60%)]" />
        </div>
        <RBACProvider permissions={["feature:wsp"]}>
          <ChunkRecovery />
          <Providers>
            {/* <SystemHealthMonitor /> */}
            {children}
          </Providers>
          <Toaster />
        </RBACProvider>
      </body>
    </html>
  );
}
