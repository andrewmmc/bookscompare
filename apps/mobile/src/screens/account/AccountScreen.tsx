import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { track } from '../../analytics';
import { useAccountSync } from '../../auth/AccountSyncProvider';
import { useAuth } from '../../auth/AuthProvider';
import { AppButton } from '../../components/AppButton';
import { AppTextField } from '../../components/AppTextField';
import { ListRow } from '../../components/ListRow';
import { strings } from '../../i18n/strings';
import { formatDateTime } from '../../lib/datetime';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ThemeColors } from '../../theme/colors';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'Account'>;

/** Apple surfaces a cancellation as this error code; treat it as a no-op. */
function isAppleCancellation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ERR_REQUEST_CANCELED'
  );
}

function SignInView({ navigation }: Props) {
  const { colors, scheme } = useTheme();
  const { signInWithApple, requestEmailOtp } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleApple = async () => {
    try {
      track('account_sign_in', { method: 'apple' });
      await signInWithApple();
    } catch (error) {
      if (isAppleCancellation(error)) {
        return;
      }
      Alert.alert(strings.account.errorTitle, strings.account.signInErrorMessage);
    }
  };

  const handleSendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      track('account_otp_request');
      await requestEmailOtp(trimmed);
      navigation.navigate('VerifyOtp', { email: trimmed });
    } catch {
      Alert.alert(strings.account.errorTitle, strings.account.otpRequestErrorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.signInBody}>
      <Text style={styles.signInTitle}>{strings.account.signInTitle}</Text>
      <Text style={styles.signInLead}>{strings.account.signInLead}</Text>

      {Platform.OS === 'ios' ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={
            scheme === 'dark'
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={22}
          style={styles.appleButton}
          onPress={handleApple}
        />
      ) : null}

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>{strings.account.orDivider}</Text>
        <View style={styles.dividerLine} />
      </View>

      <Text style={styles.fieldLabel}>{strings.account.emailLabel}</Text>
      <AppTextField
        value={email}
        onChangeText={setEmail}
        placeholder={strings.account.emailPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={handleSendCode}
        onClear={() => setEmail('')}
        containerStyle={styles.field}
      />
      <AppButton
        label={strings.account.sendCodeAction}
        onPress={handleSendCode}
        disabled={email.trim().length === 0}
        loading={submitting}
        fullWidth
        style={styles.primaryButton}
      />
    </View>
  );
}

function SignedInView() {
  const { colors } = useTheme();
  const { user, signOut, deleteAccount } = useAuth();
  const { syncing, lastSyncedAt, syncNow } = useAccountSync();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const syncValue = syncing
    ? strings.account.syncingLabel
    : lastSyncedAt
      ? strings.account.lastSynced(formatDateTime(lastSyncedAt))
      : strings.account.neverSynced;

  const confirmSignOut = () => {
    Alert.alert(strings.account.signOutConfirmTitle, strings.account.signOutConfirmMessage, [
      { text: strings.account.cancelAction, style: 'cancel' },
      {
        text: strings.account.signOutConfirmAction,
        style: 'destructive',
        onPress: () => {
          track('account_sign_out');
          void signOut();
        },
      },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(strings.account.deleteConfirmTitle, strings.account.deleteConfirmMessage, [
      { text: strings.account.cancelAction, style: 'cancel' },
      {
        text: strings.account.deleteConfirmAction,
        style: 'destructive',
        onPress: async () => {
          try {
            track('account_delete');
            await deleteAccount();
          } catch {
            Alert.alert(strings.account.errorTitle, strings.account.deleteErrorMessage);
          }
        },
      },
    ]);
  };

  return (
    <>
      <Text style={styles.sectionHeader}>{strings.account.accountSection}</Text>
      <View style={styles.group}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{strings.account.signedInAs}</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {user?.email ?? ''}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
        {strings.account.syncSection}
      </Text>
      <View style={styles.group}>
        <ListRow
          icon="sync-outline"
          iconBackground={colors.accent}
          title={strings.account.syncNowAction}
          value={syncValue}
          onPress={() => void syncNow()}
          hideChevron
          isLast
        />
      </View>
      <Text style={styles.sectionFooter}>{strings.account.syncDescription}</Text>

      <View style={[styles.group, styles.groupSpaced]}>
        <ListRow
          icon="log-out-outline"
          iconBackground={colors.inkMuted}
          title={strings.account.signOutAction}
          onPress={confirmSignOut}
          hideChevron
          isLast
        />
      </View>

      <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
        {strings.account.dangerSection}
      </Text>
      <View style={styles.group}>
        <ListRow
          icon="trash-outline"
          title={strings.account.deleteAccountAction}
          onPress={confirmDelete}
          destructive
          hideChevron
          isLast
        />
      </View>
    </>
  );
}

export function AccountScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { status } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: tabBarHeight + spacing.xl },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      {status === 'signedIn' ? (
        <SignedInView />
      ) : (
        <SignInView navigation={navigation} route={route} />
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.groupedBackground,
    },
    contentContainer: {
      paddingTop: spacing.md,
    },
    signInBody: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    signInTitle: {
      ...typography.title3,
      color: colors.ink,
      textAlign: 'center',
    },
    signInLead: {
      ...typography.subhead,
      color: colors.inkMuted,
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
    },
    appleButton: {
      height: 48,
      width: '100%',
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginVertical: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
    },
    dividerLabel: {
      ...typography.footnote,
      color: colors.inkMuted,
    },
    fieldLabel: {
      ...typography.footnote,
      color: colors.inkMuted,
      marginBottom: spacing.xs,
    },
    field: {
      marginBottom: spacing.lg,
    },
    primaryButton: {
      alignSelf: 'stretch',
    },
    sectionHeader: {
      ...typography.caption,
      color: colors.inkMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: spacing.md + spacing.xs,
      paddingBottom: spacing.xs,
    },
    sectionHeaderSpaced: {
      paddingTop: spacing.lg,
    },
    sectionFooter: {
      ...typography.footnote,
      color: colors.inkMuted,
      paddingHorizontal: spacing.md + spacing.xs,
      paddingTop: spacing.xs,
    },
    group: {
      marginHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 14,
      overflow: 'hidden',
    },
    groupSpaced: {
      marginTop: spacing.lg,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 44,
      gap: spacing.md,
    },
    infoLabel: {
      ...typography.body,
      color: colors.ink,
    },
    infoValue: {
      ...typography.body,
      color: colors.inkMuted,
      flexShrink: 1,
      textAlign: 'right',
    },
  });
