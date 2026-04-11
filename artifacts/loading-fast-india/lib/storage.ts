import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: 'lfi_current_user',
  USER_ROLE: 'lfi_user_role',
  DRIVERS: 'lfi_drivers',
  VYAPARIS: 'lfi_vyaparis',
  VEHICLES: 'lfi_vehicles',
  TRIPS: 'lfi_trips',
  BILTIES: 'lfi_bilties',
  COMPLAINTS: 'lfi_complaints',
  CHAT_MESSAGES: 'lfi_chat_messages',
  RATINGS: 'lfi_ratings',
};

export async function getData<T>(key: string): Promise<T | null> {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function setData(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export async function getList<T>(key: string): Promise<T[]> {
  return (await getData<T[]>(key)) ?? [];
}

export async function addToList<T extends { id: string }>(key: string, item: T): Promise<void> {
  const list = await getList<T>(key);
  list.push(item);
  await setData(key, list);
}

export async function updateInList<T extends { id: string }>(
  key: string,
  id: string,
  updates: Partial<T>
): Promise<void> {
  const list = await getList<T>(key);
  const idx = list.findIndex((i) => i.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
    await setData(key, list);
  }
}

export async function removeFromList<T extends { id: string }>(
  key: string,
  id: string
): Promise<void> {
  const list = await getList<T>(key);
  await setData(key, list.filter((i) => i.id !== id));
}

export { KEYS };
