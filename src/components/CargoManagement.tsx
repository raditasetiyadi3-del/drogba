import React, { useState, useMemo } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { CargoItem, Ship, CargoType, HazardLevel, CargoStatus } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Boxes, 
  Ship as ShipIcon, 
  CheckCircle2, 
  X, 
  Info, 
  ArrowUpDown,
  Phone,
  Calendar,
  Layers,
  DollarSign
} from 'lucide-react';

interface CargoManagementProps {
  cargos: CargoItem[];
  ships: Ship[];
  selectedShipId: string;
  onToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

const CARGO_TYPES: CargoType[] = [
  'Kontainer (FCL/LCL)',
  'Curah Kering',
  'Curah Cair',
  'Kendaraan & Alat Berat',
  'General Cargo / Sembako'
];

const HAZARD_LEVELS: HazardLevel[] = [
  'Non-B3',
  'B3 Kelas 3 (Flammable)',
  'B3 Kelas 8 (Corrosive)',
  'Reefer / Berpendingin'
];

const CARGO_STATUSES: CargoStatus[] = [
  'Terdaftar (Draft)',
  'Pemuatan (Loading)',
  'Onboard (Berlayar)',
  'Tiba di Pelabuhan',
  'Selesai Bongkar'
];

const COMMON_PORTS = [
  'Tanjung Priok, Jakarta',
  'Tanjung Perak, Surabaya',
  'Belawan, Medan',
  'Batu Ampar, Batam',
  'Soekarno-Hatta, Makassar',
  'Samudera, Bitung',
  'Dwikora, Pontianak',
  'Trisakti, Banjarmasin',
  'Semayang, Balikpapan',
  'Yos Sudarso, Ambon',
  'Jayapura, Papua'
];

export const CargoManagement: React.FC<CargoManagementProps> = ({
  cargos,
  ships,
  selectedShipId,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterHazard, setFilterHazard] = useState<string>('ALL');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCargoId, setCurrentCargoId] = useState<string | null>(null);

  // Delete modal state
  const [cargoToDelete, setCargoToDelete] = useState<CargoItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    manifestNo: '',
    shipId: ships[0]?.id || '',
    cargoType: CARGO_TYPES[0] as CargoType,
    description: '',
    weightTon: '',
    volumeM3: '',
    shipperName: '',
    shipperPhone: '',
    consigneeName: '',
    consigneePhone: '',
    originPort: COMMON_PORTS[0],
    destPort: COMMON_PORTS[1],
    loadingDate: new Date().toISOString().split('T')[0],
    hazardLevel: HAZARD_LEVELS[0] as HazardLevel,
    deckLocation: 'Palka 1 - Lantai Dasar',
    status: CARGO_STATUSES[0] as CargoStatus,
    shippingFee: '',
    notes: '',
  });

  // Strict Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filtered Cargos
  const filteredCargos = useMemo(() => {
    return cargos.filter((item) => {
      // Ship filter
      if (selectedShipId !== 'ALL' && item.shipId !== selectedShipId) {
        return false;
      }
      // Cargo Type filter
      if (filterType !== 'ALL' && item.cargoType !== filterType) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'ALL' && item.status !== filterStatus) {
        return false;
      }
      // Hazard filter
      if (filterHazard !== 'ALL' && item.hazardLevel !== filterHazard) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchManifest = item.manifestNo.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchShipper = item.shipperName.toLowerCase().includes(query);
        const matchConsignee = item.consigneeName.toLowerCase().includes(query);
        const matchShip = item.shipName.toLowerCase().includes(query);
        return matchManifest || matchDesc || matchShipper || matchConsignee || matchShip;
      }
      return true;
    });
  }, [cargos, selectedShipId, filterType, filterStatus, filterHazard, searchTerm]);

  // Aggregate stats
  const totalWeight = useMemo(() => {
    return filteredCargos.reduce((acc, c) => acc + (c.weightTon || 0), 0);
  }, [filteredCargos]);

  const totalRevenue = useMemo(() => {
    return filteredCargos.reduce((acc, c) => acc + (c.shippingFee || 0), 0);
  }, [filteredCargos]);

  // Generate Unique Manifest No
  const generateManifestNo = () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(2, 7).replace('-', '');
    return `MNF-CG-${dateStr}-${randomCode}`;
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setCurrentCargoId(null);
    setErrors({});
    const defaultShip = selectedShipId !== 'ALL' 
      ? ships.find(s => s.id === selectedShipId) || ships[0]
      : ships[0];

    setFormData({
      manifestNo: generateManifestNo(),
      shipId: defaultShip?.id || '',
      cargoType: 'General Cargo / Sembako',
      description: '',
      weightTon: '',
      volumeM3: '',
      shipperName: '',
      shipperPhone: '',
      consigneeName: '',
      consigneePhone: '',
      originPort: defaultShip?.route ? defaultShip.route.split(' - ')[0] : COMMON_PORTS[0],
      destPort: defaultShip?.route ? defaultShip.route.split(' - ').slice(-1)[0] : COMMON_PORTS[1],
      loadingDate: new Date().toISOString().split('T')[0],
      hazardLevel: 'Non-B3',
      deckLocation: 'Palka 1 - Lantai Dasar',
      status: 'Terdaftar (Draft)',
      shippingFee: '',
      notes: '',
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (cargo: CargoItem) => {
    setIsEditMode(true);
    setCurrentCargoId(cargo.id);
    setErrors({});
    setFormData({
      manifestNo: cargo.manifestNo,
      shipId: cargo.shipId,
      cargoType: cargo.cargoType,
      description: cargo.description,
      weightTon: cargo.weightTon.toString(),
      volumeM3: cargo.volumeM3.toString(),
      shipperName: cargo.shipperName,
      shipperPhone: cargo.shipperPhone,
      consigneeName: cargo.consigneeName,
      consigneePhone: cargo.consigneePhone,
      originPort: cargo.originPort,
      destPort: cargo.destPort,
      loadingDate: cargo.loadingDate,
      hazardLevel: cargo.hazardLevel,
      deckLocation: cargo.deckLocation,
      status: cargo.status,
      shippingFee: cargo.shippingFee.toString(),
      notes: cargo.notes || '',
    });
    setIsFormModalOpen(true);
  };

  // Strict Validation Function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Manifest Number
    if (!formData.manifestNo.trim()) {
      newErrors.manifestNo = 'Nomor Manifest wajib diisi';
    }

    // 2. Ship Selection
    if (!formData.shipId) {
      newErrors.shipId = 'Pilih kapal pengangkut';
    }

    // 3. Description
    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi muatan / komoditas wajib diisi';
    } else if (formData.description.trim().length < 4) {
      newErrors.description = 'Deskripsi minimal 4 karakter lengkap';
    }

    // 4. Weight Ton (Strict positive number)
    const weightVal = parseFloat(formData.weightTon);
    if (!formData.weightTon || isNaN(weightVal)) {
      newErrors.weightTon = 'Berat muatan harus berupa angka numerik';
    } else if (weightVal <= 0) {
      newErrors.weightTon = 'Berat muatan harus lebih besar dari 0 Ton';
    } else {
      // Check ship max cargo capacity
      const targetShip = ships.find(s => s.id === formData.shipId);
      if (targetShip) {
        const currentShipCargoTon = cargos
          .filter(c => c.shipId === targetShip.id && c.id !== currentCargoId)
          .reduce((sum, c) => sum + c.weightTon, 0);

        if (currentShipCargoTon + weightVal > targetShip.maxCargoTon) {
          newErrors.weightTon = `Melebihi sisa kapasitas kapal! (Sisa: ${(targetShip.maxCargoTon - currentShipCargoTon).toFixed(1)} Ton dari Max ${targetShip.maxCargoTon} Ton)`;
        }
      }
    }

    // 5. Volume M3
    const volVal = parseFloat(formData.volumeM3);
    if (!formData.volumeM3 || isNaN(volVal)) {
      newErrors.volumeM3 = 'Volume kubikasi harus berupa angka';
    } else if (volVal <= 0) {
      newErrors.volumeM3 = 'Volume harus lebih besar dari 0 m³';
    }

    // 6. Shipper
    if (!formData.shipperName.trim()) {
      newErrors.shipperName = 'Nama pengirim wajib diisi';
    }
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
    if (!formData.shipperPhone.trim()) {
      newErrors.shipperPhone = 'Nomor kontak pengirim wajib diisi';
    } else if (!phoneRegex.test(formData.shipperPhone.replace(/[-\s]/g, ''))) {
      newErrors.shipperPhone = 'Format nomor telepon tidak valid (contoh: 081234567890)';
    }

    // 7. Consignee
    if (!formData.consigneeName.trim()) {
      newErrors.consigneeName = 'Nama penerima barang wajib diisi';
    }
    if (!formData.consigneePhone.trim()) {
      newErrors.consigneePhone = 'Nomor kontak penerima wajib diisi';
    } else if (!phoneRegex.test(formData.consigneePhone.replace(/[-\s]/g, ''))) {
      newErrors.consigneePhone = 'Format nomor telepon penerima tidak valid';
    }

    // 8. Port Validation (Origin != Destination)
    if (!formData.originPort.trim()) {
      newErrors.originPort = 'Pelabuhan asal wajib dipilih';
    }
    if (!formData.destPort.trim()) {
      newErrors.destPort = 'Pelabuhan tujuan wajib dipilih';
    }
    if (formData.originPort.trim() === formData.destPort.trim()) {
      newErrors.destPort = 'Pelabuhan tujuan tidak boleh sama dengan pelabuhan asal!';
    }

    // 9. Loading Date
    if (!formData.loadingDate) {
      newErrors.loadingDate = 'Tanggal pemuatan wajib diisi';
    }

    // 10. Shipping Fee (Optional but must be valid non-negative if entered)
    if (formData.shippingFee) {
      const feeVal = parseFloat(formData.shippingFee);
      if (isNaN(feeVal) || feeVal < 0) {
        newErrors.shippingFee = 'Biaya angkut tidak boleh negatif';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler (Create or Update in real Firestore)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      onToast('error', 'Validasi Gagal', 'Harap lengkapi semua kolom dengan data yang valid');
      return;
    }

    setIsSubmitting(true);
    const shipObj = ships.find(s => s.id === formData.shipId);
    const shipName = shipObj ? shipObj.name : 'Kapal Tidak Ditemukan';

    const cargoPayload: Omit<CargoItem, 'id'> = {
      manifestNo: formData.manifestNo.trim(),
      shipId: formData.shipId,
      shipName: shipName,
      cargoType: formData.cargoType,
      description: formData.description.trim(),
      weightTon: parseFloat(formData.weightTon),
      volumeM3: parseFloat(formData.volumeM3),
      shipperName: formData.shipperName.trim(),
      shipperPhone: formData.shipperPhone.trim(),
      consigneeName: formData.consigneeName.trim(),
      consigneePhone: formData.consigneePhone.trim(),
      originPort: formData.originPort,
      destPort: formData.destPort,
      loadingDate: formData.loadingDate,
      hazardLevel: formData.hazardLevel,
      deckLocation: formData.deckLocation.trim(),
      status: formData.status,
      shippingFee: formData.shippingFee ? parseFloat(formData.shippingFee) : 0,
      notes: formData.notes.trim(),
      createdAt: isEditMode ? (cargos.find(c => c.id === currentCargoId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isEditMode && currentCargoId) {
        // Update in Firestore
        const docRef = doc(db, 'cargos', currentCargoId);
        await updateDoc(docRef, cargoPayload);
        onToast('success', 'Muatan Diperbarui', `Manifest ${formData.manifestNo} berhasil diupdate di Firestore`);
      } else {
        // Create in Firestore
        const cargoCol = collection(db, 'cargos');
        const newDocRef = doc(cargoCol);
        await setDoc(newDocRef, {
          ...cargoPayload,
          id: newDocRef.id,
        });
        onToast('success', 'Muatan Berhasil Didaftarkan', `Manifest ${formData.manifestNo} tersimpan persisten di database`);
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error('Save cargo error:', err);
      onToast('error', 'Gagal Menyimpan Data', err.message || 'Terjadi kesalahan saat menyimpan ke Firestore');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler (Real delete in Firestore)
  const handleDeleteConfirm = async () => {
    if (!cargoToDelete) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'cargos', cargoToDelete.id);
      await deleteDoc(docRef);
      onToast('success', 'Data Muatan Dihapus', `Manifest ${cargoToDelete.manifestNo} telah dihapus dari database`);
      setCargoToDelete(null);
    } catch (err: any) {
      console.error('Delete cargo error:', err);
      onToast('error', 'Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="cargo-management-page" className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                <Boxes className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Manajemen Muatan Kapal (Cargo Manifest)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pencatatan manifes kontainer, curah, kendaraan, dan logistik terintegrasi dengan Firebase Firestore.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="btn-add-cargo"
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Muatan Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Total Muatan Terdata</span>
            <span className="text-lg font-bold text-slate-900">{filteredCargos.length} Manifest</span>
          </div>
          <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100">
            <span className="text-[11px] font-medium text-sky-700 block">Total Bobot (Ton)</span>
            <span className="text-lg font-bold text-sky-950">{totalWeight.toFixed(1)} Ton</span>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-700 block">Total Nilai Angkut</span>
            <span className="text-lg font-bold text-emerald-950">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
            <span className="text-[11px] font-medium text-amber-700 block">Muatan B3 / Khusus</span>
            <span className="text-lg font-bold text-amber-950">
              {filteredCargos.filter(c => c.hazardLevel !== 'Non-B3').length} Lot
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-cargo"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari manifest, barang, pengirim..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Cargo Type Filter */}
          <select
            id="filter-cargo-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 text-xs font-medium text-slate-700 py-2 px-3 rounded-lg border border-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Jenis Muatan</option>
            {CARGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Status Filter */}
          <select
            id="filter-cargo-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 text-xs font-medium text-slate-700 py-2 px-3 rounded-lg border border-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            {CARGO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Hazard Filter */}
          <select
            id="filter-cargo-hazard"
            value={filterHazard}
            onChange={(e) => setFilterHazard(e.target.value)}
            className="bg-slate-50 text-xs font-medium text-slate-700 py-2 px-3 rounded-lg border border-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Tingkat Bahaya</option>
            {HAZARD_LEVELS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {/* Cargo List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4">No. Manifest</th>
                <th className="py-3.5 px-4">Kapal & Rute</th>
                <th className="py-3.5 px-4">Komoditas & Jenis</th>
                <th className="py-3.5 px-4 text-right">Berat / Vol</th>
                <th className="py-3.5 px-4">Pengirim & Penerima</th>
                <th className="py-3.5 px-4">Palka / Dek</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCargos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-medium text-sm text-slate-600">Tidak ada data muatan ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Klik tombol "Tambah Muatan Baru" di atas untuk mendaftarkan manifes'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCargos.map((cargo) => {
                  let statusBadge = 'bg-slate-100 text-slate-700';
                  if (cargo.status === 'Pemuatan (Loading)') statusBadge = 'bg-sky-50 text-sky-700 border border-sky-200';
                  if (cargo.status === 'Onboard (Berlayar)') statusBadge = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
                  if (cargo.status === 'Tiba di Pelabuhan') statusBadge = 'bg-amber-50 text-amber-700 border border-amber-200';
                  if (cargo.status === 'Selesai Bongkar') statusBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';

                  const isHazard = cargo.hazardLevel !== 'Non-B3';

                  return (
                    <tr key={cargo.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Manifest & Date */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900">{cargo.manifestNo}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{cargo.loadingDate}</div>
                        {isHazard && (
                          <span className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {cargo.hazardLevel}
                          </span>
                        )}
                      </td>

                      {/* Ship & Route */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-sky-700 flex items-center space-x-1">
                          <ShipIcon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>{cargo.shipName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {cargo.originPort.split(',')[0]} → {cargo.destPort.split(',')[0]}
                        </div>
                      </td>

                      {/* Cargo Description & Type */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        <div className="font-medium text-slate-900 line-clamp-1">{cargo.description}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{cargo.cargoType}</div>
                      </td>

                      {/* Weight & Volume */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900">{cargo.weightTon.toLocaleString('id-ID')} Ton</div>
                        <div className="text-[11px] text-slate-500">{cargo.volumeM3} m³</div>
                      </td>

                      {/* Shipper & Consignee */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-slate-800 font-medium">Dari: {cargo.shipperName}</div>
                        <div className="text-slate-500 text-[11px]">Ke: {cargo.consigneeName}</div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
                          {cargo.deckLocation}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge}`}>
                          {cargo.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            id={`btn-edit-cargo-${cargo.id}`}
                            type="button"
                            onClick={() => openEditModal(cargo)}
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Ubah data muatan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-cargo-${cargo.id}`}
                            type="button"
                            onClick={() => setCargoToDelete(cargo)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus data muatan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT CARGO MODAL */}
      {isFormModalOpen && (
        <div 
          id="modal-cargo-form"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 p-6 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditMode ? 'Perbarui Data Muatan Kapal' : 'Formulir Pendaftaran Muatan Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pastikan seluruh data berat, pelabuhan, dan klasifikasi terisi akurat.
                  </p>
                </div>
              </div>
              <button
                id="btn-close-cargo-modal"
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4 max-h-[72vh] overflow-y-auto pr-1">
              {/* Row 1: Manifest No & Ship */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Manifest
                  </label>
                  <input
                    type="text"
                    value={formData.manifestNo}
                    onChange={(e) => setFormData({ ...formData, manifestNo: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.manifestNo ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.manifestNo && <p className="text-[11px] text-rose-600 mt-1">{errors.manifestNo}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapal Pengangkut
                  </label>
                  <select
                    value={formData.shipId}
                    onChange={(e) => setFormData({ ...formData, shipId: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.shipId ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  >
                    {ships.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Kapasitas: {s.maxCargoTon} Ton)
                      </option>
                    ))}
                  </select>
                  {errors.shipId && <p className="text-[11px] text-rose-600 mt-1">{errors.shipId}</p>}
                </div>
              </div>

              {/* Row 2: Cargo Type & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Muatan
                  </label>
                  <select
                    value={formData.cargoType}
                    onChange={(e) => setFormData({ ...formData, cargoType: e.target.value as CargoType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {CARGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi Barang / Komoditas
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Contoh: Beras Ramos 500 Karung Pallet"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.description ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.description && <p className="text-[11px] text-rose-600 mt-1">{errors.description}</p>}
                </div>
              </div>

              {/* Row 3: Weight & Volume & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berat Muatan (Ton)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weightTon}
                    onChange={(e) => setFormData({ ...formData, weightTon: e.target.value })}
                    placeholder="Contoh: 15.5"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.weightTon ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.weightTon && <p className="text-[11px] text-rose-600 mt-1 leading-tight">{errors.weightTon}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Volume Kubikasi (m³)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.volumeM3}
                    onChange={(e) => setFormData({ ...formData, volumeM3: e.target.value })}
                    placeholder="Contoh: 30"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.volumeM3 ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.volumeM3 && <p className="text-[11px] text-rose-600 mt-1">{errors.volumeM3}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Palka / Dek
                  </label>
                  <input
                    type="text"
                    value={formData.deckLocation}
                    onChange={(e) => setFormData({ ...formData, deckLocation: e.target.value })}
                    placeholder="Palka 1, Dek Kontainer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Row 4: Shipper & Consignee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                {/* Shipper */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                    Pihak Pengirim (Shipper)
                  </span>
                  <div>
                    <input
                      type="text"
                      value={formData.shipperName}
                      onChange={(e) => setFormData({ ...formData, shipperName: e.target.value })}
                      placeholder="Nama PT / Perorangan"
                      className={`w-full px-2.5 py-1.5 bg-white border rounded text-xs ${
                        errors.shipperName ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                    {errors.shipperName && <p className="text-[10px] text-rose-600 mt-0.5">{errors.shipperName}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.shipperPhone}
                      onChange={(e) => setFormData({ ...formData, shipperPhone: e.target.value })}
                      placeholder="Nomor Telp / WA (08xxx)"
                      className={`w-full px-2.5 py-1.5 bg-white border rounded text-xs ${
                        errors.shipperPhone ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                    {errors.shipperPhone && <p className="text-[10px] text-rose-600 mt-0.5">{errors.shipperPhone}</p>}
                  </div>
                </div>

                {/* Consignee */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                    Pihak Penerima (Consignee)
                  </span>
                  <div>
                    <input
                      type="text"
                      value={formData.consigneeName}
                      onChange={(e) => setFormData({ ...formData, consigneeName: e.target.value })}
                      placeholder="Nama PT / Penerima"
                      className={`w-full px-2.5 py-1.5 bg-white border rounded text-xs ${
                        errors.consigneeName ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                    {errors.consigneeName && <p className="text-[10px] text-rose-600 mt-0.5">{errors.consigneeName}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.consigneePhone}
                      onChange={(e) => setFormData({ ...formData, consigneePhone: e.target.value })}
                      placeholder="Nomor Telp / WA (08xxx)"
                      className={`w-full px-2.5 py-1.5 bg-white border rounded text-xs ${
                        errors.consigneePhone ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                    {errors.consigneePhone && <p className="text-[10px] text-rose-600 mt-0.5">{errors.consigneePhone}</p>}
                  </div>
                </div>
              </div>

              {/* Row 5: Ports (Origin & Destination) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pelabuhan Asal Pemuatan
                  </label>
                  <select
                    value={formData.originPort}
                    onChange={(e) => setFormData({ ...formData, originPort: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {COMMON_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pelabuhan Tujuan Bongkar
                  </label>
                  <select
                    value={formData.destPort}
                    onChange={(e) => setFormData({ ...formData, destPort: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.destPort ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  >
                    {COMMON_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.destPort && <p className="text-[11px] text-rose-600 mt-1">{errors.destPort}</p>}
                </div>
              </div>

              {/* Row 6: Hazard Level & Status & Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Bahaya (B3)
                  </label>
                  <select
                    value={formData.hazardLevel}
                    onChange={(e) => setFormData({ ...formData, hazardLevel: e.target.value as HazardLevel })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {HAZARD_LEVELS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Muatan
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CargoStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {CARGO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Biaya Angkut (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.shippingFee}
                    onChange={(e) => setFormData({ ...formData, shippingFee: e.target.value })}
                    placeholder="Contoh: 15000000"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.shippingFee ? 'border-rose-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.shippingFee && <p className="text-[11px] text-rose-600 mt-1">{errors.shippingFee}</p>}
                </div>
              </div>

              {/* Row 7: Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Khusus Palka / Handling Instruksi
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: Jangan ditumpuk lebih dari 3 tingkat, lindungi dari terpaan air laut"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-cargo"
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>{isEditMode ? 'Simpan Perubahan' : 'Daftarkan Muatan'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {cargoToDelete && (
        <div 
          id="modal-delete-cargo"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-2.5 rounded-full bg-rose-50 border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Hapus Muatan
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus manifest muatan <strong className="text-slate-900">{cargoToDelete.manifestNo}</strong> ({cargoToDelete.description})? Data akan dihapus secara permanen dari Firestore database.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600 mb-5 border border-slate-200">
              <div>Kapal: <strong className="text-slate-800">{cargoToDelete.shipName}</strong></div>
              <div>Berat: <strong className="text-slate-800">{cargoToDelete.weightTon} Ton</strong></div>
              <div>Rute: {cargoToDelete.originPort} → {cargoToDelete.destPort}</div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setCargoToDelete(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-cargo"
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
