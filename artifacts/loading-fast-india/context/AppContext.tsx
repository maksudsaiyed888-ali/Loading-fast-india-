import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Driver, Trip, Vehicle, Vyapari, Complaint, Bilty, ChatMessage, Rating, AppRating, VyapariTrip } from '@/lib/types';
import { KEYS, addToList, getList, updateInList } from '@/lib/storage';

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

  const refreshAll = useCallback(async () => {
    const [d, v, ve, t, b, c, cm, r, ar, vt] = await Promise.all([
      getList<Driver>(KEYS.DRIVERS),
      getList<Vyapari>(KEYS.VYAPARIS),
      getList<Vehicle>(KEYS.VEHICLES),
      getList<Trip>(KEYS.TRIPS),
      getList<Bilty>(KEYS.BILTIES),
      getList<Complaint>(KEYS.COMPLAINTS),
      getList<ChatMessage>(KEYS.CHAT_MESSAGES),
      getList<Rating>(KEYS.RATINGS),
      getList<AppRating>(KEYS.APP_RATINGS),
      getList<VyapariTrip>(KEYS.VYAPARI_TRIPS),
    ]);
    setDrivers(d);
    setVyaparis(v);
    setVehicles(ve);
    setTrips(t);
    setBilties(b);
    setComplaints(c);
    setChatMessages(cm);
    setRatings(r);
    setAppRatings(ar);
    setVyapariTrips(vt);
  }, []);

  useEffect(() => {
    const init = async () => {
      const saved = await AsyncStorage.getItem(KEYS.USER);
      if (saved) setUser(JSON.parse(saved));
      await refreshAll();
      setIsLoading(false);
    };
    init();
  }, [refreshAll]);

  const login = async (u: AppUser) => {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(u));
    setUser(u);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(KEYS.USER);
    setUser(null);
  };

  const addDriver = async (d: Driver) => {
    await addToList(KEYS.DRIVERS, d);
    setDrivers((prev) => [...prev, d]);
  };

  const addVyapari = async (v: Vyapari) => {
    await addToList(KEYS.VYAPARIS, v);
    setVyaparis((prev) => [...prev, v]);
  };

  const addVehicle = async (v: Vehicle) => {
    await addToList(KEYS.VEHICLES, v);
    setVehicles((prev) => [...prev, v]);
  };

  const addTrip = async (t: Trip) => {
    await addToList(KEYS.TRIPS, t);
    setTrips((prev) => [...prev, t]);
  };

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    await updateInList<Trip>(KEYS.TRIPS, id, updates);
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const addBilty = async (b: Bilty) => {
    await addToList(KEYS.BILTIES, b);
    setBilties((prev) => [...prev, b]);
  };

  const addComplaint = async (c: Complaint) => {
    await addToList(KEYS.COMPLAINTS, c);
    setComplaints((prev) => [...prev, c]);
  };

  const sendChatMessage = async (msg: ChatMessage) => {
    await addToList(KEYS.CHAT_MESSAGES, msg);
    setChatMessages((prev) => [...prev, msg]);
  };

  const getTripMessages = (tripId: string) =>
    chatMessages.filter((m) => m.tripId === tripId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const addRating = async (r: Rating) => {
    await addToList(KEYS.RATINGS, r);
    setRatings((prev) => [...prev, r]);
  };

  const getUserRatings = (userId: string) => ratings.filter((r) => r.toId === userId);

  const getAverageRating = (userId: string) => {
    const userRatings = ratings.filter((r) => r.toId === userId);
    if (userRatings.length === 0) return 0;
    return userRatings.reduce((sum, r) => sum + r.stars, 0) / userRatings.length;
  };

  const hasRated = (tripId: string, fromId: string) =>
    ratings.some((r) => r.tripId === tripId && r.fromId === fromId);

  const addAppRating = async (r: AppRating) => {
    await addToList(KEYS.APP_RATINGS, r);
    setAppRatings((prev) => [...prev, r]);
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
    await addToList(KEYS.VYAPARI_TRIPS, t);
    setVyapariTrips((prev) => [...prev, t]);
  };
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
