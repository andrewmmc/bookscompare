import { useTranslation } from 'react-i18next';

import { track } from '../../analytics';
import { SelectionListScreen } from '../../components/PreferenceListScreen';
import { updatePreference, usePreferences } from '../../lib/preferences';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LanguagePreference } from '../../i18n/locale';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'LanguagePreferences'>;

export function LanguagePreferencesScreen(_props: Props) {
  const { t } = useTranslation('settings');
  const { languagePreference = 'system' } = usePreferences();
  const options: Array<{ value: LanguagePreference; label: string }> = [
    { value: 'system', label: t('settings.languageSystem') },
    { value: 'en', label: t('settings.languageEnglish') },
    { value: 'zh-TW', label: t('settings.languageTraditionalChinese') },
  ];

  const selectOption = (value: LanguagePreference) => {
    if (value === languagePreference) {
      return;
    }

    track('settings_change', { key: 'languagePreference', value });
    void updatePreference('languagePreference', value);
  };

  return (
    <SelectionListScreen
      description={t('settings.languageDescription')}
      options={options}
      selectedValue={languagePreference}
      onSelect={selectOption}
      testIDPrefix="language-option"
    />
  );
}
