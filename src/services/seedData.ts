import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Ship, CargoItem, PassengerItem } from '../types';

export const INITIAL_SHIPS: Omit<Ship, 'id'>[] = [
  {
    name: 'KM Kelud',
    callSign: 'PK-KLD',
    type: 'Kapal Penumpang & Kargo',
    maxCargoTon: 500,
    maxPassenger: 2000,
    currentPort: 'Tanjung Priok, Jakarta',
    route: 'Tj. Priok - Batu Ampar (Batam) - Belawan (Medan)',
    status: 'Sandar (Dermaga)',
    captainName: 'Capt. Hendra Gunawan, M.Mar',
    yearBuilt: 1998,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'KM Dorolonda',
    callSign: 'PK-DRL',
    type: 'Kapal Penumpang & Kargo',
    maxCargoTon: 450,
    maxPassenger: 2130,
    currentPort: 'Tanjung Perak, Surabaya',
    route: 'Surabaya - Makassar - Bau-Bau - Bitung',
    status: 'Proses Muat / Bongkar',
    captainName: 'Capt. Agus Supriyadi, M.Mar',
    yearBuilt: 2001,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'KM Ciremai',
    callSign: 'PK-CRM',
    type: 'Kapal Roro / Feri',
    maxCargoTon: 850,
    maxPassenger: 1500,
    currentPort: 'Soekarno-Hatta, Makassar',
    route: 'Tj. Priok - Surabaya - Makassar - Jayapura',
    status: 'Berlayar (At Sea)',
    captainName: 'Capt. Bambang Triyono, M.Mar',
    yearBuilt: 1993,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: 'KM Samudera Logistik IV',
    callSign: 'PK-SML4',
    type: 'Kapal Kontainer',
    maxCargoTon: 3200,
    maxPassenger: 0,
    currentPort: 'Tanjung Perak, Surabaya',
    route: 'Surabaya - Banjarmasin - Balikpapan',
    status: 'Proses Muat / Bongkar',
    captainName: 'Capt. Dedi Kurniawan, M.Mar',
    yearBuilt: 2012,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const INITIAL_CARGOS: Omit<CargoItem, 'id'>[] = [
  {
    manifestNo: 'MNF-CG-2025-001',
    shipId: '', // will link dynamically
    shipName: 'KM Kelud',
    cargoType: 'General Cargo / Sembako',
    description: 'Bahan Pokok & Sembako (Beras, Minyak Goreng, Gula Pasir)',
    weightTon: 35.5,
    volumeM3: 52.0,
    shipperName: 'PT Sumber Pangan Nusantara',
    shipperPhone: '081289123456',
    consigneeName: 'Koperasi Mina Bahari Batam',
    consigneePhone: '081377889900',
    originPort: 'Tanjung Priok, Jakarta',
    destPort: 'Batu Ampar, Batam',
    loadingDate: '2025-09-18',
    hazardLevel: 'Non-B3',
    deckLocation: 'Palka 1 - Lantai Bawah',
    status: 'Pemuatan (Loading)',
    shippingFee: 42500000,
    notes: 'Prioritas bongkar setibanya di Batam',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    manifestNo: 'MNF-CG-2025-002',
    shipId: '',
    shipName: 'KM Kelud',
    cargoType: 'Kontainer (FCL/LCL)',
    description: 'Kontainer 20ft Komponen Mesin Elektronik & IT',
    weightTon: 18.2,
    volumeM3: 33.2,
    shipperName: 'PT Global Logistik Indonesia',
    shipperPhone: '08119876543',
    consigneeName: 'CV Sumatera Sentosa Medan',
    consigneePhone: '085261234567',
    originPort: 'Tanjung Priok, Jakarta',
    destPort: 'Belawan, Medan',
    loadingDate: '2025-09-18',
    hazardLevel: 'Non-B3',
    deckLocation: 'Dek Kontainer Depan Bay 02',
    status: 'Pemuatan (Loading)',
    shippingFee: 28000000,
    notes: 'Fragile: Hindari guncangan keras',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    manifestNo: 'MNF-CG-2025-003',
    shipId: '',
    shipName: 'KM Dorolonda',
    cargoType: 'Kendaraan & Alat Berat',
    description: '3 Unit Truk Engkel Box Ekspedisi J&T Logistik',
    weightTon: 24.0,
    volumeM3: 75.0,
    shipperName: 'PT Ekspedisi Lintas Jawa-Sulawesi',
    shipperPhone: '081334556677',
    consigneeName: 'Perwakilan Cabang Makassar',
    consigneePhone: '082188990011',
    originPort: 'Tanjung Perak, Surabaya',
    destPort: 'Soekarno-Hatta, Makassar',
    loadingDate: '2025-09-17',
    hazardLevel: 'Non-B3',
    deckLocation: 'Car Deck B-04',
    status: 'Onboard (Berlayar)',
    shippingFee: 36000000,
    notes: 'Bahan bakar kendaraan maksimal seperempat tangki',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    manifestNo: 'MNF-CG-2025-004',
    shipId: '',
    shipName: 'KM Dorolonda',
    cargoType: 'Curah Cair',
    description: 'Drum Oli Pelumas Industri Maritim (60 Drum)',
    weightTon: 12.8,
    volumeM3: 16.0,
    shipperName: 'PT Pelumas Prima Raya',
    shipperPhone: '081290123999',
    consigneeName: 'PT Galangan Kapal Bitung',
    consigneePhone: '085399881122',
    originPort: 'Tanjung Perak, Surabaya',
    destPort: 'Samudera, Bitung',
    loadingDate: '2025-09-17',
    hazardLevel: 'B3 Kelas 3 (Flammable)',
    deckLocation: 'Palka Khusus B3 Terisolasi',
    status: 'Onboard (Berlayar)',
    shippingFee: 22000000,
    notes: 'Dilengkapi APAR & detektor gas B3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const INITIAL_PASSENGERS: Omit<PassengerItem, 'id'>[] = [
  {
    ticketNo: 'TIK-2025-7801',
    shipId: '',
    shipName: 'KM Kelud',
    fullName: 'Ahmad Fauzi Rahman',
    identityNo: '3171051208940003',
    gender: 'Laki-laki',
    category: 'Dewasa',
    phone: '081288991234',
    ticketClass: 'Kelas 1A (VIP)',
    seatOrCabin: 'Kabin VIP 1A-04',
    originPort: 'Tanjung Priok, Jakarta',
    destPort: 'Belawan, Medan',
    departureDate: '2025-09-19 14:00',
    baggageKg: 18,
    status: 'Check-in',
    ticketPrice: 1750000,
    emergencyContact: 'Ibu Ratna (081299887766)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    ticketNo: 'TIK-2025-7802',
    shipId: '',
    shipName: 'KM Kelud',
    fullName: 'Siti Nurhaliza Putri',
    identityNo: '3275026504980001',
    gender: 'Perempuan',
    category: 'Dewasa',
    phone: '081399002233',
    ticketClass: 'Bisnis',
    seatOrCabin: 'Kabin B-12',
    originPort: 'Tanjung Priok, Jakarta',
    destPort: 'Batu Ampar, Batam',
    departureDate: '2025-09-19 14:00',
    baggageKg: 15,
    status: 'Check-in',
    ticketPrice: 980000,
    emergencyContact: 'Bpk. Hendro (081355443322)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    ticketNo: 'TIK-2025-7803',
    shipId: '',
    shipName: 'KM Kelud',
    fullName: 'Budi Santoso Wibowo',
    identityNo: '3578012306890005',
    gender: 'Laki-laki',
    category: 'Dewasa',
    phone: '085233445566',
    ticketClass: 'Ekonomi',
    seatOrCabin: 'Dek 4 Bed 118',
    originPort: 'Tanjung Priok, Jakarta',
    destPort: 'Belawan, Medan',
    departureDate: '2025-09-19 14:00',
    baggageKg: 20,
    status: 'Terjadwal',
    ticketPrice: 425000,
    emergencyContact: 'Adik Wawan (085211223344)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    ticketNo: 'TIK-2025-7804',
    shipId: '',
    shipName: 'KM Kelud',
    fullName: 'Rizky Ramadhan',
    identityNo: '3578011509150002',
    gender: 'Laki-laki',
    category: 'Anak-anak',
    phone: '085233445566',
    ticketClass: 'Ekonomi',
    seatOrCabin: 'Dek 4 Bed 119',
    originPort: 'Tanjung Priok, Jakarta',
    destPort: 'Belawan, Medan',
    departureDate: '2025-09-19 14:00',
    baggageKg: 8,
    status: 'Terjadwal',
    ticketPrice: 220000,
    emergencyContact: 'Budi Santoso (085233445566)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    ticketNo: 'TIK-2025-7805',
    shipId: '',
    shipName: 'KM Dorolonda',
    fullName: 'Dewi Sartika Harahap',
    identityNo: '1271035011910004',
    gender: 'Perempuan',
    category: 'Dewasa',
    phone: '082166778899',
    ticketClass: 'Bisnis',
    seatOrCabin: 'Kabin B-08',
    originPort: 'Tanjung Perak, Surabaya',
    destPort: 'Soekarno-Hatta, Makassar',
    departureDate: '2025-09-17 20:00',
    baggageKg: 22,
    status: 'Onboard',
    ticketPrice: 890000,
    emergencyContact: 'Suami Faisal (082199001122)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export async function ensureInitialSeed(): Promise<void> {
  try {
    const shipsCol = collection(db, 'ships');
    const shipSnap = await getDocs(shipsCol);

    let shipMap: Record<string, string> = {};

    if (shipSnap.empty) {
      // Seed Ships
      for (const shipData of INITIAL_SHIPS) {
        const newDocRef = doc(shipsCol);
        await setDoc(newDocRef, { ...shipData, id: newDocRef.id });
        shipMap[shipData.name] = newDocRef.id;
      }
    } else {
      shipSnap.forEach(d => {
        const data = d.data() as Ship;
        shipMap[data.name] = d.id;
      });
    }

    // Seed Cargos if empty
    const cargoCol = collection(db, 'cargos');
    const cargoSnap = await getDocs(cargoCol);
    if (cargoSnap.empty) {
      for (const cargo of INITIAL_CARGOS) {
        const newDocRef = doc(cargoCol);
        const linkedShipId = shipMap[cargo.shipName] || '';
        await setDoc(newDocRef, {
          ...cargo,
          id: newDocRef.id,
          shipId: linkedShipId,
        });
      }
    }

    // Seed Passengers if empty
    const passengerCol = collection(db, 'passengers');
    const passengerSnap = await getDocs(passengerCol);
    if (passengerSnap.empty) {
      for (const pax of INITIAL_PASSENGERS) {
        const newDocRef = doc(passengerCol);
        const linkedShipId = shipMap[pax.shipName] || '';
        await setDoc(newDocRef, {
          ...pax,
          id: newDocRef.id,
          shipId: linkedShipId,
        });
      }
    }
  } catch (err) {
    console.error('Initial seed error:', err);
  }
}
