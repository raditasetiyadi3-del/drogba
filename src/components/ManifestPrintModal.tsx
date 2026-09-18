import React, { useState } from 'react';
import { Ship, CargoItem, PassengerItem } from '../types';
import { Printer, Ship as ShipIcon, X, FileText, CheckCircle2 } from 'lucide-react';

interface ManifestPrintModalProps {
  ships: Ship[];
  cargos: CargoItem[];
  passengers: PassengerItem[];
  selectedShipId: string;
  onClose: () => void;
}

export const ManifestPrintModal: React.FC<ManifestPrintModalProps> = ({
  ships,
  cargos,
  passengers,
  selectedShipId,
  onClose,
}) => {
  const [activeShipId, setActiveShipId] = useState<string>(
    selectedShipId !== 'ALL' && selectedShipId ? selectedShipId : (ships[0]?.id || '')
  );

  const currentShip = ships.find(s => s.id === activeShipId) || ships[0];

  const shipCargos = cargos.filter(c => c.shipId === activeShipId);
  const shipPassengers = passengers.filter(p => p.shipId === activeShipId && p.status !== 'Batal');

  const totalCargoTon = shipCargos.reduce((sum, c) => sum + c.weightTon, 0);
  const totalBaggageKg = shipPassengers.reduce((sum, p) => sum + p.baggageKg, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="manifest-print-view"
      className="space-y-6"
    >
      {/* Control bar (hidden during print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-700">Pilih Dokumen Kapal:</span>
          <select
            value={activeShipId}
            onChange={(e) => setActiveShipId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none"
          >
            {ships.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.callSign}) - {s.route}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            id="btn-trigger-print"
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF Manifest</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200/90 shadow-sm print:border-none print:shadow-none print:p-0 max-w-5xl mx-auto text-slate-900">
        {/* Maritime Official Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
          <h2 className="text-xs font-bold tracking-widest uppercase text-slate-600">
            KEMENTERIAN PERHUBUNGAN REPUBLIK INDONESIA
          </h2>
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-slate-900 mt-0.5">
            DIREKTORAT JENDERAL PERHUBUNGAN LAUT
          </h1>
          <p className="text-xs font-medium text-slate-600">
            KANTOR KESYAHBANDARAN DAN OTORITAS PELABUHAN UTAMA
          </p>
          <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded text-xs font-bold text-slate-900 uppercase tracking-wider">
            SURAT MANIFES RESMI MUATAN & PENUMPANG KAPAL (CARGO & PASSENGER MANIFEST)
          </div>
        </div>

        {/* Vessel & Voyage Specifications */}
        {currentShip && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl text-xs mb-6 border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">Nama Kapal:</span>
              <strong className="text-slate-900 text-sm">{currentShip.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Call Sign / Tanda Selar:</span>
              <strong className="text-slate-900 font-mono">{currentShip.callSign}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Pelabuhan Asal & Tujuan:</span>
              <strong className="text-slate-900">{currentShip.route}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Nakhoda (Master):</span>
              <strong className="text-slate-900">{currentShip.captainName || 'Capt. On Board'}</strong>
            </div>
          </div>
        )}

        {/* SECTION A: CARGO MANIFEST */}
        <div className="mb-8">
          <div className="flex items-center justify-between pb-2 border-b border-slate-300 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <span>BAGIAN I: MANIFES MUATAN KARGO (CARGO MANIFEST)</span>
            </h3>
            <span className="text-xs text-slate-600 font-semibold">
              Total: {shipCargos.length} Lot • {totalCargoTon.toFixed(1)} Ton
            </span>
          </div>

          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th className="py-2 px-3 border-r border-slate-300">No. Manifest</th>
                <th className="py-2 px-3 border-r border-slate-300">Komoditas / Muatan</th>
                <th className="py-2 px-3 border-r border-slate-300">Jenis</th>
                <th className="py-2 px-3 border-r border-slate-300 text-right">Berat (Ton)</th>
                <th className="py-2 px-3 border-r border-slate-300">Pengirim (Shipper)</th>
                <th className="py-2 px-3 border-r border-slate-300">Penerima (Consignee)</th>
                <th className="py-2 px-3 border-r border-slate-300">Lokasi Palka</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {shipCargos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-slate-400 italic">
                    Nihil (Tidak ada muatan kargo pada pelayaran ini)
                  </td>
                </tr>
              ) : (
                shipCargos.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 px-3 font-mono border-r border-slate-200">{c.manifestNo}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-medium">{c.description}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600">{c.cargoType}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right font-bold">{c.weightTon}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{c.shipperName}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700">{c.consigneeName}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px]">{c.deckLocation}</td>
                    <td className="py-2 px-3 text-center font-medium text-[11px]">{c.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* SECTION B: PASSENGER MANIFEST */}
        <div className="mb-8">
          <div className="flex items-center justify-between pb-2 border-b border-slate-300 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              BAGIAN II: MANIFES DAFTAR PENUMPANG (PASSENGER MANIFEST)
            </h3>
            <span className="text-xs text-slate-600 font-semibold">
              Total: {shipPassengers.length} Jiwa • Bagasi: {totalBaggageKg} kg
            </span>
          </div>

          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
              <tr>
                <th className="py-2 px-3 border-r border-slate-300">No. Tiket</th>
                <th className="py-2 px-3 border-r border-slate-300">Nama Lengkap Penumpang</th>
                <th className="py-2 px-3 border-r border-slate-300">NIK / Paspor</th>
                <th className="py-2 px-3 border-r border-slate-300">L/P</th>
                <th className="py-2 px-3 border-r border-slate-300">Kategori</th>
                <th className="py-2 px-3 border-r border-slate-300">Kelas / Kabin</th>
                <th className="py-2 px-3 border-r border-slate-300">Tujuan</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {shipPassengers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-slate-400 italic">
                    Nihil (Tidak ada penumpang terdaftar)
                  </td>
                </tr>
              ) : (
                shipPassengers.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 px-3 font-mono border-r border-slate-200">{p.ticketNo}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">{p.fullName}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px]">{p.identityNo}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center">{p.gender === 'Laki-laki' ? 'L' : 'P'}</td>
                    <td className="py-2 px-3 border-r border-slate-200">{p.category}</td>
                    <td className="py-2 px-3 border-r border-slate-200">{p.ticketClass} - {p.seatOrCabin}</td>
                    <td className="py-2 px-3 border-r border-slate-200">{p.destPort.split(',')[0]}</td>
                    <td className="py-2 px-3 text-center font-medium text-[11px]">{p.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Official Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-8 mt-12 border-t border-slate-300 text-xs text-center">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-900 mt-1">Petugas Syahbandar Pelabuhan</p>
            <div className="h-20" />
            <p className="font-bold text-slate-900 underline">Ir. Budi Hartono, M.T.</p>
            <p className="text-[11px] text-slate-500 font-mono">NIP. 19780512 200212 1 004</p>
          </div>

          <div>
            <p className="text-slate-600">Dibuat dan Disahkan Oleh,</p>
            <p className="font-bold text-slate-900 mt-1">Nakhoda Kapal (Master of Vessel)</p>
            <div className="h-20" />
            <p className="font-bold text-slate-900 underline">{currentShip?.captainName || 'Capt. On Board'}</p>
            <p className="text-[11px] text-slate-500 font-mono">ID Master: {currentShip?.callSign}-MST</p>
          </div>
        </div>
      </div>
    </div>
  );
};
