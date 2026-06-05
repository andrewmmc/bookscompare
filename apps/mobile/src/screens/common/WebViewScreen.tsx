import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { track } from '../../analytics';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { strings } from '../../i18n/strings';
import { openExternalUrl } from '../../lib/linking';
import { useTheme } from '../../theme/ThemeProvider';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ThemeColors } from '../../theme/colors';
import type {
  AboutStackParamList,
  FavouritesStackParamList,
  HomeStackParamList,
} from '../../navigation/types';

type Props =
  | NativeStackScreenProps<HomeStackParamList, 'SearchWebView'>
  | NativeStackScreenProps<FavouritesStackParamList, 'SearchWebView'>
  | NativeStackScreenProps<AboutStackParamList, 'AboutWebView'>;

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

export function WebViewScreen({ navigation, route }: Props) {
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useBottomTabBarHeight();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const injectedJavaScript = useMemo(
    () => `
      (function () {
        document.documentElement.style.colorScheme = '${scheme}';
        var style = document.getElementById('bookscompare-color-scheme');
        if (!style) {
          style = document.createElement('style');
          style.id = 'bookscompare-color-scheme';
          (document.head || document.documentElement).appendChild(style);
        }
        style.textContent = ':root { color-scheme: ${scheme}; } body { background-color: ${colors.canvas}; }';
      })();
      true;
    `,
    [colors.canvas, scheme]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: route.params.title,
      ...(route.params.showOptions
        ? {
            headerRight: () => (
              <Pressable
                accessibilityLabel={strings.webview.shareAccessibility}
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => {
                  track('webview_share', { title: route.params.title });
                  void Share.share({
                    title: route.params.title,
                    message: route.params.url,
                    url: route.params.url,
                  }).catch(() => {
                    // Fall back to opening the URL externally if sharing is unavailable.
                    void openExternalUrl(route.params.url);
                  });
                }}
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.headerButtonPressed,
                ]}
              >
                <Ionicons color={colors.ink} name="share-outline" size={22} />
              </Pressable>
            ),
          }
        : {}),
    });
  }, [navigation, route.params.showOptions, route.params.title, route.params.url, colors, styles]);

  if (loadState === 'not-found') {
    return (
      <EmptyState
        icon="document-text"
        title={strings.webview.notFoundTitle}
        description={strings.webview.notFoundDescription}
        actionLabel={strings.webview.notFoundAction}
        onAction={() => void openExternalUrl(route.params.url)}
        containerStyle={styles.container}
      />
    );
  }

  if (loadState === 'error') {
    return (
      <EmptyState
        icon="cloud-offline"
        title={strings.webview.errorTitle}
        description={strings.webview.errorDescription}
        actionLabel={strings.webview.errorAction}
        onAction={() => void openExternalUrl(route.params.url)}
        containerStyle={styles.container}
      />
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        onError={() => setLoadState('error')}
        onHttpError={({ nativeEvent }) => {
          setLoadState(nativeEvent.statusCode === 404 ? 'not-found' : 'error');
        }}
        onLoadEnd={() => {
          setLoadState((currentState) => (currentState === 'loading' ? 'ready' : currentState));
        }}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        injectedJavaScript={injectedJavaScript}
        forceDarkOn={scheme === 'dark'}
        source={{ uri: route.params.url }}
        style={[styles.webview, { marginBottom: tabBarHeight }]}
      />
      {loadState === 'loading' ? <LoadingOverlay label={strings.webview.loadingLabel} /> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    webview: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    headerButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButtonPressed: {
      opacity: 0.4,
    },
  });
