import React from 'react';
import { 
  Ship, 
  Boxes, 
  Users, 
  FileText, 
  LogOut, 
  Anchor, 
  Activity, 
  ShieldCheck, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { Ship as ShipType } from '../types';

interface NavbarProps {
  activeTab: 'overview' | 'cargo' | 'passenger' | 'ships' | 'manifest';
  setActiveTab: (tab: 'overview' | 'cargo' | 'passenger' | 'ships' | 'manifest') => void;
  selectedShipId: string;
  setSelectedShipId: (id: string) => void;
  ships: ShipType[];
  cargoCount: number;
  passengerCount: number;
  userEmail: string;
  userDisplayName: string;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedShipId,
  setSelectedShipId,
  ships,
  cargoCount,
  passengerCount,
  userEmail,
  userDisplayName,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  SIMUKAP
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Firestore Live
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Sistem Informasi Muatan & Penumpang Kapal
              </p>
            </div>
          </div>

          {/* Center Vessel Filter Switcher */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 pl-2 pr-1 flex items-center space-x-1">
              <Anchor className="w-3.5 h-3.5 text-sky-600" />
              <span>Pilih Kapal:</span>
            </span>
            <select
              id="global-vessel-select"
              value={selectedShipId}
              onChange={(e) => setSelectedShipId(e.target.value)}
              className="bg-white text-xs font-semibold text-slate-800 py-1.5 px-3 rounded-lg border-0 shadow-xs focus:ring-2 focus:ring-sky-500 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Armada Kapal ({ships.length})</option>
              {ships.map((ship) => (
                <option key={ship.id} value={ship.id}>
                  {ship.name} ({ship.route.split(' - ')[0]} → {ship.route.split(' - ').slice(-1)[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Right Admin Profile & Logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-900 leading-none">
                {userDisplayName || 'Petugas Admin'}
              </span>
              <span className="text-[11px] text-slate-500 truncate max-w-[150px] mt-0.5">
                {userEmail}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs border border-sky-200">
              {userDisplayName ? userDisplayName[0].toUpperCase() : 'A'}
            </div>

            <button
              id="btn-logout"
              type="button"
              onClick={onLogout}
              title="Keluar dari sesi admin"
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-slate-50/75 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          <button
            id="tab-overview"
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-sky-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Ringkasan & Kapasitas</span>
          </button>

          <button
            id="tab-cargo"
            type="button"
            onClick={() => setActiveTab('cargo')}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'cargo'
                ? 'bg-sky-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Muatan Kargo (CRUD)</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'cargo' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {cargoCount}
            </span>
          </button>

          <button
            id="tab-passenger"
            type="button"
            onClick={() => setActiveTab('passenger')}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'passenger'
                ? 'bg-sky-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Penumpang (CRUD)</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'passenger' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {passengerCount}
            </span>
          </button>

          <button
            id="tab-ships"
            type="button"
            onClick={() => setActiveTab('ships')}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'ships'
                ? 'bg-sky-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Ship className="w-4 h-4" />
            <span>Armada Kapal</span>
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'ships' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {ships.length}
            </span>
          </button>

          <button
            id="tab-manifest"
            type="button"
            onClick={() => setActiveTab('manifest')}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeTab === 'manifest'
                ? 'bg-sky-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Cetak Manifest Resmi</span>
          </button>
        </div>
      </div>
    </header>
  );
};
