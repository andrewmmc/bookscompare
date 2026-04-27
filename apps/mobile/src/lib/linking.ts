import { Linking } from 'react-native';

export async function openExternalUrl(url: string): Promise<void> {
  await Linking.openURL(url);
}
