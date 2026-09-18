export type ShipStatus = 'Sandar (Dermaga)' | 'Proses Muat / Bongkar' | 'Berlayar (At Sea)' | 'Perbaikan / Docking';
export type ShipType = 'Kapal Penumpang & Kargo' | 'Kapal Roro / Feri' | 'Kapal Kontainer' | 'Kapal Kargo Curah';

export interface Ship {
  id: string;
  name: string;
  callSign: string;
  type: ShipType;
  maxCargoTon: number;
  maxPassenger: number;
  currentPort: string;
  route: string;
  status: ShipStatus;
  captainName?: string;
  yearBuilt?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CargoType = 
  | 'Kontainer (FCL/LCL)' 
  | 'Curah Kering' 
  | 'Curah Cair' 
  | 'Kendaraan & Alat Berat' 
  | 'General Cargo / Sembako';

export type HazardLevel = 
  | 'Non-B3' 
  | 'B3 Kelas 3 (Flammable)' 
  | 'B3 Kelas 8 (Corrosive)' 
  | 'Reefer / Berpendingin';

export type CargoStatus = 
  | 'Terdaftar (Draft)' 
  | 'Pemuatan (Loading)' 
  | 'Onboard (Berlayar)' 
  | 'Tiba di Pelabuhan' 
  | 'Selesai Bongkar';

export interface CargoItem {
  id: string;
  manifestNo: string;
  shipId: string;
  shipName: string;
  cargoType: CargoType;
  description: string;
  weightTon: number;
  volumeM3: number;
  shipperName: string;
  shipperPhone: string;
  consigneeName: string;
  consigneePhone: string;
  originPort: string;
  destPort: string;
  loadingDate: string;
  hazardLevel: HazardLevel;
  deckLocation: string;
  status: CargoStatus;
  shippingFee: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PassengerGender = 'Laki-laki' | 'Perempuan';
export type PassengerCategory = 'Dewasa' | 'Anak-anak' | 'Bayi';
export type TicketClass = 'Ekonomi' | 'Bisnis' | 'Kelas 1A (VIP)' | 'Kabin Keluarga';
export type TicketStatus = 'Terjadwal' | 'Check-in' | 'Onboard' | 'Selesai' | 'Batal';

export interface PassengerItem {
  id: string;
  ticketNo: string;
  shipId: string;
  shipName: string;
  fullName: string;
  identityNo: string; // NIK 16 digit atau No Paspor
  gender: PassengerGender;
  category: PassengerCategory;
  phone: string;
  ticketClass: TicketClass;
  seatOrCabin: string;
  originPort: string;
  destPort: string;
  departureDate: string;
  baggageKg: number;
  status: TicketStatus;
  ticketPrice: number;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: string;
  badgeNumber?: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  badgeNumber: string;
  lastLogin: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}
