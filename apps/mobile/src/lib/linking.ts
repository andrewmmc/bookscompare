import { Alert, Linking } from 'react-native';

import { strings } from '../i18n/strings';

function showExternalLinkErrorAlert() {
  Alert.alert(strings.externalLink.errorTitle, strings.externalLink.errorDescription, [
    { text: strings.externalLink.errorAction },
  ]);
}

export function getSecureWebOrigin(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' ? parsedUrl.origin : null;
  } catch {
    return null;
  }
}

export async function openExternalUrl(url: string): Promise<boolean> {
  try {
    if (!getSecureWebOrigin(url)) {
      showExternalLinkErrorAlert();
      return false;
    }

    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      showExternalLinkErrorAlert();
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch {
    showExternalLinkErrorAlert();
    return false;
  }
}
