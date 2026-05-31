import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadJsonValue<T>(
  key: string,
  fallback: T,
  parseValue: (value: unknown) => T
): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return parseValue(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

export async function saveJsonValue(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
