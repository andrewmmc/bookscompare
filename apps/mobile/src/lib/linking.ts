import { Linking } from 'react-native';

export async function openExternalUrl(url: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
