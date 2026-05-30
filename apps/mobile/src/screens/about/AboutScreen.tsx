import Constants from 'expo-constants';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import logo from '../../../assets/logo.png';
import packageJson from '../../../package.json';
import { ListRow } from '../../components/ListRow';
import { track } from '../../analytics';
import { openExternalUrl } from '../../lib/linking';
import { usePreferences } from '../../lib/preferences';
import { strings } from '../../i18n/strings';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ThemeColors } from '../../theme/colors';
import type { AboutStackParamList } from '../../navigation/types';

const appVersion = packageJson.version;
const buildNumber = Constants.nativeBuildVersion ?? '';

type Props = NativeStackScreenProps<AboutStackParamList, 'About'>;

const aboutItems = [
  {
    key: 'privacy',
    title: strings.about.items.privacy,
    icon: 'shield-checkmark',
    url: 'https://bookscompare.mmc.dev/privacy?embed=1',
  },
  {
    key: 'feedback',
    title: strings.about.items.feedback,
    icon: 'chatbubble-ellipses',
    url: 'https://github.com/andrewmmc/bookscompare/issues',
  },
  {
    key: 'copyright',
    title: strings.about.items.copyright,
    icon: 'globe',
    url: 'https://andrewmmc.com',
  },
] as const;

export function AboutScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const preferences = usePreferences();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: tabBarHeight + spacing.xl },
      ]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.hero}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.title}>{strings.about.title}</Text>
        <Text style={styles.version}>{strings.about.version(appVersion, buildNumber)}</Text>
      </View>

      <View style={styles.group}>
        <ListRow
          icon="settings-outline"
          iconBackground={colors.accent}
          onPress={() => {
            track('about_open_settings');
            navigation.navigate('Settings');
          }}
          title={strings.navigation.settings}
          isLast
        />
      </View>

      <View style={[styles.group, styles.groupSpaced]}>
        {aboutItems.map((item, index) => (
          <ListRow
            key={item.key}
            icon={item.icon}
            iconBackground={colors.accent}
            onPress={() => {
              track('about_open_link', { key: item.key });

              if (preferences.openLinksIn === 'app') {
                navigation.navigate('AboutWebView', {
                  title: item.title,
                  url: item.url,
                });
                return;
              }

              void openExternalUrl(item.url);
            }}
            title={item.title}
            isLast={index === aboutItems.length - 1}
          />
        ))}
      </View>

      <Text style={styles.disclaimer}>{strings.about.disclaimer}</Text>
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
    hero: {
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
    },
    // iOS squircle-ish app icon look (continuous corner approx with high radius on a square).
    logo: {
      width: 96,
      height: 96,
      borderRadius: 22,
    },
    title: {
      ...typography.title3,
      color: colors.ink,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    version: {
      ...typography.footnote,
      color: colors.inkMuted,
      marginTop: spacing.xxs,
    },
    group: {
      marginHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 14,
      overflow: 'hidden',
    },
    groupSpaced: {
      marginTop: spacing.lg,
    },
    disclaimer: {
      ...typography.footnote,
      color: colors.inkMuted,
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      textAlign: 'center',
    },
  });
