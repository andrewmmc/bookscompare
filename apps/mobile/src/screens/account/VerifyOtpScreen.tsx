import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { track } from '../../analytics';
import { useAuth } from '../../auth/AuthProvider';
import { AppButton } from '../../components/AppButton';
import { AppTextField } from '../../components/AppTextField';
import { strings } from '../../i18n/strings';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ThemeColors } from '../../theme/colors';
import type { AboutStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AboutStackParamList, 'VerifyOtp'>;

const OTP_LENGTH = 6;

export function VerifyOtpScreen({ route }: Props) {
  const { email } = route.params;
  const { colors } = useTheme();
  const { verifyEmailOtp, requestEmailOtp } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (trimmed.length < OTP_LENGTH || verifying) {
      return;
    }
    setVerifying(true);
    try {
      track('account_otp_verify');
      // On success the auth state listener swaps this screen out automatically.
      await verifyEmailOtp(email, trimmed);
    } catch {
      Alert.alert(strings.account.errorTitle, strings.account.otpVerifyErrorMessage);
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resending) {
      return;
    }
    setResending(true);
    try {
      track('account_otp_request', { resend: true });
      await requestEmailOtp(email);
    } catch {
      Alert.alert(strings.account.errorTitle, strings.account.otpRequestErrorMessage);
    } finally {
      setResending(false);
    }
  };

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
      <Text style={styles.title}>{strings.account.verifyTitle}</Text>
      <Text style={styles.lead}>{strings.account.verifyLead(email)}</Text>

      <AppTextField
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
        placeholder={strings.account.codePlaceholder}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        returnKeyType="done"
        onSubmitEditing={handleVerify}
        onClear={() => setCode('')}
        containerStyle={styles.field}
      />
      <AppButton
        label={strings.account.verifyAction}
        onPress={handleVerify}
        disabled={code.trim().length < OTP_LENGTH}
        loading={verifying}
        fullWidth
        style={styles.primaryButton}
      />
      <View style={styles.resendRow}>
        <AppButton
          label={strings.account.resendAction}
          onPress={handleResend}
          variant="plain"
          loading={resending}
        />
      </View>
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
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    title: {
      ...typography.title3,
      color: colors.ink,
      textAlign: 'center',
    },
    lead: {
      ...typography.subhead,
      color: colors.inkMuted,
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
    },
    field: {
      marginBottom: spacing.lg,
    },
    primaryButton: {
      alignSelf: 'stretch',
    },
    resendRow: {
      alignItems: 'center',
      marginTop: spacing.md,
    },
  });
