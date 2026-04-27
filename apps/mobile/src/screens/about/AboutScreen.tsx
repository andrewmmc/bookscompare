import { Image, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';

import logo from '../../../assets/logo.png';
import packageJson from '../../../package.json';
import { ListRow } from '../../components/ListRow';
import { track } from '../../analytics';
import { openExternalUrl } from '../../lib/linking';
import { strings } from '../../i18n/strings';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AboutStackParamList } from '../../navigation/types';

const appVersion = packageJson.version;

type Props = NativeStackScreenProps<AboutStackParamList, 'About'>;

const aboutItems = [
  {
    title: '使用條款及私隱政策',
    icon: 'document-text',
    url: 'https://bookscompare.mmc.dev/privacy',
    inApp: true,
  },
  {
    title: '免責聲明',
    icon: 'shield-checkmark',
    url: 'https://bookscompare.mmc.dev/declaration',
    inApp: true,
  },
  {
    title: '提交意見',
    icon: 'chatbox-ellipses',
    url: 'https://bookscompare.mmc.dev/feedback',
    inApp: true,
  },
  {
    title: '(c) 2026 Andrew Mok',
    icon: 'home',
    url: 'https://andrewmmc.com',
    inApp: false,
  },
] as const;

export function AboutScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Surface elevation={1} style={styles.heroCard}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.title}>{strings.about.title}</Text>
        <Text style={styles.version}>版本 v{appVersion}</Text>
      </Surface>

      <Surface elevation={1} style={styles.listCard}>
        {aboutItems.map((item) => (
          <ListRow
            key={item.title}
            icon={item.icon}
            onPress={() => {
              track('about_open_link', { title: item.title });

              if (item.inApp) {
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
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.canvas,
  },
  heroCard: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: 30,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 24,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.ink,
    marginTop: spacing.md,
  },
  version: {
    ...typography.caption,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  listCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
  },
});
