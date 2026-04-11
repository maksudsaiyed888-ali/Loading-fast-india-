import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, onSnapshot, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { registerForPushNotifications } from '@/lib/notifications';
import { updateDriverLocation } from '@/lib/location';
import { Driver, Trip, Vehicle, Vyapari, Complaint, Bilty, ChatMessage, Rating, AppRating, VyapariTrip, CommissionPayment } from '@/lib/types';

const USER_KEY = '@lfi_user';

interface AppUser {
  id: string;
  role: 'driver' | 'vyapari' | 'admin';
  name: string;
  phone: string;
  email: string;
}

interface AppContextType {
  user: AppUser | null;
  isLoading: boolean;
  drivers: Driver[];
  vyaparis: Vyapari[];
  vehicles: Vehicle[];
  trips: Trip[];
  bilties: Bilty[];
  complaints: Complaint[];
  chatMessages: ChatMessage[];
  ratings: Rating[];
  login: (user: AppUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshAll: () => Promise<void>;
  addDriver: (d: Driver) => Promise<void>;
  addVyapari: (v: Vyapari) => Promise<void>;
  addVehicle: (v: Vehicle) => Promise<void>;
  addTrip: (t: Trip) => Promise<void>;
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>;
  addBilty: (b: Bilty) => Promise<void>;
  addComplaint: (c: Complaint) => Promise<void>;
  sendChatMessage: (msg: ChatMessage) => Promise<void>;
  getTripMessages: (tripId: string) => ChatMessage[];
  addRating: (r: Rating) => Promise<void>;
  getUserRatings: (userId: string) => Rating[];
  getAverageRating: (userId: string) => number;
  hasRated: (tripId: string, fromId: string) => boolean;
  appRatings: AppRating[];
  addAppRating: (r: AppRating) => Promise<void>;
  getAppAvgRating: () => number;
  hasRatedApp: (userId: string) => boolean;
  commissionPayments: CommissionPayment[];
  addCommissionPayment: (c: CommissionPayment) => Promise<void>;
  hasDriverPaidCommission: (driverId: string, vyapariTripId: string) => boolean;
  getDriverVehicles: (driverId: string) => Vehicle[];
  getDriverTrips: (driverId: string) => Trip[];
  getVyapariBookings: (vyapariId: string) => Trip[];
  getAvailableTrips: () => Trip[];
  vyapariTrips: VyapariTrip[];
  addVyapariTrip: (t: VyapariTrip) => Promise<void>;
  getVyapariOwnTrips: (vyapariId: string) => VyapariTrip[];
  getOpenVyapariTrips: () => VyapariTrip[];
  currentDriver: Driver | null;
  currentVyapari: Vyapari | null;
}

const AppContext = createContext<AppContextType | null>(null);

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

function fsSet<T extends { id: string }>(col: string, item: T) {
  return setDoc(doc(db, col, item.id), stripUndefined(item as Record<string, unknown>));
}

function fsUpdate(col: string, id: string, updates: Record<string, unknown>) {
  return updateDoc(doc(db, col, id), updates);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vyaparis, setVyaparis] = useState<Vyapari[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bilties, setBilties] = useState<Bilty[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [appRatings, setAppRatings] = useState<AppRating[]>([]);
  const [vyapariTrips, setVyapariTrips] = useState<VyapariTrip[]>([]);
  const [commissionPayments, setCommissionPayments] = useState<CommissionPayment[]>([]);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const listen = <T,>(col: string, setter: (v: T[]) => void) => {
      const q = query(collection(db, col), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        setter(snap.docs.map((d) => d.data() as T));
      }, () => {
        const fallback = onSnapshot(collection(db, col), (snap) => {
          setter(snap.docs.map((d) => d.data() as T));
        });
        unsubs.push(fallback);
      });
      unsubs.push(unsub);
    };

    listen<Driver>('drivers', setDrivers);
    listen<Vyapari>('vyaparis', setVyaparis);
    listen<Vehicle>('vehicles', setVehicles);
    listen<Trip>('trips', setTrips);
    listen<Bilty>('bilties', setBilties);
    listen<Complaint>('complaints', setComplaints);
    listen<ChatMessage>('chatMessages', setChatMessages);
    listen<Rating>('ratings', setRatings);
    listen<AppRating>('appRatings', setAppRatings);
    listen<VyapariTrip>('vyapariTrips', setVyapariTrips);
    listen<CommissionPayment>('commissionPayments', setCommissionPayments);

    AsyncStorage.getItem(USER_KEY).then((saved) => {
      if (saved) setUser(JSON.parse(saved));
      setIsLoading(false);
    });

    return () => unsubs.forEach((u) => u());
  }, []);

  const refreshAll = useCallback(async () => {}, []);

  const login = async (u: AppUser) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
    if (u.role === 'driver') {
      registerForPushNotifications(u.id).catch(() => {});
      updateDriverLocation(u.id).catch(() => {});
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const addDriver = async (d: Driver) => {
    await fsSet('drivers', d);
  };

  const addVyapari = async (v: Vyapari) => {
    await fsSet('vyaparis', v);
  };

  const addVehicle = async (v: Vehicle) => {
    await fsSet('vehicles', v);
  };

  const addTrip = async (t: Trip) => {
    await fsSet('trips', t);
  };

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    await fsUpdate('trips', id, updates as Record<string, unknown>);
  };

  const addBilty = async (b: Bilty) => {
    await fsSet('bilties', b);
  };

  const addComplaint = async (c: Complaint) => {
    await fsSet('complaints', c);
  };

  const sendChatMessage = async (msg: ChatMessage) => {
    await fsSet('chatMessages', msg);
  };

  const getTripMessages = (tripId: string) =>
    chatMessages.filter((m) => m.tripId === tripId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const addRating = async (r: Rating) => {
    await fsSet('ratings', r);
  };

  const getUserRatings = (userId: string) => ratings.filter((r) => r.toId === userId);

  const getAverageRating = (userId: string) => {
    const ur = ratings.filter((r) => r.toId === userId);
    if (ur.length === 0) return 0;
    return ur.reduce((sum, r) => sum + r.stars, 0) / ur.length;
  };

  const hasRated = (tripId: string, fromId: string) =>
    ratings.some((r) => r.tripId === tripId && r.fromId === fromId);

  const addAppRating = async (r: AppRating) => {
    await fsSet('appRatings', r);
  };

  const getAppAvgRating = () => {
    if (appRatings.length === 0) return 0;
    return appRatings.reduce((sum, r) => sum + r.stars, 0) / appRatings.length;
  };

  const hasRatedApp = (userId: string) => appRatings.some((r) => r.userId === userId);

  const getDriverVehicles = (driverId: string) => vehicles.filter((v) => v.driverId === driverId);
  const getDriverTrips = (driverId: string) => trips.filter((t) => t.driverId === driverId);
  const getVyapariBookings = (vyapariId: string) => trips.filter((t) => t.confirmedBy === vyapariId);
  const getAvailableTrips = () => trips.filter((t) => t.status === 'available');

  const addVyapariTrip = async (t: VyapariTrip) => {
    await fsSet('vyapariTrips', t);
  };

  const addCommissionPayment = async (c: CommissionPayment) => {
    await fsSet('commissionPayments', c);
  };

  const hasDriverPaidCommission = (driverId: string, vyapariTripId: string) =>
    commissionPayments.some((c) => c.driverId === driverId && c.vyapariTripId === vyapariTripId);
  const getVyapariOwnTrips = (vyapariId: string) => vyapariTrips.filter((t) => t.vyapariId === vyapariId);
  const getOpenVyapariTrips = () => vyapariTrips.filter((t) => t.status === 'open');

  const currentDriver = user?.role === 'driver' ? drivers.find((d) => d.id === user.id) ?? null : null;
  const currentVyapari = user?.role === 'vyapari' ? vyaparis.find((v) => v.id === user.id) ?? null : null;

  return (
    <AppContext.Provider
      value={{
        user, isLoading, drivers, vyaparis, vehicles, trips, bilties, complaints, chatMessages, ratings,
        login, logout, refreshAll,
        addDriver, addVyapari, addVehicle, addTrip, updateTrip, addBilty, addComplaint,
        sendChatMessage, getTripMessages,
        addRating, getUserRatings, getAverageRating, hasRated,
        appRatings, addAppRating, getAppAvgRating, hasRatedApp,
        getDriverVehicles, getDriverTrips, getVyapariBookings, getAvailableTrips,
        vyapariTrips, addVyapariTrip, getVyapariOwnTrips, getOpenVyapariTrips,
        commissionPayments, addCommissionPayment, hasDriverPaidCommission,
        currentDriver, currentVyapari,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
