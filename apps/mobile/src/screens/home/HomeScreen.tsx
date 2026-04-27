import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Surface, Text, TextInput } from 'react-native-paper';

import { track } from '../../analytics';
import { normalizeIsbn, isValidIsbn } from '../../lib/isbn';
import { strings } from '../../i18n/strings';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [isbn, setIsbn] = useState('');
  const normalizedIsbn = normalizeIsbn(isbn);
  const canSearch = isValidIsbn(normalizedIsbn);

  const handleSearch = () => {
    if (!canSearch) {
      return;
    }

    track('home_click_search', { isbnLength: normalizedIsbn.length });
    navigation.navigate('SearchResult', { isbn: normalizedIsbn });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.container}
    >
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />
      <View style={styles.content}>
        <Text style={styles.kicker}>{strings.home.kicker}</Text>
        <Text style={styles.title}>{strings.home.title}</Text>
        <Text style={styles.description}>{strings.home.description}</Text>

        <Surface elevation={2} style={styles.card}>
          <View style={styles.inputRow}>
            <TextInput
              autoCapitalize="characters"
              keyboardType="ascii-capable"
              label={strings.home.inputLabel}
              maxLength={13}
              mode="outlined"
              onChangeText={(value) => {
                track('home_type_isbn');
                setIsbn(value);
              }}
              outlineColor={colors.border}
              placeholder={strings.home.inputPlaceholder}
              style={styles.input}
              value={isbn}
            />
            <Button
              icon={() => <Ionicons color={colors.surface} name="camera" size={20} />}
              mode="contained-tonal"
              onPress={() => {
                track('home_click_scan');
                navigation.navigate('BarcodeScanner');
              }}
              style={styles.scannerButton}
              contentStyle={styles.scannerButtonContent}
            >
              {strings.home.scanAction}
            </Button>
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

          <Text style={styles.helperText}>
            {canSearch ? strings.home.helperReady : strings.home.helperPending}
          </Text>
        </Surface>
      </View>
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
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  glowLarge: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.highlight,
    opacity: 0.65,
  },
  glowSmall: {
    position: 'absolute',
    left: -40,
    top: 220,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.highlightSoft,
    opacity: 0.8,
  },
  kicker: {
    ...typography.kicker,
    color: colors.accent,
  },
  title: {
    ...typography.hero,
    color: colors.ink,
  },
  description: {
    ...typography.body,
    color: colors.inkMuted,
    maxWidth: 360,
  },
  card: {
    marginTop: spacing.md,
    borderRadius: 30,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  inputRow: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
  },
  scannerButton: {
    borderRadius: 18,
    backgroundColor: colors.ink,
  },
  scannerButtonContent: {
    paddingVertical: spacing.xs,
  },
  searchButton: {
    borderRadius: 18,
  },
  searchButtonContent: {
    minHeight: 52,
  },
  helperText: {
    ...typography.caption,
    color: colors.inkMuted,
  },
});
