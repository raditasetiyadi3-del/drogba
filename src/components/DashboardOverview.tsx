import React from 'react';
import { Ship, CargoItem, PassengerItem } from '../types';
import { 
  Boxes, 
  Users, 
  Ship as ShipIcon, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  Plus, 
  FileText, 
  Activity,
  Luggage,
  Calendar,
  CheckCircle2,
  Anchor
} from 'lucide-react';

interface DashboardOverviewProps {
  ships: Ship[];
  cargos: CargoItem[];
  passengers: PassengerItem[];
  selectedShipId: string;
  onNavigate: (tab: 'cargo' | 'passenger' | 'ships' | 'manifest') => void;
  onAddCargo: () => void;
  onAddPassenger: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  ships,
  cargos,
  passengers,
  selectedShipId,
  onNavigate,
  onAddCargo,
  onAddPassenger,
}) => {
  // Target ships for summary (either all or specific selected ship)
  const relevantShips = selectedShipId === 'ALL' 
    ? ships 
    : ships.filter(s => s.id === selectedShipId);

  const relevantCargos = selectedShipId === 'ALL' 
    ? cargos 
    : cargos.filter(c => c.shipId === selectedShipId);

  const relevantPassengers = selectedShipId === 'ALL' 
    ? passengers.filter(p => p.status !== 'Batal') 
    : passengers.filter(p => p.shipId === selectedShipId && p.status !== 'Batal');

  // Aggregations
  const totalCargoWeightTon = relevantCargos.reduce((sum, c) => sum + (c.weightTon || 0), 0);
  const totalShipMaxCargoTon = relevantShips.reduce((sum, s) => sum + (s.maxCargoTon || 0), 0);
  const totalPassengerCount = relevantPassengers.length;
  const totalShipMaxPax = relevantShips.reduce((sum, s) => sum + (s.maxPassenger || 0), 0);

  const cargoLoadPercentage = totalShipMaxCargoTon > 0 
    ? Math.min(100, (totalCargoWeightTon / totalShipMaxCargoTon) * 100) 
    : 0;

  const paxLoadPercentage = totalShipMaxPax > 0 
    ? Math.min(100, (totalPassengerCount / totalShipMaxPax) * 100) 
    : 0;

  const isCargoOverload = totalCargoWeightTon > totalShipMaxCargoTon && totalShipMaxCargoTon > 0;
  const isPaxOverload = totalPassengerCount > totalShipMaxPax && totalShipMaxPax > 0;

  return (
    <div id="dashboard-overview-page" className="space-y-6">
      {/* Welcome & Live Status Header */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg shadow-sky-900/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-sky-100 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistem Operasional Pelabuhan Aktif • Firestore Live</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              Pusat Kontrol Muatan & Manifest Penumpang
            </h1>
            <p className="text-xs sm:text-sm text-sky-100/80 mt-1 max-w-2xl">
              Memantau muatan kargo kapal secara real-time, manifest penumpang resmi, dan kalkulasi tonase keselamatan pelayaran Nusantara.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              id="dash-btn-add-cargo"
              type="button"
              onClick={onAddCargo}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white text-sky-900 hover:bg-sky-50 text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Boxes className="w-4 h-4 text-sky-600" />
              <span>+ Muatan Kargo</span>
            </button>
            <button
              id="dash-btn-add-pax"
              type="button"
              onClick={onAddPassenger}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-sky-600/60 hover:bg-sky-600 text-white border border-white/20 text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>+ Tiket Penumpang</span>
            </button>
            <button
              id="dash-btn-print-manifest"
              type="button"
              onClick={() => onNavigate('manifest')}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Cetak Manifest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overload Alert Warning (if triggered) */}
      {(isCargoOverload || isPaxOverload) && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-sm">Peringatan Keselamatan Maritim (Overcapacity)</h4>
            <p className="mt-0.5 text-rose-700">
              {isCargoOverload && `Total muatan kargo (${totalCargoWeightTon.toFixed(1)} Ton) telah melampaui kapasitas maksimum armada (${totalShipMaxCargoTon} Ton). `}
              {isPaxOverload && `Jumlah penumpang (${totalPassengerCount} Orang) telah melampaui kuota kapasitas maksimum kapal (${totalShipMaxPax} Kursi).`}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cargo Weight */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Muatan Kargo</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalCargoWeightTon.toFixed(1)} <span className="text-sm font-semibold text-slate-500">Ton</span>
            </span>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>{relevantCargos.length} Resi Manifest</span>
              <span className="font-bold text-sky-700">{cargoLoadPercentage.toFixed(0)}% Kapasitas</span>
            </div>
          </div>
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                cargoLoadPercentage > 90 ? 'bg-rose-500' : 'bg-sky-500'
              }`}
              style={{ width: `${cargoLoadPercentage}%` }}
            />
          </div>
        </div>

        {/* Total Passengers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Manifest Penumpang</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalPassengerCount} <span className="text-sm font-semibold text-slate-500">Jiwa</span>
            </span>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>
                {relevantPassengers.filter(p => p.status === 'Check-in' || p.status === 'Onboard').length} Sudah Check-in
              </span>
              <span className="font-bold text-emerald-700">{paxLoadPercentage.toFixed(0)}% Kuota</span>
            </div>
          </div>
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                paxLoadPercentage > 90 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${paxLoadPercentage}%` }}
            />
          </div>
        </div>

        {/* Armada Kapal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Armada Kapal Aktif</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ShipIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {relevantShips.length} <span className="text-sm font-semibold text-slate-500">Kapal</span>
            </span>
            <div className="mt-1 text-xs text-slate-500">
              {relevantShips.filter(s => s.status === 'Berlayar (At Sea)').length} Sedang Berlayar
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-indigo-700 font-medium flex items-center justify-between">
            <span>Daya Muat: {totalShipMaxCargoTon.toLocaleString('id-ID')} Ton</span>
            <span>{totalShipMaxPax.toLocaleString('id-ID')} Kursi</span>
          </div>
        </div>

        {/* Database Live Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sumber Tunggal Kebenaran</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-1.5">
              <span>Firebase Firestore</span>
            </span>
            <div className="mt-1 text-xs text-emerald-600 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Real-Time Cloud Persisten</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Tanpa localStorage • Siap Produksi
          </div>
        </div>
      </div>

      {/* Fleet Capacity Cards */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Monitoring Utilisasi Beban Tiap Kapal
            </h3>
            <p className="text-xs text-slate-500">
              Perbandingan beban muatan kargo dan kapasitas penumpang pada masing-masing kapal.
            </p>
          </div>
          <button
            onClick={() => onNavigate('ships')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>Kelola Armada</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relevantShips.map((ship) => {
            const shipCargoItems = cargos.filter(c => c.shipId === ship.id);
            const shipPaxItems = passengers.filter(p => p.shipId === ship.id && p.status !== 'Batal');

            const cargoTon = shipCargoItems.reduce((acc, c) => acc + c.weightTon, 0);
            const paxCount = shipPaxItems.length;

            const cargoPct = ship.maxCargoTon > 0 ? (cargoTon / ship.maxCargoTon) * 100 : 0;
            const paxPct = ship.maxPassenger > 0 ? (paxCount / ship.maxPassenger) * 100 : 0;

            return (
              <div 
                key={ship.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-sky-200 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{ship.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{ship.route}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    {ship.status}
                  </span>
                </div>

                {/* Cargo Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600">Muatan Kargo:</span>
                    <span className="font-bold text-slate-800">
                      {cargoTon.toFixed(1)} / {ship.maxCargoTon} Ton ({cargoPct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        cargoPct > 90 ? 'bg-rose-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${Math.min(100, cargoPct)}%` }}
                    />
                  </div>
                </div>

                {/* Passenger Bar */}
                {ship.maxPassenger > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600">Penumpang:</span>
                      <span className="font-bold text-slate-800">
                        {paxCount} / {ship.maxPassenger} Kursi ({paxPct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          paxPct > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, paxPct)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Manifests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Cargo Manifests */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Manifes Kargo Terbaru</h3>
            </div>
            <button
              onClick={() => onNavigate('cargo')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {relevantCargos.slice(0, 4).map(cargo => (
              <div key={cargo.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{cargo.manifestNo}</div>
                  <div className="text-[11px] text-slate-500">{cargo.description} ({cargo.shipName})</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{cargo.weightTon} Ton</div>
                  <div className="text-[10px] text-sky-600 font-medium">{cargo.status}</div>
                </div>
              </div>
            ))}
            {relevantCargos.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">Belum ada manifes kargo</p>
            )}
          </div>
        </div>

        {/* Latest Passenger Bookings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Manifest Penumpang Terakhir</h3>
            </div>
            <button
              onClick={() => onNavigate('passenger')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {relevantPassengers.slice(0, 4).map(pax => (
              <div key={pax.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{pax.fullName}</div>
                  <div className="text-[11px] text-slate-500">{pax.ticketNo} • {pax.shipName}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-800">{pax.ticketClass}</div>
                  <div className="text-[10px] font-bold text-emerald-600">{pax.status}</div>
                </div>
              </div>
            ))}
            {relevantPassengers.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">Belum ada manifes penumpang</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
