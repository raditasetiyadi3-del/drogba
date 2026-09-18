import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Ship, CargoItem, PassengerItem, ToastMessage, AppUser } from './types';
import { ensureInitialSeed } from './services/seedData';
import { LoginForm } from './components/LoginForm';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { CargoManagement } from './components/CargoManagement';
import { PassengerManagement } from './components/PassengerManagement';
import { ShipManagement } from './components/ShipManagement';
import { ManifestPrintModal } from './components/ManifestPrintModal';
import { ToastContainer } from './components/Toast';

export default function App() {
  // Auth state (Stored directly in Firebase Auth + Firestore, ZERO localStorage)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [adminDisplayName, setAdminDisplayName] = useState<string>('');
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Database collections real-time state
  const [ships, setShips] = useState<Ship[]>([]);
  const [cargos, setCargos] = useState<CargoItem[]>([]);
  const [passengers, setPassengers] = useState<PassengerItem[]>([]);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);

  // Active view & navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'cargo' | 'passenger' | 'ships' | 'manifest'>('overview');
  const [selectedShipId, setSelectedShipId] = useState<string>('ALL');

  // Notification Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add Toast helper
  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Listen to Firebase Auth state (No localStorage!)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const appUser: AppUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        };
        setCurrentUser(appUser);
        // Fetch Admin display name from Firestore
        try {
          const adminDoc = await getDoc(doc(db, 'system_admins', user.uid));
          if (adminDoc.exists()) {
            const data = adminDoc.data();
            setAdminDisplayName(data.displayName || user.email?.split('@')[0] || 'Admin');
          } else {
            setAdminDisplayName(user.displayName || user.email?.split('@')[0] || 'Admin Pelabuhan');
          }
        } catch (e) {
          setAdminDisplayName(user.displayName || user.email?.split('@')[0] || 'Admin');
        }
      } else {
        // Keep active demo admin session if user intentionally logged in via demo button
        setCurrentUser((prev) => (prev?.uid?.startsWith('admin-') ? prev : null));
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Firestore Listeners for Ships, Cargos, Passengers
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    // Seed database if initial collections are empty
    ensureInitialSeed();

    // Listen to Ships
    const unsubShips = onSnapshot(
      collection(db, 'ships'),
      (snapshot) => {
        if (!isMounted) return;
        const shipsData: Ship[] = [];
        snapshot.forEach((docSnap) => {
          shipsData.push({ ...docSnap.data(), id: docSnap.id } as Ship);
        });
        setShips(shipsData);
        setIsDbLoading(false);
      },
      (error) => {
        console.error('Ships onSnapshot error:', error);
        addToast('error', 'Gagal Sinkronisasi Kapal', error.message);
      }
    );

    // Listen to Cargos
    const unsubCargos = onSnapshot(
      collection(db, 'cargos'),
      (snapshot) => {
        if (!isMounted) return;
        const cargoData: CargoItem[] = [];
        snapshot.forEach((docSnap) => {
          cargoData.push({ ...docSnap.data(), id: docSnap.id } as CargoItem);
        });
        // Sort descending by createdAt
        cargoData.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setCargos(cargoData);
      },
      (error) => {
        console.error('Cargos onSnapshot error:', error);
        addToast('error', 'Gagal Sinkronisasi Kargo', error.message);
      }
    );

    // Listen to Passengers
    const unsubPassengers = onSnapshot(
      collection(db, 'passengers'),
      (snapshot) => {
        if (!isMounted) return;
        const paxData: PassengerItem[] = [];
        snapshot.forEach((docSnap) => {
          paxData.push({ ...docSnap.data(), id: docSnap.id } as PassengerItem);
        });
        // Sort descending by createdAt
        paxData.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setPassengers(paxData);
      },
      (error) => {
        console.error('Passengers onSnapshot error:', error);
        addToast('error', 'Gagal Sinkronisasi Penumpang', error.message);
      }
    );

    return () => {
      isMounted = false;
      unsubShips();
      unsubCargos();
      unsubPassengers();
    };
  }, [currentUser]);

  // Handle Logout (No localStorage)
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.warn('Logout signOut error or already signed out:', err);
    } finally {
      setCurrentUser(null);
      setAdminDisplayName('');
      addToast('info', 'Sesi Berakhir', 'Anda telah keluar dari sistem admin pelabuhan');
    }
  };

  // Initial Auth Loading Screen
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">
            Menghubungkan ke Firebase Firestore Database...
          </p>
        </div>
      </div>
    );
  }

  // DEFAULT VIEW: Form Login jika belum terautentikasi (Sesuai Syarat #3)
  if (!currentUser) {
    return (
      <>
        <LoginForm
          onLoginSuccess={(user: AppUser) => {
            setCurrentUser(user);
            setAdminDisplayName(user.displayName || user.email?.split('@')[0] || 'Admin');
          }}
          onToast={addToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // MAIN AUTHENTICATED DASHBOARD (Light, Crisp, Inter font)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedShipId={selectedShipId}
        setSelectedShipId={setSelectedShipId}
        ships={ships}
        cargoCount={cargos.length}
        passengerCount={passengers.length}
        userEmail={currentUser.email || 'admin@maritim.id'}
        userDisplayName={adminDisplayName}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Loading placeholder while connecting to firestore */}
        {isDbLoading && ships.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Memuat data armada dan manifes dari Firestore...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <DashboardOverview
                ships={ships}
                cargos={cargos}
                passengers={passengers}
                selectedShipId={selectedShipId}
                onNavigate={setActiveTab}
                onAddCargo={() => setActiveTab('cargo')}
                onAddPassenger={() => setActiveTab('passenger')}
              />
            )}

            {activeTab === 'cargo' && (
              <CargoManagement
                cargos={cargos}
                ships={ships}
                selectedShipId={selectedShipId}
                onToast={addToast}
              />
            )}

            {activeTab === 'passenger' && (
              <PassengerManagement
                passengers={passengers}
                ships={ships}
                selectedShipId={selectedShipId}
                onToast={addToast}
              />
            )}

            {activeTab === 'ships' && (
              <ShipManagement
                ships={ships}
                cargos={cargos}
                passengers={passengers}
                onToast={addToast}
              />
            )}

            {activeTab === 'manifest' && (
              <ManifestPrintModal
                ships={ships}
                cargos={cargos}
                passengers={passengers}
                selectedShipId={selectedShipId}
                onClose={() => setActiveTab('overview')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SIMUKAP • Sistem Informasi Muatan Kapal & Penumpang Maritim Indonesia</span>
          <span className="text-[11px] text-slate-400">
            Terhubung Langsung ke Firestore DB • Sumber Tunggal Kebenaran (No localStorage)
          </span>
        </div>
      </footer>

      {/* Real-Time Toast Alerts Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
