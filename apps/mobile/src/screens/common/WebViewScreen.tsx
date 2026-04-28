import Ionicons from '@expo/vector-icons/Ionicons';
import { useLayoutEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { track } from '../../analytics';
import { EmptyState } from '../../components/EmptyState';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { openExternalUrl } from '../../lib/linking';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList, AboutStackParamList } from '../../navigation/types';

type Props =
  | NativeStackScreenProps<HomeStackParamList, 'SearchWebView'>
  | NativeStackScreenProps<AboutStackParamList, 'AboutWebView'>;

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

export function WebViewScreen({ navigation, route }: Props) {
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: route.params.title,
      ...(route.params.showOptions
        ? {
            headerRight: () => (
              <Pressable
                accessibilityLabel="分享"
                accessibilityRole="button"
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
                style={styles.headerButton}
              >
                <Ionicons color={colors.accent} name="share-outline" size={24} />
              </Pressable>
            ),
          }
        : {}),
    });
  }, [navigation, route.params.showOptions, route.params.title, route.params.url]);

  if (loadState === 'not-found') {
    return (
      <EmptyState
        icon="document-text"
        title="頁面仍在準備中"
        description="這個連結目前回傳 404。等 marketing site 上線後，這些頁面會直接顯示。"
        actionLabel="在瀏覽器開啟"
        onAction={() => void openExternalUrl(route.params.url)}
        containerStyle={styles.container}
      />
    );
  }

  if (loadState === 'error') {
    return (
      <EmptyState
        icon="cloud-offline"
        title="未能載入內容"
        description="請檢查您的網絡連接。如持續遇到此問題，請稍後再試。"
        actionLabel="在瀏覽器開啟"
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
        source={{ uri: route.params.url }}
        style={styles.webview}
      />
      {loadState === 'loading' ? <LoadingOverlay label="正在打開書店頁面…" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerButton: {
    paddingHorizontal: spacing.xs,
  },
});
