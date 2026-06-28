import { Platform } from 'react-native';

interface IcloudStorageModule {
  set(key: string, value: string): void;
  getString(key: string): string | null;
  remove(key: string): void;
  getAllKeys(): string[];
}

interface IcloudStorageModuleImport {
  default?: IcloudStorageModule;
  set?: IcloudStorageModule['set'];
  getString?: IcloudStorageModule['getString'];
  remove?: IcloudStorageModule['remove'];
  getAllKeys?: IcloudStorageModule['getAllKeys'];
}

declare const require: (id: string) => IcloudStorageModuleImport;

let cachedStorage: IcloudStorageModule | null | undefined;

function loadStorage(): IcloudStorageModule | null {
  if (Platform.OS !== 'ios') {
    return null;
  }

  if (cachedStorage !== undefined) {
    return cachedStorage;
  }

  try {
    const module = require('expo-icloud-storage');
    cachedStorage = module.default ?? (isIcloudStorageModule(module) ? module : null);
  } catch {
    cachedStorage = null;
  }

  return cachedStorage ?? null;
}

function isIcloudStorageModule(value: IcloudStorageModuleImport): value is IcloudStorageModule {
  return (
    typeof value.set === 'function' &&
    typeof value.getString === 'function' &&
    typeof value.remove === 'function' &&
    typeof value.getAllKeys === 'function'
  );
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
