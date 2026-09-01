import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { setAnalyticsEnabled, track } from '../../analytics';
import { FAVOURITES_QUERY_KEY } from '../../api/favourites';
import { HISTORY_QUERY_KEY } from '../../api/history';
import { ListRow } from '../../components/ListRow';
import { resetAppData } from '../../lib/appData';
import { clearIcloudData, runInitialIcloudSync } from '../../lib/icloudSync';
import { updatePreference, usePreferences } from '../../lib/preferences';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TFunction } from 'i18next';
import type { BookTypePreference, OpenLinksIn, ThemeMode } from '../../lib/preferences';
import type { ThemeColors } from '../../theme/colors';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'Settings'>;

export function shouldShowIcloudSyncSetting(platformOS = Platform.OS): boolean {
  return platformOS === 'ios';
}

function openLinksLabel(t: TFunction, value: OpenLinksIn): string {
  return value === 'app'
    ? t('settings:settings.openLinksInApp')
    : t('settings:settings.openLinksInBrowser');
}

function themeModeLabel(t: TFunction, value: ThemeMode): string {
  switch (value) {
    case 'light':
      return t('settings:settings.appearanceLight');
    case 'dark':
      return t('settings:settings.appearanceDark');
    case 'system':
    default:
      return t('settings:settings.appearanceSystem');
  }
}

function bookTypePreferenceLabel(t: TFunction, values: BookTypePreference[]): string {
  if (values.length === 0 || values.length === 2) {
    return t('settings:settings.bookTypeAll');
  }

  return values[0] === 'physical'
    ? t('settings:settings.bookTypePhysical')
    : t('settings:settings.bookTypeEbook');
}

interface SettingsRowProps {
  icon: Parameters<typeof ListRow>[0]['icon'];
  iconBackground: string;
  title: string;
  value: string;
  onPress: () => void;
  hideChevron?: boolean;
  isLast?: boolean;
}

function SettingsRow({
  icon,
  iconBackground,
  title,
  value,
  onPress,
  hideChevron = false,
  isLast = true,
}: SettingsRowProps) {
  return (
    <ListRow
      icon={icon}
      iconBackground={iconBackground}
      title={title}
      value={value}
      onPress={onPress}
      hideChevron={hideChevron}
      isLast={isLast}
    />
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('settings');
  const preferences = usePreferences();
  const queryClient = useQueryClient();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const storePrefsValue =
    preferences.preferredSources.length === 0
      ? t('settings:storePreferences.settingsRowValueAll')
      : t('settings:storePreferences.settingsRowValue', {
          count: preferences.preferredSources.length,
        });
  const showIcloudSync = shouldShowIcloudSyncSetting();
  const resetAllData = useMutation({
    mutationFn: async () => {
      if (preferences.icloudSyncEnabled) {
        await clearIcloudData();
      }

      return resetAppData();
    },
    onSuccess: (result) => {
      queryClient.setQueryData(HISTORY_QUERY_KEY, result.history);
      queryClient.setQueryData(FAVOURITES_QUERY_KEY, result.favourites);
    },
  });

  const toggleIcloudSync = () => {
    const next = !preferences.icloudSyncEnabled;
    track('settings_change', { key: 'icloudSyncEnabled', value: String(next) });
    void Promise.resolve(updatePreference('icloudSyncEnabled', next)).then((updatedPreferences) => {
      if (!updatedPreferences?.icloudSyncEnabled) {
        return;
      }

      void runInitialIcloudSync()
        .then((syncResult) => {
          if (syncResult.history !== undefined) {
            queryClient.setQueryData(HISTORY_QUERY_KEY, syncResult.history);
          }
          if (syncResult.favourites !== undefined) {
            queryClient.setQueryData(FAVOURITES_QUERY_KEY, syncResult.favourites);
          }
        })
        .catch(() => undefined);
    });
  };

  const toggleAnalytics = () => {
    const next = !preferences.analyticsEnabled;
    void updatePreference('analyticsEnabled', next).then(() => setAnalyticsEnabled(next));
  };

  const confirmResetAllData = () => {
    track('settings_click_reset_all_data');
    Alert.alert(
      t('settings:settings.resetAllDataConfirmTitle'),
      preferences.icloudSyncEnabled
        ? t('settings:settings.resetAllDataConfirmMessageWithIcloud')
        : t('settings:settings.resetAllDataConfirmMessage'),
      [
        { text: t('settings:settings.cancelAction'), style: 'cancel' },
        {
          text: t('settings:settings.resetAllDataConfirmAction'),
          style: 'destructive',
          onPress: () => {
            track('settings_reset_all_data_confirm');
            resetAllData.mutate();
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: tabBarHeight + spacing.xl },
      ]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.sectionHeader}>{t('settings:settings.generalSection')}</Text>
      <View style={styles.group}>
        <SettingsRow
          icon="language-outline"
          iconBackground={colors.accentDeep}
          title={t('settings.language')}
          value={
            preferences.languagePreference === 'en'
              ? t('settings.languageEnglish')
              : preferences.languagePreference === 'zh-TW'
                ? t('settings.languageTraditionalChinese')
                : t('settings.languageSystem')
          }
          onPress={() => navigation.navigate('LanguagePreferences')}
          isLast={false}
        />
        <SettingsRow
          icon="link-outline"
          iconBackground={colors.accent}
          title={t('settings:settings.openLinksIn')}
          value={openLinksLabel(t, preferences.openLinksIn)}
          onPress={() => navigation.navigate('OpenLinksPreferences')}
        />
      </View>

      <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
        {t('settings:settings.appearanceSection')}
      </Text>
      <View style={styles.group}>
        <SettingsRow
          icon="contrast-outline"
          iconBackground={colors.accentDeep}
          title={t('settings:settings.appearance')}
          value={themeModeLabel(t, preferences.themeMode)}
          onPress={() => navigation.navigate('ThemePreferences')}
        />
      </View>

      <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
        {t('settings:settings.contentSection')}
      </Text>
      <View style={styles.group}>
        <SettingsRow
          icon="library-outline"
          iconBackground={colors.accent}
          title={t('settings:settings.bookType')}
          value={bookTypePreferenceLabel(t, preferences.preferredBookTypes)}
          onPress={() => navigation.navigate('BookTypePreferences')}
          isLast={false}
        />
        <SettingsRow
          icon="storefront-outline"
          iconBackground={colors.success}
          title={t('settings:storePreferences.settingsRow')}
          value={storePrefsValue}
          onPress={() => navigation.navigate('StorePreferences')}
          isLast
        />
      </View>

      {showIcloudSync ? (
        <>
          <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
            {t('settings:settings.syncSection')}
          </Text>
          <View style={styles.group}>
            <SettingsRow
              icon="cloud-outline"
              iconBackground={colors.accentDeep}
              title={t('settings:settings.icloudSync')}
              value={
                preferences.icloudSyncEnabled
                  ? t('settings:settings.icloudSyncOn')
                  : t('settings:settings.icloudSyncOff')
              }
              onPress={toggleIcloudSync}
              hideChevron
              isLast
            />
          </View>
        </>
      ) : null}

      <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
        {t('settings:settings.dataSection')}
      </Text>
      <View style={styles.group}>
        <SettingsRow
          icon="analytics-outline"
          iconBackground={colors.accentDeep}
          title={t('settings:settings.analytics')}
          value={
            preferences.analyticsEnabled
              ? t('settings:settings.analyticsOn')
              : t('settings:settings.analyticsOff')
          }
          onPress={toggleAnalytics}
          hideChevron
          isLast={false}
        />
        <ListRow
          icon="trash-outline"
          title={t('settings:settings.resetAllData')}
          onPress={confirmResetAllData}
          destructive
          hideChevron
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
