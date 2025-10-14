import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import QueryProvider from '@/components/providers/query-provider';
import { HotkeyProvider } from '@/components/providers/hotkey-provider';
import { SpotlightProvider } from '@/components/spotlight/Spotlight';
import { TopBar } from '@/components/layout/TopBar';
import { NavLeft } from '@/components/layout/NavLeft';
import { NavigationGuard } from '@/components/NavigationGuard';
import { PageGuide } from '@/components/learn/PageGuide';

const inter = Inter({ subsets: ['latin'] });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <HotkeyProvider context="global">
        <SpotlightProvider>
          <div
            className={cn(
              'relative flex min-h-screen overflow-hidden bg-transparent text-amber-100 antialiased',
              inter.className
            )}
          >
            <div className="vision-ambient" aria-hidden="true" />

            {/* Left Navigation */}
            <NavLeft />

            {/* Main Content Area */}
            <div className="relative flex flex-1 flex-col overflow-hidden">
              {/* Top Bar */}
              <TopBar />

              {/* Page Content */}
              <main className="relative flex-1 overflow-y-auto overflow-x-hidden">
                <div className="vision-page">
                  {/* Contextual novice guide */}
                  <PageGuide className="print:hidden" />
                  <NavigationGuard>{children}</NavigationGuard>
                </div>
              </main>
            </div>
          </div>
        </SpotlightProvider>
      </HotkeyProvider>
    </QueryProvider>
  );
}
