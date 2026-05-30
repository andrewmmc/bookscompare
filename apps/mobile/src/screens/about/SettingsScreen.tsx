import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ListRow } from '../../components/ListRow';
import { strings } from '../../i18n/strings';
import { usePreferences } from '../../lib/preferences';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookTypePreference, OpenLinksIn, ThemeMode } from '../../lib/preferences';
import type { ThemeColors } from '../../theme/colors';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'Settings'>;

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
  const preferences = usePreferences();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
          onPress={() => navigation.navigate('OpenLinksPreferences')}
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
          onPress={() => navigation.navigate('ThemePreferences')}
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
