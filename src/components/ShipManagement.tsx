import React, { useState } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Ship, CargoItem, PassengerItem, ShipStatus, ShipType } from '../types';
import { 
  Ship as ShipIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  Anchor, 
  Users, 
  Boxes, 
  Compass, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  MapPin,
  Calendar
} from 'lucide-react';

interface ShipManagementProps {
  ships: Ship[];
  cargos: CargoItem[];
  passengers: PassengerItem[];
  onToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

const SHIP_TYPES: ShipType[] = [
  'Kapal Penumpang & Kargo',
  'Kapal Roro / Feri',
  'Kapal Kontainer',
  'Kapal Kargo Curah'
];

const SHIP_STATUSES: ShipStatus[] = [
  'Sandar (Dermaga)',
  'Proses Muat / Bongkar',
  'Berlayar (At Sea)',
  'Perbaikan / Docking'
];

export const ShipManagement: React.FC<ShipManagementProps> = ({
  ships,
  cargos,
  passengers,
  onToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentShipId, setCurrentShipId] = useState<string | null>(null);
  const [shipToDelete, setShipToDelete] = useState<Ship | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    callSign: '',
    type: SHIP_TYPES[0] as ShipType,
    maxCargoTon: '500',
    maxPassenger: '1500',
    currentPort: 'Tanjung Priok, Jakarta',
    route: 'Tj. Priok - Surabaya - Makassar',
    status: SHIP_STATUSES[0] as ShipStatus,
    captainName: '',
    yearBuilt: '2005',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const openCreateModal = () => {
    setIsEditMode(false);
    setCurrentShipId(null);
    setErrors({});
    setFormData({
      name: '',
      callSign: 'PK-',
      type: 'Kapal Penumpang & Kargo',
      maxCargoTon: '500',
      maxPassenger: '1500',
      currentPort: 'Tanjung Priok, Jakarta',
      route: 'Tj. Priok - Surabaya - Makassar',
      status: 'Sandar (Dermaga)',
      captainName: 'Capt. Hendra Gunawan, M.Mar',
      yearBuilt: '2008',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ship: Ship) => {
    setIsEditMode(true);
    setCurrentShipId(ship.id);
    setErrors({});
    setFormData({
      name: ship.name,
      callSign: ship.callSign,
      type: ship.type,
      maxCargoTon: ship.maxCargoTon.toString(),
      maxPassenger: ship.maxPassenger.toString(),
      currentPort: ship.currentPort,
      route: ship.route,
      status: ship.status,
      captainName: ship.captainName || '',
      yearBuilt: (ship.yearBuilt || 2000).toString(),
    });
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Nama kapal wajib diisi';
    if (!formData.callSign.trim()) errs.callSign = 'Call sign kapal wajib diisi';

    const cargoCap = parseFloat(formData.maxCargoTon);
    if (!formData.maxCargoTon || isNaN(cargoCap) || cargoCap < 0) {
      errs.maxCargoTon = 'Kapasitas muatan (Ton) harus angka valid';
    }

    const paxCap = parseInt(formData.maxPassenger, 10);
    if (!formData.maxPassenger || isNaN(paxCap) || paxCap < 0) {
      errs.maxPassenger = 'Kapasitas penumpang harus angka valid';
    }

    if (!formData.currentPort.trim()) errs.currentPort = 'Pelabuhan saat ini wajib diisi';
    if (!formData.route.trim()) errs.route = 'Rute pelayaran wajib diisi';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      onToast('error', 'Validasi Gagal', 'Harap periksa kolom yang ditandai merah');
      return;
    }

    setIsSubmitting(true);
    const shipPayload: Omit<Ship, 'id'> = {
      name: formData.name.trim(),
      callSign: formData.callSign.trim(),
      type: formData.type,
      maxCargoTon: parseFloat(formData.maxCargoTon),
      maxPassenger: parseInt(formData.maxPassenger, 10),
      currentPort: formData.currentPort.trim(),
      route: formData.route.trim(),
      status: formData.status,
      captainName: formData.captainName.trim(),
      yearBuilt: parseInt(formData.yearBuilt, 10) || 2000,
      createdAt: isEditMode ? (ships.find(s => s.id === currentShipId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isEditMode && currentShipId) {
        const docRef = doc(db, 'ships', currentShipId);
        await updateDoc(docRef, shipPayload);
        onToast('success', 'Kapal Diperbarui', `Data armada ${formData.name} berhasil diupdate di Firestore`);
      } else {
        const shipsCol = collection(db, 'ships');
        const newDocRef = doc(shipsCol);
        await setDoc(newDocRef, {
          ...shipPayload,
          id: newDocRef.id,
        });
        onToast('success', 'Kapal Ditambahkan', `Armada baru ${formData.name} berhasil disimpan di database`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save ship error:', err);
      onToast('error', 'Gagal Menyimpan Kapal', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShip = async () => {
    if (!shipToDelete) return;

    // Safety check: verify if any cargos or passengers are linked
    const linkedCargoCount = cargos.filter(c => c.shipId === shipToDelete.id).length;
    const linkedPaxCount = passengers.filter(p => p.shipId === shipToDelete.id).length;

    if (linkedCargoCount > 0 || linkedPaxCount > 0) {
      onToast(
        'warning', 
        'Tidak Dapat Menghapus Kapal', 
        `Kapal ini masih memiliki ${linkedCargoCount} muatan dan ${linkedPaxCount} penumpang terdaftar. Hapus data muatan/penumpang terlebih dahulu.`
      );
      setShipToDelete(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'ships', shipToDelete.id);
      await deleteDoc(docRef);
      onToast('success', 'Kapal Dihapus', `Armada ${shipToDelete.name} telah dihapus dari database`);
      setShipToDelete(null);
    } catch (err: any) {
      console.error('Delete ship error:', err);
      onToast('error', 'Gagal Menghapus Kapal', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="ship-management-page" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <ShipIcon className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Manajemen Armada Kapal & Kapasitas
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data spesifikasi kapal, daya tampung tonase kargo, kuota penumpang, dan status pelayaran saat ini.
          </p>
        </div>

        <button
          id="btn-add-ship"
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kapal Baru</span>
        </button>
      </div>

      {/* Ships Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ships.map((ship) => {
          const shipCargos = cargos.filter(c => c.shipId === ship.id);
          const shipPax = passengers.filter(p => p.shipId === ship.id && p.status !== 'Batal');

          const currentCargoTon = shipCargos.reduce((sum, c) => sum + c.weightTon, 0);
          const currentPaxCount = shipPax.length;

          const cargoPercentage = ship.maxCargoTon > 0 
            ? Math.min(100, (currentCargoTon / ship.maxCargoTon) * 100) 
            : 0;
          const paxPercentage = ship.maxPassenger > 0 
            ? Math.min(100, (currentPaxCount / ship.maxPassenger) * 100) 
            : 0;

          let statusBadge = 'bg-slate-100 text-slate-700';
          if (ship.status === 'Berlayar (At Sea)') statusBadge = 'bg-sky-50 text-sky-700 border border-sky-200';
          if (ship.status === 'Proses Muat / Bongkar') statusBadge = 'bg-amber-50 text-amber-700 border border-amber-200';
          if (ship.status === 'Sandar (Dermaga)') statusBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';

          return (
            <div 
              key={ship.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">{ship.name}</h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {ship.callSign}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{ship.type}</p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge}`}>
                    {ship.status}
                  </span>
                  <button
                    onClick={() => openEditModal(ship)}
                    className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer"
                    title="Ubah data kapal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShipToDelete(ship)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    title="Hapus kapal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Route & Port */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>Pelabuhan Saat Ini: <strong className="text-slate-800">{ship.currentPort}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Rute Trayek: <strong className="text-slate-800">{ship.route}</strong></span>
                </div>
                {ship.captainName && (
                  <div className="text-[11px] text-slate-500 pt-0.5">
                    Nakhoda: <span className="text-slate-700 font-medium">{ship.captainName}</span>
                  </div>
                )}
              </div>

              {/* Real-time Capacity Progress Bars */}
              <div className="mt-5 space-y-3.5">
                {/* Cargo Capacity Meter */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 flex items-center space-x-1">
                      <Boxes className="w-3.5 h-3.5 text-sky-600" />
                      <span>Kapasitas Muatan Kargo</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {currentCargoTon.toFixed(1)} / {ship.maxCargoTon} Ton ({cargoPercentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        cargoPercentage > 90 ? 'bg-rose-500' : cargoPercentage > 70 ? 'bg-amber-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${cargoPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Passenger Capacity Meter (if ship carries passengers) */}
                {ship.maxPassenger > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kapasitas Penumpang</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {currentPaxCount} / {ship.maxPassenger} Orang ({paxPercentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          paxPercentage > 90 ? 'bg-rose-500' : paxPercentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${paxPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT SHIP MODAL */}
      {isModalOpen && (
        <div 
          id="modal-ship-form"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <ShipIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditMode ? 'Edit Data Armada Kapal' : 'Tambah Armada Kapal Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Spesifikasi tonase maksimum dan kapasitas penumpang.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kapal</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: KM Kelud"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.name ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.name && <p className="text-[11px] text-rose-600 mt-0.5">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Call Sign</label>
                  <input
                    type="text"
                    value={formData.callSign}
                    onChange={(e) => setFormData({ ...formData, callSign: e.target.value })}
                    placeholder="PK-KLD"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kapal</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ShipType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {SHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Kapal</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ShipStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {SHIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Muatan (Ton)</label>
                  <input
                    type="number"
                    value={formData.maxCargoTon}
                    onChange={(e) => setFormData({ ...formData, maxCargoTon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  {errors.maxCargoTon && <p className="text-[11px] text-rose-600 mt-0.5">{errors.maxCargoTon}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Penumpang</label>
                  <input
                    type="number"
                    value={formData.maxPassenger}
                    onChange={(e) => setFormData({ ...formData, maxPassenger: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  {errors.maxPassenger && <p className="text-[11px] text-rose-600 mt-0.5">{errors.maxPassenger}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pelabuhan Sandar Saat Ini</label>
                <input
                  type="text"
                  value={formData.currentPort}
                  onChange={(e) => setFormData({ ...formData, currentPort: e.target.value })}
                  placeholder="Tanjung Priok, Jakarta"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rute / Trayek Pelayaran</label>
                <input
                  type="text"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                  placeholder="Tj. Priok - Batu Ampar - Belawan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Nakhoda</label>
                  <input
                    type="text"
                    value={formData.captainName}
                    onChange={(e) => setFormData({ ...formData, captainName: e.target.value })}
                    placeholder="Capt. Hendra Gunawan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Pembuatan</label>
                  <input
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-ship"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Menyimpan...' : isEditMode ? 'Perbarui Kapal' : 'Simpan Kapal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE SHIP CONFIRM MODAL */}
      {shipToDelete && (
        <div 
          id="modal-delete-ship"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-2.5 rounded-full bg-rose-50 border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Data Kapal
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus kapal <strong className="text-slate-900">{shipToDelete.name}</strong> ({shipToDelete.callSign}) dari daftar armada pelabuhan?
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShipToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-ship"
                type="button"
                onClick={handleDeleteShip}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                Hapus Armada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
