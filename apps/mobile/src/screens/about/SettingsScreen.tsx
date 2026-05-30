import { useActionSheet } from '@expo/react-native-action-sheet';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ListRow } from '../../components/ListRow';
import { track } from '../../analytics';
import { strings } from '../../i18n/strings';
import { updatePreference, usePreferences } from '../../lib/preferences';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookTypePreference, OpenLinksIn, ThemeMode } from '../../lib/preferences';
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

function bookTypePreferenceLabel(values: BookTypePreference[]): string {
  if (values.length === 0 || values.length === 2) {
    return strings.settings.bookTypeAll;
  }

  return values[0] === 'physical'
    ? strings.settings.bookTypePhysical
    : strings.settings.bookTypeEbook;
}

interface SettingsRowProps {
  icon: Parameters<typeof ListRow>[0]['icon'];
  iconBackground: string;
  title: string;
  value: string;
  onPress: () => void;
  isLast?: boolean;
}

function SettingsRow({
  icon,
  iconBackground,
  title,
  value,
  onPress,
  isLast = true,
}: SettingsRowProps) {
  return (
    <ListRow
      icon={icon}
      iconBackground={iconBackground}
      title={title}
      value={value}
      onPress={onPress}
      isLast={isLast}
    />
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const preferences = usePreferences();
  const tabBarHeight = useBottomTabBarHeight();
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

  const storePrefsValue =
    preferences.preferredSources.length === 0
      ? strings.storePreferences.settingsRowValueAll
      : strings.storePreferences.settingsRowValue(preferences.preferredSources.length);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: tabBarHeight + spacing.xl },
      ]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.sectionHeader}>{strings.settings.generalSection}</Text>
      <View style={styles.group}>
        <SettingsRow
          icon="link-outline"
          iconBackground={colors.accent}
          title={strings.settings.openLinksIn}
          value={openLinksLabel(preferences.openLinksIn)}
          onPress={showOpenLinksPicker}
        />
      </View>

      <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
        {strings.settings.appearanceSection}
      </Text>
      <View style={styles.group}>
        <SettingsRow
          icon="contrast-outline"
          iconBackground={colors.accentDeep}
          title={strings.settings.appearance}
          value={themeModeLabel(preferences.themeMode)}
          onPress={showThemeModePicker}
        />
      </View>

      <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
        {strings.settings.contentSection}
      </Text>
      <View style={styles.group}>
        <SettingsRow
          icon="library-outline"
          iconBackground={colors.accent}
          title={strings.settings.bookType}
          value={bookTypePreferenceLabel(preferences.preferredBookTypes)}
          onPress={() => navigation.navigate('BookTypePreferences')}
          isLast={false}
        />
        <SettingsRow
          icon="storefront-outline"
          iconBackground={colors.success}
          title={strings.storePreferences.settingsRow}
          value={storePrefsValue}
          onPress={() => navigation.navigate('StorePreferences')}
          isLast
        />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.groupedBackground,
    },
    contentContainer: {
      paddingTop: spacing.md,
    },
    sectionHeader: {
      ...typography.caption,
      color: colors.inkMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: spacing.md + spacing.xs,
      paddingBottom: spacing.xs,
    },
    sectionHeaderSpaced: {
      paddingTop: spacing.lg,
    },
    group: {
      marginHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 14,
      overflow: 'hidden',
    },
  });
