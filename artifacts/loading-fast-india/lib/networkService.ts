import * as Network from 'expo-network';

export type NetworkState = 'online' | 'offline' | 'unknown';

let networkState: NetworkState = 'unknown';
const listeners: Array<(state: NetworkState) => void> = [];
let checkInterval: ReturnType<typeof setInterval> | null = null;

async function check(): Promise<NetworkState> {
  try {
    const state = await Network.getNetworkStateAsync();
    const next: NetworkState = state.isConnected && state.isInternetReachable ? 'online' : 'offline';
    if (next !== networkState) {
      networkState = next;
      listeners.forEach((fn) => fn(networkState));
    }
    return networkState;
  } catch {
    return 'unknown';
  }
}

export async function initNetworkMonitor(): Promise<NetworkState> {
  const result = await check();
  if (!checkInterval) {
    checkInterval = setInterval(check, 5000);
  }
  return result;
}

export function stopNetworkMonitor(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  listeners.length = 0;
}

export function addNetworkListener(fn: (state: NetworkState) => void): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

export function getNetworkState(): NetworkState {
  return networkState;
}

export async function checkNetwork(): Promise<NetworkState> {
  return check();
}
