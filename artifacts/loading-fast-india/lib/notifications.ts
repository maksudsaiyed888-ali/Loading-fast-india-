import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { haversineKm, getInitialRadius } from '@/lib/location';
import { Driver } from '@/lib/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(driverId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('vyapari-trips', {
      name: 'व्यापारी ट्रिप',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B00',
      sound: 'default',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: '90d24ee7-082f-4a98-b2f2-e57f8c87c9d5',
  });
  const token = tokenData.data;
  await updateDoc(doc(db, 'drivers', driverId), { pushToken: token });
  return token;
}

async function sendPush(tokens: string[], title: string, body: string): Promise<void> {
  const valid = tokens.filter((t) => t?.startsWith('ExponentPushToken'));
  if (valid.length === 0) return;
  const chunks: string[][] = [];
  for (let i = 0; i < valid.length; i += 100) chunks.push(valid.slice(i, i + 100));
  await Promise.all(
    chunks.map((chunk) =>
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          chunk.map((to) => ({
            to, channelId: 'vyapari-trips',
            title, body, sound: 'default', priority: 'high',
            data: { type: 'vyapari_trip' },
          })),
        ),
      }),
    ),
  );
}

function filterZone(
  drivers: Driver[],
  fromLat: number,
  fromLon: number,
  minKm: number,
  maxKm: number,
  notified: Set<string>,
): string[] {
  return drivers
    .filter((d) => {
      if (!d.pushToken || notified.has(d.pushToken)) return false;
      if (!d.latitude || !d.longitude) return minKm === 0;
      const dist = haversineKm(fromLat, fromLon, d.latitude, d.longitude);
      return dist >= minKm && dist <= maxKm;
    })
    .map((d) => d.pushToken as string);
}

export function sendZoneNotifications(
  drivers: Driver[],
  fromLat: number,
  fromLon: number,
  vehicleTypePref: string,
  fromCity: string,
  toCity: string,
  goodsCategory: string,
  vyapariName: string,
  weightTons?: string,
  ratePerTon?: string,
): void {
  const initialR = getInitialRadius(vehicleTypePref);
  const title = `🚛 नई ट्रिप — ${fromCity} → ${toCity}`;

  const rentPart = ratePerTon && Number(ratePerTon) > 0
    ? ` • ₹${Number(ratePerTon).toLocaleString('en-IN')}/टन`
    : '';
  const weightPart = weightTons && Number(weightTons) > 0
    ? ` • ${weightTons} टन`
    : '';
  const body = `${goodsCategory}${weightPart}${rentPart} — ${vyapariName}`;

  const notified = new Set<string>();

  const zoneA = filterZone(drivers, fromLat, fromLon, 0, initialR, notified);
  sendPush(zoneA, `${title} 📍 Zone A`, body);
  zoneA.forEach((t) => notified.add(t));

  setTimeout(() => {
    const zoneB = filterZone(drivers, fromLat, fromLon, initialR, initialR + 30, notified);
    sendPush(zoneB, `${title} 📍 Zone B`, `${body} — अभी भी उपलब्ध`);
    zoneB.forEach((t) => notified.add(t));
  }, 10 * 60 * 1000);

  setTimeout(() => {
    const zoneC = filterZone(drivers, fromLat, fromLon, initialR + 30, initialR + 60, notified);
    sendPush(zoneC, `${title} 📍 Zone C`, `${body} — तुरंत संपर्क करें!`);
  }, 20 * 60 * 1000);
}

export function sendRefreshNotifications(
  drivers: Driver[],
  fromLat: number,
  fromLon: number,
  fromCity: string,
  toCity: string,
  goodsCategory: string,
): void {
  const allTokens = drivers
    .filter((d) => d.pushToken?.startsWith('ExponentPushToken'))
    .map((d) => d.pushToken as string);
  sendPush(
    allTokens,
    `⬇️ Trip अभी भी उपलब्ध — ${fromCity} → ${toCity}`,
    `${goodsCategory} • कोई driver नहीं मिला — अभी Accept करें!`,
  );
}
