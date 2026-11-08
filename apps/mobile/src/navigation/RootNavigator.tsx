import { useTranslation } from 'react-i18next';
import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '../theme/ThemeProvider';

/**
 * System tab bar (Liquid Glass on iOS 26+). iOS places it along the bottom or, on iPhone Duo,
 * in the side rail, and insets each tab's content for wherever it currently sits.
 */
export function RootNavigator() {
  const { t } = useTranslation('navigation');
  const { colors } = useTheme();

  return (
    <NativeTabs tintColor={colors.accent}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>{t('navigation:tabs.home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="favourites">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'heart', selected: 'heart.fill' }}
          md={{ default: 'favorite_border', selected: 'favorite' }}
        />
        <NativeTabs.Trigger.Label>{t('navigation:tabs.favourites')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="about">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'info.circle', selected: 'info.circle.fill' }}
          md={{ default: 'info_outline', selected: 'info' }}
        />
        <NativeTabs.Trigger.Label>{t('navigation:tabs.about')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
