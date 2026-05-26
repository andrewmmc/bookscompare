import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { AppButton } from '../../components/AppButton';
import { AppTextField } from '../../components/AppTextField';
import { track } from '../../analytics';
import { featureFlags } from '../../config/featureFlags';
import { normalizeIsbn, isValidIsbn } from '../../lib/isbn';
import { strings } from '../../i18n/strings';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ThemeColors } from '../../theme/colors';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

type SearchMode = 'isbn' | 'title';

const TITLE_MAX_LENGTH = 100;

interface SegmentedToggleProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

function SegmentedToggle<T extends string>({ value, options, onChange }: SegmentedToggleProps<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createToggleStyles(colors), [colors]);

  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            android_ripple={{ color: colors.rowPressed, borderless: false }}
            onPress={() => {
              if (!selected) {
                onChange(option.value);
              }
            }}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && !selected && styles.segmentPressed,
            ]}
          >
            <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tabBarHeight = useBottomTabBarHeight();
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.xl }]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.intro}>
            <View style={styles.iconCircle}>
              <Ionicons color={colors.accent} name="search" size={36} />
            </View>
            <Text style={styles.leadText}>
              {titleSearchEnabled ? strings.home.leadTextWithTitleSearch : strings.home.leadText}
            </Text>
          </View>

          {titleSearchEnabled ? (
            <View style={styles.segments}>
              <SegmentedToggle
                value={mode}
                onChange={(next) => {
                  track('home_change_mode', { mode: next });
                  setMode(next);
                }}
                options={[
                  { value: 'isbn', label: strings.home.isbnTab },
                  { value: 'title', label: strings.home.titleTab },
                ]}
              />
            </View>
          ) : null}

          <View style={styles.inputRow}>
            {mode === 'isbn' ? (
              <AppTextField
                containerStyle={styles.input}
                keyboardType="numeric"
                maxLength={13}
                onChangeText={(value) => {
                  track('home_type_isbn');
                  setIsbn(value);
                }}
                placeholder={strings.home.isbnPlaceholder}
                value={isbn}
                onClear={() => setIsbn('')}
                clearAccessibilityLabel={strings.home.clearAction}
              />
            ) : (
              <AppTextField
                containerStyle={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={TITLE_MAX_LENGTH}
                onChangeText={(value) => {
                  track('home_type_title');
                  setTitle(value);
                }}
                onSubmitEditing={handleSearch}
                placeholder={strings.home.titlePlaceholder}
                returnKeyType="search"
                value={title}
                onClear={() => setTitle('')}
                clearAccessibilityLabel={strings.home.clearAction}
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
                <Ionicons color="#ffffff" name="camera" size={22} />
              </Pressable>
            ) : null}
          </View>

          <AppButton
            disabled={!canSearch}
            fullWidth
            label={strings.home.searchAction}
            onPress={handleSearch}
            size="large"
            style={styles.searchButton}
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
    },
    intro: {
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      alignItems: 'center',
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.highlightSoft,
    },
    leadText: {
      ...typography.body,
      color: colors.ink,
      paddingTop: spacing.md,
      textAlign: 'center',
      maxWidth: 320,
    },
    segments: {
      marginBottom: spacing.md,
      alignItems: 'center',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    input: {
      flex: 1,
    },
    scannerButton: {
      height: 44,
      width: 44,
      borderRadius: 22,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    scannerPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
    searchButton: {
      marginTop: spacing.lg,
    },
  });

const createToggleStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: colors.groupedBackground,
      borderRadius: 100,
      padding: 4,
      alignSelf: 'center',
      minWidth: 220,
    },
    segment: {
      flex: 1,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentSelected: {
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    segmentPressed: {
      opacity: 0.6,
    },
    segmentLabel: {
      ...typography.subhead,
      fontWeight: '500',
      color: colors.inkMuted,
    },
    segmentLabelSelected: {
      color: colors.ink,
      fontWeight: '600',
    },
  });
