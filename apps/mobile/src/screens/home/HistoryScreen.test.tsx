import { fireEvent } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Alert } from 'react-native';

import { HistoryScreen } from './HistoryScreen';
import { renderWithProviders } from '../../test/test-utils';

const mockUseHistory = jest.fn();
const mockClearMutate = jest.fn();

jest.mock('../../api/history', () => ({
  useHistory: (...args: unknown[]) => mockUseHistory(...args),
  useClearHistory: () => ({ mutate: mockClearMutate }),
}));

describe('HistoryScreen', () => {
  beforeEach(() => {
    mockUseHistory.mockReset();
    mockClearMutate.mockReset();
  });

  it('shows empty state when there is no history', () => {
    mockUseHistory.mockReturnValue({ data: [], isLoading: false });

    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    const screen = renderWithProviders(
      <HistoryScreen
        navigation={navigation as never}
        route={{ key: 'History', name: 'History', params: undefined } as never}
      />
    );

    expect(screen.getByText('還沒有任何搜尋記錄')).toBeOnTheScreen();
  });

  it('renders ISBN and title entries and navigates correctly on tap', () => {
    mockUseHistory.mockReturnValue({
      data: [
        { type: 'isbn', isbn: '9789861336275', title: '我的最愛之書', viewedAt: 3000 },
        { type: 'title', title: '哈利波特', viewedAt: 2000 },
        { type: 'isbn', isbn: '9781402894626', viewedAt: 1000 },
      ],
      isLoading: false,
    });

    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    const screen = renderWithProviders(
      <HistoryScreen
        navigation={navigation as never}
        route={{ key: 'History', name: 'History', params: undefined } as never}
      />
    );

    expect(screen.getByText('我的最愛之書')).toBeOnTheScreen();
    expect(screen.queryByText('9789861336275')).toBeNull();
    expect(screen.getByText('哈利波特')).toBeOnTheScreen();
    // ISBN entry without a resolved title falls back to the ISBN as the primary text.
    expect(screen.getByText('9781402894626')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('我的最愛之書'));
    expect(navigation.navigate).toHaveBeenLastCalledWith('SearchResult', {
      isbn: '9789861336275',
    });

    fireEvent.press(screen.getByText('哈利波特'));
    expect(navigation.navigate).toHaveBeenLastCalledWith('SearchResult', {
      title: '哈利波特',
    });
  });

  it('confirms before clearing all history', () => {
    mockUseHistory.mockReturnValue({
      data: [{ type: 'title', title: '哈利波特', viewedAt: 2000 }],
      isLoading: false,
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    renderWithProviders(
      <HistoryScreen
        navigation={navigation as never}
        route={{ key: 'History', name: 'History', params: undefined } as never}
      />
    );

    const setOptions = navigation.setOptions as jest.Mock;
    const headerRight = setOptions.mock.calls.at(-1)?.[0]?.headerRight as
      | (() => ReactElement<{ onPress: () => void }> | null)
      | undefined;
    expect(headerRight).toBeDefined();
    const headerNode = headerRight!();
    expect(headerNode).not.toBeNull();
    headerNode!.props.onPress();

    expect(alertSpy).toHaveBeenCalledWith(
      '清除所有搜尋記錄？',
      '此動作無法復原，所有搜尋記錄都會被移除。',
      expect.any(Array)
    );

    const buttons = alertSpy.mock.calls[0]?.[2] as Array<{
      text: string;
      onPress?: () => void;
    }>;
    const confirm = buttons.find((b) => b.text === '全部清除');
    confirm?.onPress?.();
    expect(mockClearMutate).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('hides the clear-all action when history is empty', () => {
    mockUseHistory.mockReturnValue({ data: [], isLoading: false });

    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    renderWithProviders(
      <HistoryScreen
        navigation={navigation as never}
        route={{ key: 'History', name: 'History', params: undefined } as never}
      />
    );

    const setOptions = navigation.setOptions as jest.Mock;
    const headerRight = setOptions.mock.calls.at(-1)?.[0]?.headerRight as
      | (() => ReactElement | null)
      | undefined;
    expect(headerRight).toBeDefined();
    expect(headerRight!()).toBeNull();
  });
});
