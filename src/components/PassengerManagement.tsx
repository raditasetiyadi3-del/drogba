import React, { useState, useMemo } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  PassengerItem, 
  Ship, 
  PassengerGender, 
  PassengerCategory, 
  TicketClass, 
  TicketStatus 
} from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Ship as ShipIcon, 
  UserCheck, 
  Tag, 
  Phone, 
  Luggage,
  Calendar,
  CreditCard,
  UserX
} from 'lucide-react';

interface PassengerManagementProps {
  passengers: PassengerItem[];
  ships: Ship[];
  selectedShipId: string;
  onToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

const TICKET_CLASSES: TicketClass[] = [
  'Ekonomi',
  'Bisnis',
  'Kelas 1A (VIP)',
  'Kabin Keluarga'
];

const TICKET_STATUSES: TicketStatus[] = [
  'Terjadwal',
  'Check-in',
  'Onboard',
  'Selesai',
  'Batal'
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

export const PassengerManagement: React.FC<PassengerManagementProps> = ({
  passengers,
  ships,
  selectedShipId,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPassengerId, setCurrentPassengerId] = useState<string | null>(null);

  // Delete modal state
  const [passengerToDelete, setPassengerToDelete] = useState<PassengerItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    ticketNo: '',
    shipId: ships[0]?.id || '',
    fullName: '',
    identityNo: '',
    gender: 'Laki-laki' as PassengerGender,
    category: 'Dewasa' as PassengerCategory,
    phone: '',
    ticketClass: 'Ekonomi' as TicketClass,
    seatOrCabin: 'Dek 4 / Bed 101',
    originPort: COMMON_PORTS[0],
    destPort: COMMON_PORTS[1],
    departureDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
    baggageKg: '15',
    status: 'Terjadwal' as TicketStatus,
    ticketPrice: '450000',
    emergencyContact: '',
  });

  // Strict Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filtered Passengers
  const filteredPassengers = useMemo(() => {
    return passengers.filter((item) => {
      if (selectedShipId !== 'ALL' && item.shipId !== selectedShipId) {
        return false;
      }
      if (filterClass !== 'ALL' && item.ticketClass !== filterClass) {
        return false;
      }
      if (filterStatus !== 'ALL' && item.status !== filterStatus) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = item.fullName.toLowerCase().includes(query);
        const matchTicket = item.ticketNo.toLowerCase().includes(query);
        const matchNik = item.identityNo.toLowerCase().includes(query);
        const matchPhone = item.phone.toLowerCase().includes(query);
        const matchShip = item.shipName.toLowerCase().includes(query);
        return matchName || matchTicket || matchNik || matchPhone || matchShip;
      }
      return true;
    });
  }, [passengers, selectedShipId, filterClass, filterStatus, searchTerm]);

  // Aggregate stats
  const checkedInCount = useMemo(() => {
    return filteredPassengers.filter(p => p.status === 'Check-in' || p.status === 'Onboard').length;
  }, [filteredPassengers]);

  const totalTicketRevenue = useMemo(() => {
    return filteredPassengers
      .filter(p => p.status !== 'Batal')
      .reduce((sum, p) => sum + (p.ticketPrice || 0), 0);
  }, [filteredPassengers]);

  // Generate Unique Ticket No
  const generateTicketNo = () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const yearStr = new Date().getFullYear();
    return `TIK-${yearStr}-${randomCode}`;
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setCurrentPassengerId(null);
    setErrors({});
    const defaultShip = selectedShipId !== 'ALL' 
      ? ships.find(s => s.id === selectedShipId) || ships[0]
      : ships[0];

    setFormData({
      ticketNo: generateTicketNo(),
      shipId: defaultShip?.id || '',
      fullName: '',
      identityNo: '',
      gender: 'Laki-laki',
      category: 'Dewasa',
      phone: '',
      ticketClass: 'Ekonomi',
      seatOrCabin: 'Dek 4 / Bed ' + Math.floor(100 + Math.random() * 800),
      originPort: defaultShip?.route ? defaultShip.route.split(' - ')[0] : COMMON_PORTS[0],
      destPort: defaultShip?.route ? defaultShip.route.split(' - ').slice(-1)[0] : COMMON_PORTS[1],
      departureDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
      baggageKg: '15',
      status: 'Terjadwal',
      ticketPrice: '450000',
      emergencyContact: '',
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (pax: PassengerItem) => {
    setIsEditMode(true);
    setCurrentPassengerId(pax.id);
    setErrors({});
    setFormData({
      ticketNo: pax.ticketNo,
      shipId: pax.shipId,
      fullName: pax.fullName,
      identityNo: pax.identityNo,
      gender: pax.gender,
      category: pax.category,
      phone: pax.phone,
      ticketClass: pax.ticketClass,
      seatOrCabin: pax.seatOrCabin,
      originPort: pax.originPort,
      destPort: pax.destPort,
      departureDate: pax.departureDate,
      baggageKg: pax.baggageKg.toString(),
      status: pax.status,
      ticketPrice: pax.ticketPrice.toString(),
      emergencyContact: pax.emergencyContact || '',
    });
    setIsFormModalOpen(true);
  };

  // Quick Check-in Toggle directly in Firestore
  const handleQuickStatusChange = async (pax: PassengerItem, newStatus: TicketStatus) => {
    try {
      const docRef = doc(db, 'passengers', pax.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      onToast('success', 'Status Diperbarui', `Penumpang ${pax.fullName} kini berstatus: ${newStatus}`);
    } catch (err: any) {
      console.error('Update status error:', err);
      onToast('error', 'Gagal Update Status', err.message);
    }
  };

  // Strict Validation Function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Ticket Number
    if (!formData.ticketNo.trim()) {
      newErrors.ticketNo = 'Nomor tiket wajib diisi';
    }

    // 2. Full Name (Min 3 chars, Indonesian name standards)
    const cleanName = formData.fullName.trim();
    if (!cleanName) {
      newErrors.fullName = 'Nama lengkap penumpang wajib diisi sesuai KTP';
    } else if (cleanName.length < 3) {
      newErrors.fullName = 'Nama lengkap minimal 3 karakter';
    } else if (!/^[a-zA-Z\s.,'-]+$/.test(cleanName)) {
      newErrors.fullName = 'Nama hanya boleh mengandung huruf, spasi, titik, atau koma';
    }

    // 3. Identity Number (NIK 16 digit or Passport)
    const cleanNik = formData.identityNo.trim();
    if (!cleanNik) {
      newErrors.identityNo = 'Nomor Identitas (NIK KTP / Paspor) wajib diisi';
    } else {
      // If purely numeric, must be exactly 16 digits for Indonesian NIK
      if (/^\d+$/.test(cleanNik)) {
        if (cleanNik.length !== 16) {
          newErrors.identityNo = `NIK harus tepat 16 digit angka (Saat ini: ${cleanNik.length} digit)`;
        }
      } else {
        // Alphanumeric passport
        if (cleanNik.length < 7 || cleanNik.length > 10) {
          newErrors.identityNo = 'Nomor paspor tidak valid (7-10 karakter alfanumerik)';
        }
      }
    }

    // 4. Phone Number
    const cleanPhone = formData.phone.replace(/[-\s]/g, '');
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon / WhatsApp wajib diisi';
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = 'Nomor HP tidak valid (contoh: 081234567890)';
    }

    // 5. Seat or Cabin
    if (!formData.seatOrCabin.trim()) {
      newErrors.seatOrCabin = 'Nomor kabin / kasur wajib diisi';
    }

    // 6. Ports (Origin != Destination)
    if (!formData.originPort) {
      newErrors.originPort = 'Pelabuhan keberangkatan wajib dipilih';
    }
    if (!formData.destPort) {
      newErrors.destPort = 'Pelabuhan tujuan wajib dipilih';
    }
    if (formData.originPort === formData.destPort) {
      newErrors.destPort = 'Pelabuhan tujuan tidak boleh sama dengan pelabuhan asal!';
    }

    // 7. Departure Date
    if (!formData.departureDate) {
      newErrors.departureDate = 'Jadwal keberangkatan wajib diisi';
    }

    // 8. Baggage Weight (Must be non-negative number)
    const baggageVal = parseFloat(formData.baggageKg);
    if (!formData.baggageKg || isNaN(baggageVal) || baggageVal < 0) {
      newErrors.baggageKg = 'Berat bagasi harus berupa angka valid (minimal 0 kg)';
    } else if (baggageVal > 40) {
      newErrors.baggageKg = 'Maksimum bagasi penumpang per tiket adalah 40 kg';
    }

    // 9. Ticket Price
    const priceVal = parseFloat(formData.ticketPrice);
    if (!formData.ticketPrice || isNaN(priceVal) || priceVal < 0) {
      newErrors.ticketPrice = 'Tarif tiket harus berupa nominal angka valid';
    }

    // 10. Capacity check
    const targetShip = ships.find(s => s.id === formData.shipId);
    if (targetShip && targetShip.maxPassenger > 0) {
      const currentPaxCount = passengers.filter(
        p => p.shipId === targetShip.id && p.id !== currentPassengerId && p.status !== 'Batal'
      ).length;

      if (currentPaxCount >= targetShip.maxPassenger) {
        newErrors.shipId = `Kapasitas penumpang kapal ${targetShip.name} sudah penuh (${targetShip.maxPassenger} Pax)!`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler (Create or Update in real Firestore)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      onToast('error', 'Validasi Gagal', 'Periksa kembali data formulir penumpang yang bertanda merah');
      return;
    }

    setIsSubmitting(true);
    const shipObj = ships.find(s => s.id === formData.shipId);
    const shipName = shipObj ? shipObj.name : 'Kapal Tidak Ditemukan';

    const paxPayload: Omit<PassengerItem, 'id'> = {
      ticketNo: formData.ticketNo.trim(),
      shipId: formData.shipId,
      shipName: shipName,
      fullName: formData.fullName.trim(),
      identityNo: formData.identityNo.trim(),
      gender: formData.gender,
      category: formData.category,
      phone: formData.phone.trim(),
      ticketClass: formData.ticketClass,
      seatOrCabin: formData.seatOrCabin.trim(),
      originPort: formData.originPort,
      destPort: formData.destPort,
      departureDate: formData.departureDate,
      baggageKg: parseFloat(formData.baggageKg),
      status: formData.status,
      ticketPrice: parseFloat(formData.ticketPrice),
      emergencyContact: formData.emergencyContact.trim(),
      createdAt: isEditMode ? (passengers.find(p => p.id === currentPassengerId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isEditMode && currentPassengerId) {
        // Update document in Firestore
        const docRef = doc(db, 'passengers', currentPassengerId);
        await updateDoc(docRef, paxPayload);
        onToast('success', 'Data Penumpang Diperbarui', `Tiket ${formData.ticketNo} (${formData.fullName}) berhasil diupdate`);
      } else {
        // Create document in Firestore
        const paxCol = collection(db, 'passengers');
        const newDocRef = doc(paxCol);
        await setDoc(newDocRef, {
          ...paxPayload,
          id: newDocRef.id,
        });
        onToast('success', 'Tiket Penumpang Terbit', `Penumpang ${formData.fullName} berhasil didaftarkan di manifest kapal`);
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error('Save passenger error:', err);
      onToast('error', 'Gagal Menyimpan Data', err.message || 'Kesalahan saat menyimpan tiket');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler (Real delete in Firestore)
  const handleDeleteConfirm = async () => {
    if (!passengerToDelete) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, 'passengers', passengerToDelete.id);
      await deleteDoc(docRef);
      onToast('success', 'Data Dihapus', `Tiket ${passengerToDelete.ticketNo} telah dihapus permanen`);
      setPassengerToDelete(null);
    } catch (err: any) {
      console.error('Delete passenger error:', err);
      onToast('error', 'Gagal Menghapus', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="passenger-management-page" className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Manajemen Penumpang & Manifest Tiket
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pendaftaran tiket penumpang, validasi NIK KTP, alokasi kabin/kasur, dan kontrol check-in kapal.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="btn-add-passenger"
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Penumpang Baru</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Total Penumpang</span>
            <span className="text-lg font-bold text-slate-900">{filteredPassengers.length} Jiwa</span>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-700 block">Sudah Check-In / Onboard</span>
            <span className="text-lg font-bold text-emerald-950">{checkedInCount} Penumpang</span>
          </div>
          <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-100">
            <span className="text-[11px] font-medium text-sky-700 block">Total Penerimaan Tiket</span>
            <span className="text-lg font-bold text-sky-950">
              Rp {totalTicketRevenue.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
            <span className="text-[11px] font-medium text-amber-700 block">Kelas VIP & Bisnis</span>
            <span className="text-lg font-bold text-amber-950">
              {filteredPassengers.filter(p => p.ticketClass === 'Kelas 1A (VIP)' || p.ticketClass === 'Bisnis').length} Orang
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-passenger"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, NIK, no tiket, HP..."
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

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            id="filter-passenger-class"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="bg-slate-50 text-xs font-medium text-slate-700 py-2 px-3 rounded-lg border border-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Kelas Tiket</option>
            {TICKET_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            id="filter-passenger-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 text-xs font-medium text-slate-700 py-2 px-3 rounded-lg border border-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status Tiket</option>
            {TICKET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Passengers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3.5 px-4">No. Tiket</th>
                <th className="py-3.5 px-4">Nama & NIK</th>
                <th className="py-3.5 px-4">Kapal & Jadwal</th>
                <th className="py-3.5 px-4">Kelas & Tempat Duduk</th>
                <th className="py-3.5 px-4">Rute Perjalanan</th>
                <th className="py-3.5 px-4 text-right">Tarif (Rp)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPassengers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-medium text-sm text-slate-600">Tidak ada data penumpang</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Daftarkan tiket penumpang menggunakan tombol di atas'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPassengers.map((pax) => {
                  let statusBadge = 'bg-slate-100 text-slate-700';
                  if (pax.status === 'Terjadwal') statusBadge = 'bg-blue-50 text-blue-700 border border-blue-200';
                  if (pax.status === 'Check-in') statusBadge = 'bg-sky-50 text-sky-700 border border-sky-200';
                  if (pax.status === 'Onboard') statusBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                  if (pax.status === 'Selesai') statusBadge = 'bg-slate-100 text-slate-600';
                  if (pax.status === 'Batal') statusBadge = 'bg-rose-50 text-rose-700 border border-rose-200';

                  return (
                    <tr key={pax.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ticket No */}
                      <td className="py-3.5 px-4 align-top font-mono">
                        <div className="font-bold text-slate-900">{pax.ticketNo}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{pax.category}</div>
                      </td>

                      {/* Name & NIK */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-900">{pax.fullName}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          NIK: {pax.identityNo}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {pax.gender} • HP: {pax.phone}
                        </div>
                      </td>

                      {/* Ship & Departure */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-medium text-sky-700 flex items-center space-x-1">
                          <ShipIcon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>{pax.shipName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {pax.departureDate}
                        </div>
                      </td>

                      {/* Class & Seat */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-medium text-slate-800">{pax.ticketClass}</div>
                        <div className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {pax.seatOrCabin}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Bagasi: {pax.baggageKg} kg
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-3.5 px-4 align-top text-slate-700">
                        <div className="font-medium">{pax.originPort.split(',')[0]}</div>
                        <div className="text-[11px] text-slate-400">ke {pax.destPort.split(',')[0]}</div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 align-top text-right font-bold text-slate-900 whitespace-nowrap">
                        Rp {pax.ticketPrice.toLocaleString('id-ID')}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge}`}>
                          {pax.status}
                        </span>
                        {/* Quick Check-in CTA */}
                        {pax.status === 'Terjadwal' && (
                          <div className="mt-1">
                            <button
                              id={`quick-checkin-${pax.id}`}
                              type="button"
                              onClick={() => handleQuickStatusChange(pax, 'Check-in')}
                              className="text-[10px] font-bold text-sky-600 hover:text-sky-800 underline cursor-pointer"
                            >
                              Check-In Sekarang
                            </button>
                          </div>
                        )}
                        {pax.status === 'Check-in' && (
                          <div className="mt-1">
                            <button
                              id={`quick-onboard-${pax.id}`}
                              type="button"
                              onClick={() => handleQuickStatusChange(pax, 'Onboard')}
                              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 underline cursor-pointer"
                            >
                              Naik Kapal (Onboard)
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            id={`btn-edit-pax-${pax.id}`}
                            type="button"
                            onClick={() => openEditModal(pax)}
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Ubah data tiket"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-pax-${pax.id}`}
                            type="button"
                            onClick={() => setPassengerToDelete(pax)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Batalkan / Hapus tiket"
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

      {/* CREATE / EDIT PASSENGER MODAL */}
      {isFormModalOpen && (
        <div 
          id="modal-passenger-form"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditMode ? 'Perbarui Data Tiket Penumpang' : 'Formulir Pendaftaran Tiket Penumpang'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Validasi NIK KTP 16 digit dan alokasi tempat duduk penumpang.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 max-h-[72vh] overflow-y-auto pr-1">
              {/* Row 1: Ticket No & Ship */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Tiket
                  </label>
                  <input
                    type="text"
                    value={formData.ticketNo}
                    onChange={(e) => setFormData({ ...formData, ticketNo: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-mono ${
                      errors.ticketNo ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.ticketNo && <p className="text-[11px] text-rose-600 mt-1">{errors.ticketNo}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapal Pelayaran
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
                        {s.name} (Max Pax: {s.maxPassenger})
                      </option>
                    ))}
                  </select>
                  {errors.shipId && <p className="text-[11px] text-rose-600 mt-1">{errors.shipId}</p>}
                </div>
              </div>

              {/* Row 2: Full Name & NIK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap (Sesuai KTP / Identitas)
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Contoh: Raditya Setiyadi"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.fullName ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.fullName && <p className="text-[11px] text-rose-600 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nomor Identitas (NIK 16 Digit / Paspor)
                    </label>
                    <span className="text-[10px] text-slate-400">16 digit KTP</span>
                  </div>
                  <input
                    type="text"
                    maxLength={16}
                    value={formData.identityNo}
                    onChange={(e) => setFormData({ ...formData, identityNo: e.target.value.replace(/[^0-9a-zA-Z]/g, '') })}
                    placeholder="Contoh: 3171051208940003"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-mono ${
                      errors.identityNo ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.identityNo && <p className="text-[11px] text-rose-600 mt-1">{errors.identityNo}</p>}
                </div>
              </div>

              {/* Row 3: Gender, Age Category, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as PassengerGender })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Usia
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as PassengerCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Dewasa">Dewasa (&gt;12 th)</option>
                    <option value="Anak-anak">Anak-anak (2-11 th)</option>
                    <option value="Bayi">Bayi (&lt;2 th)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="081234567890"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.phone ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
                </div>
              </div>

              {/* Row 4: Ticket Class, Seat/Cabin, Baggage */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas Tiket
                  </label>
                  <select
                    value={formData.ticketClass}
                    onChange={(e) => setFormData({ ...formData, ticketClass: e.target.value as TicketClass })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {TICKET_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alokasi Tempat Duduk / Kabin
                  </label>
                  <input
                    type="text"
                    value={formData.seatOrCabin}
                    onChange={(e) => setFormData({ ...formData, seatOrCabin: e.target.value })}
                    placeholder="Dek 4 / Kasur 108"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.seatOrCabin ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.seatOrCabin && <p className="text-[11px] text-rose-600 mt-1">{errors.seatOrCabin}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berat Bagasi (Kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={formData.baggageKg}
                    onChange={(e) => setFormData({ ...formData, baggageKg: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.baggageKg ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.baggageKg && <p className="text-[11px] text-rose-600 mt-1">{errors.baggageKg}</p>}
                </div>
              </div>

              {/* Row 5: Ports (Origin & Destination) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pelabuhan Asal Keberangkatan
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
                    Pelabuhan Tujuan
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

              {/* Row 6: Departure Date & Status & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jadwal Keberangkatan
                  </label>
                  <input
                    type="text"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    placeholder="YYYY-MM-DD HH:mm"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Tiket
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TicketStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {TICKET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tarif Tiket (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.ticketPrice}
                    onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                    placeholder="450000"
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs ${
                      errors.ticketPrice ? 'border-rose-400 bg-rose-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.ticketPrice && <p className="text-[11px] text-rose-600 mt-1">{errors.ticketPrice}</p>}
                </div>
              </div>

              {/* Row 7: Emergency Contact */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kontak Darurat Penumpang (Nama & No HP Keluarga)
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Contoh: Ibu Siti (081299887766)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Form Buttons */}
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
                  id="btn-save-passenger"
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>{isEditMode ? 'Simpan Perubahan' : 'Terbitkan Tiket'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PASSENGER CONFIRM MODAL */}
      {passengerToDelete && (
        <div 
          id="modal-delete-passenger"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="p-2.5 rounded-full bg-rose-50 border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Hapus Tiket
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin membatalkan/menghapus tiket penumpang <strong className="text-slate-900">{passengerToDelete.fullName}</strong> ({passengerToDelete.ticketNo})? Data manifest penumpang ini akan dihapus dari Firestore database.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600 mb-5 border border-slate-200">
              <div>Kapal: <strong className="text-slate-800">{passengerToDelete.shipName}</strong></div>
              <div>NIK: <strong className="text-slate-800">{passengerToDelete.identityNo}</strong></div>
              <div>Kelas: {passengerToDelete.ticketClass} ({passengerToDelete.seatOrCabin})</div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setPassengerToDelete(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Kembali
              </button>
              <button
                id="btn-confirm-delete-passenger"
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
                    <span>Hapus Tiket</span>
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
