import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

export async function notifyDriversOfNewTrip(
  pushTokens: string[],
  fromCity: string,
  toCity: string,
  goodsCategory: string,
  vyapariName: string,
): Promise<void> {
  const validTokens = pushTokens.filter((t) => t && t.startsWith('ExponentPushToken'));
  if (validTokens.length === 0) return;

  const messages = validTokens.map((to) => ({
    to,
    channelId: 'vyapari-trips',
    title: `🚛 नई ट्रिप — ${fromCity} → ${toCity}`,
    body: `${vyapariName} को ${goodsCategory} पहुँचाना है`,
    data: { type: 'vyapari_trip' },
    sound: 'default',
    priority: 'high',
  }));

  const chunks: typeof messages[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  await Promise.all(
    chunks.map((chunk) =>
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      }),
    ),
  );
}
