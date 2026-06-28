import { useMemo } from 'react';

import { BOOK_SOURCES } from '@bookscompare/contracts';

import { track } from '../../analytics';
import { ToggleListScreen } from '../../components/PreferenceListScreen';
import { strings } from '../../i18n/strings';
import { syncPreferencesToIcloud } from '../../lib/icloudSync';
import { updatePreference, usePreferences } from '../../lib/preferences';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookSourceId } from '@bookscompare/contracts';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'StorePreferences'>;

const storeOptions: Array<{ value: BookSourceId; label: string }> = BOOK_SOURCES.map((source) => ({
  value: source.id,
  label: source.name,
}));

export function StorePreferencesScreen(_props: Props) {
  const { preferredSources } = usePreferences();
  const preferredSet = useMemo(() => new Set(preferredSources), [preferredSources]);

  const toggleSource = (sourceId: BookSourceId) => {
    const next = preferredSet.has(sourceId)
      ? preferredSources.filter((id) => id !== sourceId)
      : [...preferredSources, sourceId];

    track('settings_change', { key: 'preferredSources', value: next.join(',') });
    void Promise.resolve(updatePreference('preferredSources', next)).then(syncPreferencesToIcloud);
  };

  return (
    <ToggleListScreen
      description={strings.storePreferences.description}
      options={storeOptions}
      isSelected={(value) => preferredSet.has(value)}
      onToggle={toggleSource}
      testIDPrefix="store-toggle"
    />
  );
}
