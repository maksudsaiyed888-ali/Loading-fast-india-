import * as Location from 'expo-location';

export interface DriverLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

let locationSubscription: Location.LocationSubscription | null = null;
let currentLocation: DriverLocation | null = null;
const listeners: Array<(loc: DriverLocation) => void> = [];

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getCurrentLocation(): Promise<DriverLocation | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const granted = await requestLocationPermission();
      if (!granted) return null;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    currentLocation = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
      timestamp: loc.timestamp,
    };
    return currentLocation;
  } catch {
    return null;
  }
}

export async function startLocationTracking(
  onUpdate: (loc: DriverLocation) => void
): Promise<void> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      const granted = await requestLocationPermission();
      if (!granted) return;
    }
    listeners.push(onUpdate);
    if (locationSubscription) return;

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 100,
        timeInterval: 30000,
      },
      (loc) => {
        const d: DriverLocation = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          timestamp: loc.timestamp,
        };
        currentLocation = d;
        listeners.forEach((fn) => fn(d));
      }
    );
  } catch {}
}

export function stopLocationTracking(): void {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
  listeners.length = 0;
}

export function getLastKnownLocation(): DriverLocation | null {
  return currentLocation;
}

export function distanceBetweenCoords(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
