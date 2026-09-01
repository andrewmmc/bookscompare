import { Alert, Linking } from 'react-native';

import { i18n } from '../i18n';

function showExternalLinkErrorAlert() {
  Alert.alert(
    i18n.t('externalLink.errorTitle', { ns: 'common' }),
    i18n.t('externalLink.errorDescription', { ns: 'common' }),
    [{ text: i18n.t('externalLink.errorAction', { ns: 'common' }) }]
  );
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
