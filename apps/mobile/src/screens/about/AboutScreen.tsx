import Constants from 'expo-constants';
import { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

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
    icon: 'information-circle',
    url: 'https://bookscompare.mmc.dev/privacy',
  },
  {
    key: 'feedback',
    title: strings.about.items.feedback,
    icon: 'star',
    url: 'https://github.com/andrewmmc/bookscompare/issues',
  },
  {
    key: 'copyright',
    title: strings.about.items.copyright,
    icon: 'home',
    url: 'https://andrewmmc.com',
  },
] as const;

export function AboutScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const preferences = usePreferences();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.title}>{strings.about.title}</Text>
        <Text style={styles.version}>{strings.about.version(appVersion, buildNumber)}</Text>
        <Text style={styles.disclaimer}>{strings.about.disclaimer}</Text>
      </View>

      <View style={styles.list}>
        <ListRow
          icon="settings-outline"
          onPress={() => {
            track('about_open_settings');
            navigation.navigate('Settings');
          }}
          title={strings.navigation.settings}
        />
        {aboutItems.map((item) => (
          <ListRow
            key={item.key}
            icon={item.icon}
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
          />
        ))}
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
    hero: {
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
    },
    logo: {
      width: 96,
      height: 96,
    },
    title: {
      ...typography.sectionTitle,
      color: colors.ink,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    version: {
      ...typography.caption,
      color: colors.ink,
      marginTop: spacing.xs,
    },
    disclaimer: {
      ...typography.caption,
      color: colors.inkMuted,
      marginTop: spacing.md,
      maxWidth: 360,
      textAlign: 'center',
    },
    list: {
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
  });
