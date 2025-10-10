import { redirect } from 'next/navigation';

// Server component: redirect /dashboard to /dashboard/markets
export default function DashboardRedirectPage() {
  redirect('/dashboard/markets');
  // This will never render, but Next.js requires a return
  return null;
}