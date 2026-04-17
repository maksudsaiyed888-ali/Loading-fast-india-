import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, onSnapshot, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Constants from 'expo-constants';
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
  cancelVyapariTrip: (tripId: string) => Promise<void>;
  confirmVyapariTrip: (tripId: string, driverId: string, driverName: string) => Promise<void>;
  updateVyapariTrip: (tripId: string, updates: Partial<VyapariTrip>) => Promise<void>;
  getVyapariOwnTrips: (vyapariId: string) => VyapariTrip[];
  getOpenVyapariTrips: () => VyapariTrip[];
  generateDeliveryOtp: (tripId: string, gpsLat?: number, gpsLng?: number) => Promise<string>;
  verifyDeliveryOtp: (tripId: string, otp: string) => Promise<boolean>;
  sendLoginOtp: (phone: string) => Promise<{ success: boolean; smsSent?: boolean; otp?: string }>;
  verifyLoginOtp: (phone: string, otp: string) => Promise<boolean>;
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

  const cancelVyapariTrip = async (tripId: string) => {
    await fsUpdate('vyapariTrips', tripId, { status: 'cancelled' });
  };

  const confirmVyapariTrip = async (tripId: string, driverId: string, driverName: string) => {
    await fsUpdate('vyapariTrips', tripId, { status: 'accepted', acceptedByDriverId: driverId, acceptedByDriverName: driverName, acceptedAt: new Date().toISOString() });
  };

  const updateVyapariTrip = async (tripId: string, updates: Partial<VyapariTrip>) => {
    await fsUpdate('vyapariTrips', tripId, updates);
  };

  const addCommissionPayment = async (c: CommissionPayment) => {
    await fsSet('commissionPayments', c);
  };

  const hasDriverPaidCommission = (driverId: string, vyapariTripId: string) =>
    commissionPayments.some((c) => c.driverId === driverId && c.vyapariTripId === vyapariTripId);
  const getVyapariOwnTrips = (vyapariId: string) => vyapariTrips.filter((t) => t.vyapariId === vyapariId);
  const getOpenVyapariTrips = () => vyapariTrips.filter((t) => t.status === 'open');

  const sendSmsToReceiver = async (phone: string, otp: string, receiverName: string): Promise<boolean> => {
    try {
      const apiKey = (Constants.expoConfig?.extra as Record<string, string>)?.fast2smsKey || '';
      if (!apiKey) return false;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&variables_values=${otp}&route=otp&numbers=${cleanPhone}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      const data = await res.json();
      return data?.return === true;
    } catch (_e) {
      return false;
    }
  };

  const generateDeliveryOtp = async (tripId: string, gpsLat?: number, gpsLng?: number): Promise<string> => {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const trip = trips.find((t) => t.id === tripId);
    let smsSent = false;
    if (trip?.receiverPhone) {
      smsSent = await sendSmsToReceiver(trip.receiverPhone, otp, trip.receiverName || 'Receiver');
    }
    const updates: Record<string, unknown> = {
      status: 'pending_confirmation',
      tripStatus: 'delivered',
      deliveryOtp: otp,
      deliveredAt: new Date().toISOString(),
      smsSent,
    };
    if (gpsLat !== undefined) updates.deliveryLat = gpsLat;
    if (gpsLng !== undefined) updates.deliveryLng = gpsLng;
    await fsUpdate('trips', tripId, updates);
    return otp;
  };

  const verifyDeliveryOtp = async (tripId: string, otp: string): Promise<boolean> => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip || !trip.deliveryOtp) return false;
    if (trip.deliveryOtp.trim() !== otp.trim()) return false;
    await fsUpdate('trips', tripId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      deliveryOtp: '',
    });
    return true;
  };

  const fast2smsKey = (Constants.expoConfig?.extra as Record<string, string>)?.fast2smsKey || '';

  const sendLoginOtp = async (phone: string): Promise<{ success: boolean; smsSent?: boolean; otp?: string }> => {
    try {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await setDoc(doc(db, 'loginOtps', phone), { otp, expiresAt, createdAt: new Date().toISOString() });
      let smsSent = false;
      if (fast2smsKey) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&variables_values=${otp}&route=otp&numbers=${phone}`;
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timer);
          const data = await res.json();
          smsSent = data?.return === true;
        } catch (_e) { }
      }
      if (smsSent) {
        return { success: true, smsSent: true };
      }
      return { success: true, smsSent: false, otp };
    } catch (_e) {
      return { success: false };
    }
  };

  const verifyLoginOtp = async (phone: string, otp: string): Promise<boolean> => {
    try {
      const snap = await getDoc(doc(db, 'loginOtps', phone));
      if (!snap.exists()) return false;
      const data = snap.data();
      if (!data?.otp || data.otp !== otp.trim()) return false;
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) return false;
      await updateDoc(doc(db, 'loginOtps', phone), { otp: '', used: true });
      return true;
    } catch (_e) {
      return false;
    }
  };

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
        vyapariTrips, addVyapariTrip, cancelVyapariTrip, confirmVyapariTrip, updateVyapariTrip, getVyapariOwnTrips, getOpenVyapariTrips,
        generateDeliveryOtp, verifyDeliveryOtp,
        sendLoginOtp, verifyLoginOtp,
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
