import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

import { track } from '../../analytics';
import { ToggleListScreen } from '../../components/PreferenceListScreen';
import { syncPreferencesToIcloud } from '../../lib/icloudSync';
import { updatePreference, usePreferences } from '../../lib/preferences';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookTypePreference } from '../../lib/preferences';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'BookTypePreferences'>;

export function BookTypePreferencesScreen(_props: Props) {
  const { t } = useTranslation('settings');
  const bookTypeOptions: Array<{ value: BookTypePreference; label: string }> = [
    { value: 'physical', label: t('settings:settings.bookTypePhysical') },
    { value: 'ebook', label: t('settings:settings.bookTypeEbook') },
  ];
  const { preferredBookTypes } = usePreferences();
  const preferredSet = useMemo(() => new Set(preferredBookTypes), [preferredBookTypes]);

  const toggleBookType = (nextValue: BookTypePreference) => {
    const nextPreference = preferredSet.has(nextValue)
      ? preferredBookTypes.filter((value) => value !== nextValue)
      : [...preferredBookTypes, nextValue];

    track('settings_change', { key: 'preferredBookTypes', value: nextPreference.join(',') });
    void Promise.resolve(updatePreference('preferredBookTypes', nextPreference)).then(
      (updatedPreferences) => {
        if (updatedPreferences) {
          void syncPreferencesToIcloud(updatedPreferences);
        }
      }
    );
  };

  return (
    <ToggleListScreen
      description={t('settings:settings.bookTypeDescription')}
      options={bookTypeOptions}
      isSelected={(value) => preferredSet.has(value)}
      onToggle={toggleBookType}
      testIDPrefix="book-type-toggle"
    />
  );
}
