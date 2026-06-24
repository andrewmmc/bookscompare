import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { AccountScreen } from './AccountScreen';
import { strings } from '../../i18n/strings';
import { renderWithProviders } from '../../test/test-utils';

const mockAuth = {
  status: 'signedOut' as 'signedOut' | 'signedIn' | 'loading' | 'disabled',
  session: null,
  user: null as { email?: string } | null,
  signInWithApple: jest.fn<Promise<void>, []>(),
  requestEmailOtp: jest.fn<Promise<void>, [string]>(),
  verifyEmailOtp: jest.fn<Promise<void>, [string, string]>(),
  signOut: jest.fn<Promise<void>, []>(),
  deleteAccount: jest.fn<Promise<void>, []>(),
};

const mockSync = {
  syncing: false,
  lastSyncedAt: null as number | null,
  syncNow: jest.fn<Promise<void>, []>(),
};

jest.mock('../../auth/AuthProvider', () => ({
  useAuth: () => mockAuth,
}));

jest.mock('../../auth/AccountSyncProvider', () => ({
  useAccountSync: () => mockSync,
}));

jest.mock('../../analytics', () => ({
  track: jest.fn(),
}));

jest.mock('expo-apple-authentication', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable } = require('react-native');
  return {
    AppleAuthenticationButton: ({ onPress }: { onPress: () => void }) =>
      React.createElement(Pressable, { onPress, testID: 'apple-button' }),
    AppleAuthenticationButtonType: { SIGN_IN: 0 },
    AppleAuthenticationButtonStyle: { BLACK: 0, WHITE: 1 },
    AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
  };
});

function renderScreen() {
  const navigation = { navigate: jest.fn() };
  const screen = renderWithProviders(
    <AccountScreen
      navigation={navigation as never}
      route={{ key: 'Account', name: 'Account' } as never}
    />
  );
  return { screen, navigation };
}

describe('AccountScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.status = 'signedOut';
    mockAuth.user = null;
    mockAuth.requestEmailOtp.mockResolvedValue(undefined);
    mockAuth.signInWithApple.mockResolvedValue(undefined);
    mockAuth.signOut.mockResolvedValue(undefined);
    mockAuth.deleteAccount.mockResolvedValue(undefined);
    mockSync.syncing = false;
    mockSync.lastSyncedAt = null;
    mockSync.syncNow.mockResolvedValue(undefined);
  });

  describe('signed out', () => {
    it('requests an email OTP and navigates to the verify screen', async () => {
      const { screen, navigation } = renderScreen();

      fireEvent.changeText(
        screen.getByPlaceholderText(strings.account.emailPlaceholder),
        '  reader@example.com  '
      );
      fireEvent.press(screen.getByText(strings.account.sendCodeAction));

      await waitFor(() => {
        expect(mockAuth.requestEmailOtp).toHaveBeenCalledWith('reader@example.com');
      });
      expect(navigation.navigate).toHaveBeenCalledWith('VerifyOtp', {
        email: 'reader@example.com',
      });
    });

    it('does not request a code when the email is empty', () => {
      const { screen, navigation } = renderScreen();

      fireEvent.press(screen.getByText(strings.account.sendCodeAction));

      expect(mockAuth.requestEmailOtp).not.toHaveBeenCalled();
      expect(navigation.navigate).not.toHaveBeenCalled();
    });

    it('triggers Sign in with Apple', async () => {
      const { screen } = renderScreen();

      fireEvent.press(screen.getByTestId('apple-button'));

      await waitFor(() => {
        expect(mockAuth.signInWithApple).toHaveBeenCalled();
      });
    });
  });

  describe('signed in', () => {
    beforeEach(() => {
      mockAuth.status = 'signedIn';
      mockAuth.user = { email: 'reader@example.com' };
    });

    it('shows the signed-in email and never-synced state', () => {
      const { screen } = renderScreen();

      expect(screen.getByText('reader@example.com')).toBeTruthy();
      expect(screen.getByText(strings.account.neverSynced)).toBeTruthy();
    });

    it('runs a manual sync when "sync now" is pressed', () => {
      const { screen } = renderScreen();

      fireEvent.press(screen.getByText(strings.account.syncNowAction));

      expect(mockSync.syncNow).toHaveBeenCalled();
    });

    it('signs out only after confirming the alert', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { screen } = renderScreen();

      fireEvent.press(screen.getByText(strings.account.signOutAction));

      expect(mockAuth.signOut).not.toHaveBeenCalled();
      const buttons = alertSpy.mock.calls[0]?.[2];
      const confirm = buttons?.find((b) => b.style === 'destructive');
      confirm?.onPress?.();

      expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it('deletes the account only after confirming the alert', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { screen } = renderScreen();

      fireEvent.press(screen.getByText(strings.account.deleteAccountAction));

      expect(mockAuth.deleteAccount).not.toHaveBeenCalled();
      const buttons = alertSpy.mock.calls[0]?.[2];
      const confirm = buttons?.find((b) => b.style === 'destructive');
      confirm?.onPress?.();

      await waitFor(() => {
        expect(mockAuth.deleteAccount).toHaveBeenCalled();
      });
    });
  });
});
