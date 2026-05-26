import { useActionSheet } from '@expo/react-native-action-sheet';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { track } from '../../analytics';
import { ListRow } from '../../components/ListRow';
import { strings } from '../../i18n/strings';
import { updatePreference, usePreferences } from '../../lib/preferences';
import { useTheme } from '../../theme/ThemeProvider';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OpenLinksIn, ThemeMode } from '../../lib/preferences';
import type { ThemeColors } from '../../theme/colors';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'Settings'>;

const openLinksOptions: OpenLinksIn[] = ['app', 'browser'];
const themeModeOptions: ThemeMode[] = ['system', 'light', 'dark'];

function openLinksLabel(value: OpenLinksIn): string {
  return value === 'app' ? strings.settings.openLinksInApp : strings.settings.openLinksInBrowser;
}

function themeModeLabel(value: ThemeMode): string {
  switch (value) {
    case 'light':
      return strings.settings.appearanceLight;
    case 'dark':
      return strings.settings.appearanceDark;
    case 'system':
    default:
      return strings.settings.appearanceSystem;
  }
}

export function SettingsScreen(_props: Props) {
  const { colors } = useTheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const preferences = usePreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const showOpenLinksPicker = () => {
    const options = [...openLinksOptions.map(openLinksLabel), strings.settings.cancelAction];
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions({ options, cancelButtonIndex }, (buttonIndex) => {
      if (buttonIndex === undefined || buttonIndex === cancelButtonIndex) {
        return;
      }

      const value = openLinksOptions[buttonIndex];
      if (!value || value === preferences.openLinksIn) {
        return;
      }

      track('settings_change', { key: 'openLinksIn', value });
      void updatePreference('openLinksIn', value);
    });
  };

  const showThemeModePicker = () => {
    const options = [...themeModeOptions.map(themeModeLabel), strings.settings.cancelAction];
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions({ options, cancelButtonIndex }, (buttonIndex) => {
      if (buttonIndex === undefined || buttonIndex === cancelButtonIndex) {
        return;
      }

      const value = themeModeOptions[buttonIndex];
      if (!value || value === preferences.themeMode) {
        return;
      }

      track('settings_change', { key: 'themeMode', value });
      void updatePreference('themeMode', value);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        <ListRow
          icon="open-outline"
          onPress={showOpenLinksPicker}
          title={`${strings.settings.openLinksIn}: ${openLinksLabel(preferences.openLinksIn)}`}
        />
        <ListRow
          icon="contrast-outline"
          onPress={showThemeModePicker}
          title={`${strings.settings.appearance}: ${themeModeLabel(preferences.themeMode)}`}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    list: {
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
  });
