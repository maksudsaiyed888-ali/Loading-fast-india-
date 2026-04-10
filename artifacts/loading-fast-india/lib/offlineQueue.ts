import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNetworkState } from './networkService';

interface QueueItem {
  id: string;
  action: string;
  data: unknown;
  timestamp: number;
}

const QUEUE_KEY = 'lfi_offline_queue';

export async function addToQueue(action: string, data: unknown): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue: QueueItem[] = raw ? JSON.parse(raw) : [];
    queue.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      action,
      data,
      timestamp: Date.now(),
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export async function getQueue(): Promise<QueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function getQueueLength(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

export function isOnline(): boolean {
  return getNetworkState() === 'online';
}
