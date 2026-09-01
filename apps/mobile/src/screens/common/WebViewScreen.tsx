import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { track } from '../../analytics';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { getSecureWebOrigin, openExternalUrl } from '../../lib/linking';
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
  const { t } = useTranslation('common');
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useBottomTabBarHeight();
  const initialOrigin = useMemo(() => getSecureWebOrigin(route.params.url), [route.params.url]);
  const [loadState, setLoadState] = useState<LoadState>(initialOrigin ? 'loading' : 'error');
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
                accessibilityLabel={t('common:webview.shareAccessibility')}
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => {
                  track('webview_share');
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
                <Ionicons color={colors.navigationAction} name="share-outline" size={22} />
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
        title={t('common:webview.notFoundTitle')}
        description={t('common:webview.notFoundDescription')}
        actionLabel={t('common:webview.notFoundAction')}
        onAction={() => void openExternalUrl(route.params.url)}
        containerStyle={styles.container}
      />
    );
  }

  if (loadState === 'error') {
    return (
      <EmptyState
        icon="cloud-offline"
        title={t('common:webview.errorTitle')}
        description={t('common:webview.errorDescription')}
        actionLabel={t('common:webview.errorAction')}
        onAction={() => void openExternalUrl(route.params.url)}
        containerStyle={styles.container}
      />
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        onShouldStartLoadWithRequest={(request) => {
          if (request.url === 'about:blank') {
            return true;
          }

          const requestOrigin = getSecureWebOrigin(request.url);
          if (requestOrigin === initialOrigin) {
            return true;
          }

          if (requestOrigin) {
            void openExternalUrl(request.url);
          }
          return false;
        }}
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
      {loadState === 'loading' ? <LoadingOverlay label={t('common:webview.loadingLabel')} /> : null}
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
