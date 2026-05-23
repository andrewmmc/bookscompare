import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { track } from '../../analytics';
import { featureFlags } from '../../config/featureFlags';
import { normalizeIsbn, isValidIsbn } from '../../lib/isbn';
import { strings } from '../../i18n/strings';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

type SearchMode = 'isbn' | 'title';

const TITLE_MAX_LENGTH = 100;

export function HomeScreen({ navigation }: Props) {
  const [mode, setMode] = useState<SearchMode>('isbn');
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');

  const titleSearchEnabled = featureFlags.enableTitleSearch;
  const normalizedIsbn = normalizeIsbn(isbn);
  const trimmedTitle = title.trim();
  const canSearch =
    mode === 'isbn'
      ? isValidIsbn(normalizedIsbn)
      : titleSearchEnabled && trimmedTitle.length > 0 && trimmedTitle.length <= TITLE_MAX_LENGTH;

  const handleSearch = () => {
    if (!canSearch) {
      return;
    }

    if (mode === 'isbn') {
      track('home_click_search', { isbnLength: normalizedIsbn.length });
      navigation.navigate('SearchResult', {
        isbn: normalizedIsbn,
      });
      return;
    }

    track('home_click_search_title', { titleLength: trimmedTitle.length });
    navigation.navigate('SearchResult', { title: trimmedTitle });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.container}
    >
      <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <View style={styles.intro}>
            <Ionicons color={colors.ink} name="search" size={72} style={styles.icon} />
            <Text style={styles.leadText}>
              {titleSearchEnabled ? strings.home.leadTextWithTitleSearch : strings.home.leadText}
            </Text>
          </View>

          {titleSearchEnabled ? (
            <SegmentedButtons
              density="medium"
              onValueChange={(value) => {
                const next = value as SearchMode;
                track('home_change_mode', { mode: next });
                setMode(next);
              }}
              style={styles.segments}
              value={mode}
              buttons={[
                { value: 'isbn', label: strings.home.isbnTab },
                { value: 'title', label: strings.home.titleTab },
              ]}
            />
          ) : null}

          <View style={styles.inputRow}>
            {mode === 'isbn' ? (
              <TextInput
                keyboardType="numeric"
                maxLength={13}
                mode="outlined"
                onChangeText={(value) => {
                  track('home_type_isbn');
                  setIsbn(value);
                }}
                outlineColor={colors.border}
                placeholder={strings.home.isbnPlaceholder}
                style={styles.input}
                value={isbn}
              />
            ) : (
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={TITLE_MAX_LENGTH}
                mode="outlined"
                onChangeText={(value) => {
                  track('home_type_title');
                  setTitle(value);
                }}
                onSubmitEditing={handleSearch}
                outlineColor={colors.border}
                placeholder={strings.home.titlePlaceholder}
                returnKeyType="search"
                style={styles.input}
                value={title}
              />
            )}
            {mode === 'isbn' ? (
              <Pressable
                accessibilityLabel={strings.home.scanAction}
                accessibilityRole="button"
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                onPress={() => {
                  track('home_click_scan');
                  navigation.navigate('BarcodeScanner');
                }}
                style={({ pressed }) => [styles.scannerButton, pressed && styles.scannerPressed]}
              >
                <Ionicons color="#ffffff" name="camera" size={24} />
              </Pressable>
            ) : null}
          </View>

          <Button
            disabled={!canSearch}
            mode="contained"
            onPress={handleSearch}
            style={styles.searchButton}
            contentStyle={styles.searchButtonContent}
          >
            {strings.home.searchAction}
          </Button>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  intro: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  leadText: {
    ...typography.body,
    color: colors.ink,
    paddingTop: spacing.md,
    textAlign: 'center',
  },
  segments: {
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scannerButton: {
    height: 56,
    width: 56,
    borderRadius: 4,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerPressed: {
    opacity: 0.85,
  },
  searchButton: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    borderRadius: 4,
  },
  searchButtonContent: {
    paddingHorizontal: spacing.xl,
    height: 44,
  },
});
