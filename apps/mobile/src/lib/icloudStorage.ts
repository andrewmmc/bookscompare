import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

interface IcloudStorageModule {
  set(key: string, value: string): void;
  getString(key: string): string | null;
  remove(key: string): void;
  getAllKeys(): string[];
}

let cachedStorage: IcloudStorageModule | null | undefined;

function loadStorage(): IcloudStorageModule | null {
  if (Platform.OS !== 'ios') {
    return null;
  }

  if (cachedStorage !== undefined) {
    return cachedStorage;
  }

  try {
    cachedStorage = requireOptionalNativeModule<IcloudStorageModule>('ExpoAppleCloudStorage');
  } catch {
    cachedStorage = null;
  }

  return cachedStorage ?? null;
}

export function isIcloudStorageAvailable(): boolean {
  return loadStorage() !== null;
}

export function getIcloudString(key: string): string | null {
  try {
    return loadStorage()?.getString(key) ?? null;
  } catch {
    return null;
  }
}

export function setIcloudString(key: string, value: string): boolean {
  const storage = loadStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.set(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeIcloudValue(key: string): boolean {
  const storage = loadStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.remove(key);
    return true;
  } catch {
    return false;
  }
}
