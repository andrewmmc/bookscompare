import { track } from '../../analytics';
import { SelectionListScreen } from '../../components/PreferenceListScreen';
import { strings } from '../../i18n/strings';
import { updatePreference, usePreferences } from '../../lib/preferences';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ThemeMode } from '../../lib/preferences';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'ThemePreferences'>;

const options: Array<{ value: ThemeMode; label: string }> = [
  { value: 'system', label: strings.settings.appearanceSystem },
  { value: 'light', label: strings.settings.appearanceLight },
  { value: 'dark', label: strings.settings.appearanceDark },
];

export function ThemePreferencesScreen(_props: Props) {
  const { themeMode } = usePreferences();

  const selectOption = (value: ThemeMode) => {
    if (value === themeMode) {
      return;
    }

    track('settings_change', { key: 'themeMode', value });
    void updatePreference('themeMode', value);
  };

  return (
    <SelectionListScreen
      description={strings.settings.appearanceDescription}
      options={options}
      selectedValue={themeMode}
      onSelect={selectOption}
      testIDPrefix="theme-option"
    />
  );
}
