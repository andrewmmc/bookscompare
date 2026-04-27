import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';

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
      <View style={styles.content}>
        <View style={styles.intro}>
          <Ionicons color={colors.ink} name="search" size={72} style={styles.icon} />
          <Text style={styles.leadText}>{strings.home.leadText}</Text>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            keyboardType="numeric"
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
    paddingBottom: spacing.xl,
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
