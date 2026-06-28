import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initAnalytics, registerAnalyticsProperties } from './analytics';
import { FAVOURITES_QUERY_KEY } from './api/favourites';
import { HISTORY_QUERY_KEY } from './api/history';
import { strings } from './i18n/strings';
import { runInitialIcloudSync } from './lib/icloudSync';
import { usePreferencesLoaded } from './lib/preferences';
import { RootNavigator } from './navigation/RootNavigator';
import { spacing } from './theme/spacing';
import { paperThemeDark, paperThemeLight } from './theme/paperTheme';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';
import { typography } from './theme/typography';

const queryClient = new QueryClient();

function AppStartupSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.startupScreen, { backgroundColor: colors.canvas }]}>
      <View style={styles.startupContent}>
        <View style={[styles.startupIconCircle, { backgroundColor: colors.highlightSoft }]}>
          <View style={[styles.startupIconGlyph, { backgroundColor: colors.accent }]} />
        </View>
        <Text style={[styles.startupTitle, { color: colors.ink }]}>{strings.app.brand}</Text>
        <View style={styles.startupBody}>
          <View style={[styles.startupLeadBar, { backgroundColor: colors.highlightSoft }]} />
          <View style={[styles.startupLeadBarShort, { backgroundColor: colors.highlightSoft }]} />
          <View style={styles.startupInputRow}>
            <View style={[styles.startupInput, { backgroundColor: colors.controlBackground }]} />
            <View
              style={[styles.startupCircleButton, { backgroundColor: colors.controlBackground }]}
            />
          </View>
          <View style={[styles.startupButton, { backgroundColor: colors.accent }]} />
        </View>
      </View>
      <Text style={[styles.startupLabel, { color: colors.inkMuted }]}>
        {strings.loading.defaultLabel}
      </Text>
    </View>
  );
}

function AppContent() {
  const { colors, scheme } = useTheme();
  const paperTheme = scheme === 'dark' ? paperThemeDark : paperThemeLight;
  const preferencesLoaded = usePreferencesLoaded();
  const [icloudSyncReady, setIcloudSyncReady] = useState(false);

  useEffect(() => {
    initAnalytics();
    registerAnalyticsProperties({ themeScheme: scheme });
  }, [scheme]);

  useEffect(() => {
    if (!preferencesLoaded) {
      setIcloudSyncReady(false);
      return;
    }

    let cancelled = false;
    setIcloudSyncReady(false);
    void runInitialIcloudSync()
      .then((syncResult) => {
        if (cancelled) {
          return;
        }
        if (syncResult.history) {
          queryClient.setQueryData(HISTORY_QUERY_KEY, syncResult.history);
        }
        if (syncResult.favourites) {
          queryClient.setQueryData(FAVOURITES_QUERY_KEY, syncResult.favourites);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIcloudSyncReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [preferencesLoaded]);

  const navigationTheme = useMemo(
    () => ({
      ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
      colors: {
        ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
        background: paperTheme.colors.background,
        card: paperTheme.colors.elevation.level2,
        border: paperTheme.colors.outlineVariant,
        primary: colors.navigationAction,
        text: paperTheme.colors.onSurface,
        notification: paperTheme.colors.secondary,
      },
    }),
    [colors.navigationAction, paperTheme, scheme]
  );

  return (
    <PaperProvider theme={paperTheme}>
      <ActionSheetProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          {preferencesLoaded && icloudSyncReady ? <RootNavigator /> : <AppStartupSkeleton />}
        </NavigationContainer>
      </ActionSheetProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  startupScreen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  startupContent: {
    alignItems: 'center',
  },
  startupIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startupIconGlyph: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  startupTitle: {
    ...typography.title2,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  startupBody: {
    width: '100%',
    maxWidth: 360,
    marginTop: spacing.xxl,
  },
  startupLeadBar: {
    height: 18,
    borderRadius: 9,
    width: '100%',
  },
  startupLeadBarShort: {
    height: 18,
    borderRadius: 9,
    width: '72%',
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  startupInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  startupInput: {
    flex: 1,
    height: 56,
    borderRadius: 16,
  },
  startupCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  startupButton: {
    height: 52,
    borderRadius: 16,
    marginTop: spacing.lg,
  },
  startupLabel: {
    ...typography.footnote,
    textAlign: 'center',
  },
});
