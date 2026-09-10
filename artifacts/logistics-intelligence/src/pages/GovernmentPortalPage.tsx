import { useState } from 'react';
import {
  Shield,
  LayoutDashboard,
  Map as MapIcon,
  Package,
  Truck,
  AlertTriangle,
  Bell,
  LogOut,
  ArrowLeftRight,
} from 'lucide-react';
import { OverviewPage } from '@/pages/OverviewPage';
import { LiveMapPage } from '@/pages/LiveMapPage';
import { DeliveriesPage } from '@/pages/DeliveriesPage';
import { VehiclesPage } from '@/pages/VehiclesPage';
import { IncidentsPage } from '@/pages/IncidentsPage';
import { AlertsPage } from '@/pages/AlertsPage';
import {
  getActiveSessionAccount,
  setSessionAuthenticated,
  type UserAccount,
} from '@/services/authService';

interface GovernmentPortalPageProps {
  onSwitchToDriver: () => void;
  onLogout: () => void;
}

type GovTab = 'overview' | 'map' | 'deliveries' | 'vehicles' | 'incidents' | 'alerts';

export function GovernmentPortalPage({ onSwitchToDriver, onLogout }: GovernmentPortalPageProps) {
  const [activeTab, setActiveTab] = useState<GovTab>('overview');
  const sessionAccount: UserAccount | null = getActiveSessionAccount();

  function handleLogoutClick() {
    setSessionAuthenticated(false);
    onLogout();
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* Top Directorate Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/90 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-xs">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-950">
                  Logistics Intelligence Platform
                </span>
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  GOVERNMENT
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Authorized Monitoring Directorate •{' '}
                {sessionAccount?.fullName || 'Dr. S. Sharma'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-gov-switch-to-driver"
              onClick={onSwitchToDriver}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 active:scale-[0.98]"
              title="Switch to Driver Field User App view"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Switch to</span> VECTOR
            </button>

            <button
              type="button"
              id="btn-gov-logout"
              onClick={handleLogoutClick}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100 active:scale-[0.98]"
              title="End session and return to Login"
            >
              <LogOut className="h-3.5 w-3.5 text-red-600" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="mx-auto max-w-7xl overflow-x-auto border-t border-neutral-100 px-4 sm:px-6">
          <nav className="flex space-x-1 py-1.5" aria-label="Tabs">
            <button
              type="button"
              id="gov-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              id="gov-tab-map"
              onClick={() => setActiveTab('map')}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'map'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span>Live Map</span>
            </button>

            <button
              type="button"
              id="gov-tab-deliveries"
              onClick={() => setActiveTab('deliveries')}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'deliveries'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Deliveries</span>
            </button>

            <button
              type="button"
              id="gov-tab-vehicles"
              onClick={() => setActiveTab('vehicles')}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'vehicles'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Fleet Vehicles</span>
            </button>

            <button
              type="button"
              id="gov-tab-incidents"
              onClick={() => setActiveTab('incidents')}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'incidents'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Incidents</span>
            </button>

            <button
              type="button"
              id="gov-tab-alerts"
              onClick={() => setActiveTab('alerts')}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Alerts</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Tab Contents */}
      <main className="mx-auto max-w-7xl">
        {activeTab === 'overview' && <OverviewPage />}
        {activeTab === 'map' && <LiveMapPage />}
        {activeTab === 'deliveries' && <DeliveriesPage />}
        {activeTab === 'vehicles' && <VehiclesPage />}
        {activeTab === 'incidents' && <IncidentsPage />}
        {activeTab === 'alerts' && <AlertsPage />}
      </main>
    </div>
  );
}
