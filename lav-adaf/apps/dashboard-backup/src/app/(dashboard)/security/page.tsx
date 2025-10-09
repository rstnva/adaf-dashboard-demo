/**
 * 🎯 SECURITY MONITORING PAGE
 * 
 * This page showcases the complete enterprise security infrastructure.
 * Demonstrates advanced threat detection, ML-based analysis, and automated response.
 */

import { SecurityCommandDashboard } from '@/components/security/SecurityMonitoringDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security Command Center | ADAF Dashboard',
  description: 'Enterprise-grade security monitoring with ML threat detection and automated response',
};

export default function SecurityMonitoringPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SecurityCommandDashboard />
    </div>
  );
}