import * as Location from 'expo-location';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const VEHICLE_INITIAL_RADIUS: Record<string, number> = {
  'riksha-3w': 20,
  'auto-goods': 20,
  'tempo-vikram': 20,
  'pickup': 20,
  'mini-truck': 20,
  'tractor-trolley': 30,
  'truck-6w': 30,
  'truck-14': 30,
  'truck-17': 30,
  'tipper-6w': 30,
  'flatbed-6w': 30,
  'tanker-6w': 30,
  'refrigerated': 30,
  'truck-10w': 50,
  'tipper-10w': 50,
  'tanker-10w': 50,
  'container-20': 50,
  'truck-12w': 50,
  'tipper-12w': 50,
  'tanker-12w': 50,
  'truck-14w': 50,
  'tipper-14w': 50,
  'truck-16w': 50,
  'trailer-16w': 50,
  'trailer-18w': 50,
  'container-40': 50,
  'tanker-18w': 50,
  'mav-20w': 50,
  'mav-22w': 50,
  'crane-truck': 50,
};

export function getInitialRadius(vehicleTypePref: string): number {
  if (vehicleTypePref === 'small') return 20;
  if (vehicleTypePref === 'medium') return 30;
  if (vehicleTypePref === 'large' || vehicleTypePref === 'heavy') return 50;
  return 50;
}

export async function updateDriverLocation(driverId: string): Promise<void> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await updateDoc(doc(db, 'drivers', driverId), {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      lastLocationAt: new Date().toISOString(),
    });
  } catch {
  }
}
