import { track } from '../../analytics';
import { SelectionListScreen } from '../../components/PreferenceListScreen';
import { strings } from '../../i18n/strings';
import { syncPreferencesToIcloud } from '../../lib/icloudSync';
import { updatePreference, usePreferences } from '../../lib/preferences';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OpenLinksIn } from '../../lib/preferences';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'OpenLinksPreferences'>;

const options: Array<{ value: OpenLinksIn; label: string }> = [
  { value: 'app', label: strings.settings.openLinksInApp },
  { value: 'browser', label: strings.settings.openLinksInBrowser },
];

export function OpenLinksPreferencesScreen(_props: Props) {
  const { openLinksIn } = usePreferences();

  const selectOption = (value: OpenLinksIn) => {
    if (value === openLinksIn) {
      return;
    }

    track('settings_change', { key: 'openLinksIn', value });
    void Promise.resolve(updatePreference('openLinksIn', value)).then((updatedPreferences) => {
      if (updatedPreferences) {
        void syncPreferencesToIcloud(updatedPreferences);
      }
    });
  };

  return (
    <SelectionListScreen
      description={strings.settings.openLinksDescription}
      options={options}
      selectedValue={openLinksIn}
      onSelect={selectOption}
      testIDPrefix="open-links-option"
    />
  );
}
