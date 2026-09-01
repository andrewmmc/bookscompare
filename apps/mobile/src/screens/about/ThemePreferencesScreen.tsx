import { useTranslation } from 'react-i18next';
import { track } from '../../analytics';
import { SelectionListScreen } from '../../components/PreferenceListScreen';
import { syncPreferencesToIcloud } from '../../lib/icloudSync';
import { updatePreference, usePreferences } from '../../lib/preferences';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ThemeMode } from '../../lib/preferences';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'ThemePreferences'>;

export function ThemePreferencesScreen(_props: Props) {
  const { t } = useTranslation('settings');
  const options: Array<{ value: ThemeMode; label: string }> = [
    { value: 'system', label: t('settings:settings.appearanceSystem') },
    { value: 'light', label: t('settings:settings.appearanceLight') },
    { value: 'dark', label: t('settings:settings.appearanceDark') },
  ];
  const { themeMode } = usePreferences();

  const selectOption = (value: ThemeMode) => {
    if (value === themeMode) {
      return;
    }

    track('settings_change', { key: 'themeMode', value });
    void Promise.resolve(updatePreference('themeMode', value)).then((updatedPreferences) => {
      if (updatedPreferences) {
        void syncPreferencesToIcloud(updatedPreferences);
      }
    });
  };

  return (
    <SelectionListScreen
      description={t('settings:settings.appearanceDescription')}
      options={options}
      selectedValue={themeMode}
      onSelect={selectOption}
      testIDPrefix="theme-option"
    />
  );
}
