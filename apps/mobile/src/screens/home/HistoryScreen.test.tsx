import { fireEvent, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Alert } from 'react-native';

import { HistoryScreen } from './HistoryScreen';
import { renderWithProviders } from '../../test/test-utils';

const mockUseHistory = jest.fn();
const mockRemoveMutate = jest.fn();
const mockRestoreMutate = jest.fn();
const mockClearMutate = jest.fn();
const mockShowActionSheet = jest.fn();

jest.mock('@expo/react-native-action-sheet', () => {
  const actual = jest.requireActual('@expo/react-native-action-sheet');
  return {
    ...actual,
    useActionSheet: () => ({ showActionSheetWithOptions: mockShowActionSheet }),
  };
});

jest.mock('../../api/history', () => ({
  useHistory: (...args: unknown[]) => mockUseHistory(...args),
  useRemoveHistoryEntry: () => ({ mutate: mockRemoveMutate }),
  useRestoreHistoryEntry: () => ({ mutate: mockRestoreMutate }),
  useClearHistory: () => ({ mutate: mockClearMutate }),
}));

describe('HistoryScreen', () => {
  beforeEach(() => {
    mockUseHistory.mockReset();
    mockRemoveMutate.mockReset();
    mockRestoreMutate.mockReset();
    mockClearMutate.mockReset();
    mockShowActionSheet.mockReset();
    mockRemoveMutate.mockImplementation((_entry: unknown, options?: { onSuccess?: () => void }) =>
      options?.onSuccess?.()
    );
  });

  it('shows empty state when there is no history', async () => {
    mockUseHistory.mockReturnValue({ data: [], isLoading: false });

    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    const screen = await renderWithProviders(
      <HistoryScreen
        navigation={navigation as never}
        route={{ key: 'History', name: 'History', params: undefined } as never}
      />
    );

    expect(screen.getByText('還沒有任何搜尋記錄')).toBeOnTheScreen();
  });

  it('renders ISBN and title entries and navigates correctly on tap', async () => {
    mockUseHistory.mockReturnValue({
      data: [
        { type: 'isbn', isbn: '9789861336275', title: '我的最愛之書', viewedAt: 3000 },
        { type: 'title', title: '哈利波特', viewedAt: 2000 },
        { type: 'isbn', isbn: '9781402894626', viewedAt: 1000 },
      ],
      isLoading: false,
    });

    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    const screen = await renderWithProviders(
      <HistoryScreen
        navigation={navigation as never}
        route={{ key: 'History', name: 'History', params: undefined } as never}
      />
    );

    expect(screen.getByText('我的最愛之書')).toBeOnTheScreen();
    expect(screen.queryByText('9789861336275')).toBeNull();
    // ISBN line shows below the title for resolved ISBN entries.
    expect(screen.getByText('ISBN 9789861336275')).toBeOnTheScreen();
    expect(screen.getByText('哈利波特')).toBeOnTheScreen();
    // ISBN entry without a resolved title falls back to the ISBN as the primary text.
    expect(screen.getByText('ISBN 9781402894626')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('我的最愛之書'));
    expect(navigation.navigate).toHaveBeenLastCalledWith('SearchResult', {
      isbn: '9789861336275',
    });

    await fireEvent.press(screen.getByText('哈利波特'));
    expect(navigation.navigate).toHaveBeenLastCalledWith('SearchResult', {
      title: '哈利波特',
    });
  });

  it('deletes one history entry without confirmation', async () => {
    const entry = { type: 'title' as const, title: '哈利波特', viewedAt: 2000 };
    mockUseHistory.mockReturnValue({ data: [entry], isLoading: false });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };

    const screen = await renderWithProviders(
      <HistoryScreen
        navigation={navigation as never}
        route={{ key: 'History', name: 'History', params: undefined } as never}
      />
    );

    await fireEvent.press(screen.getByLabelText('刪除搜尋記錄'));

    expect(mockRemoveMutate).toHaveBeenCalledWith(entry, expect.any(Object));
    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByText('已刪除。搖動手機即可還原。')).toBeOnTheScreen();
    expect(navigation.setOptions).toHaveBeenCalledTimes(1);

    alertSpy.mockRestore();
  });

  it('sorts by time and changes direction from the header menu', async () => {
    mockUseHistory.mockReturnValue({
      data: [
        { type: 'title', title: '較舊', viewedAt: 1000 },
        { type: 'title', title: '較新', viewedAt: 2000 },
      ],
      isLoading: false,
    });
    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    const screen = await renderWithProviders(
      <HistoryScreen
        navigation={navigation as never}
        route={{ key: 'History', name: 'History', params: undefined } as never}
      />
    );

    expect(screen.getAllByText(/較新|較舊/).map((item) => item.props.children)).toEqual([
      '較新',
      '較舊',
    ]);

    const headerRight = (navigation.setOptions as jest.Mock).mock.calls.at(-1)?.[0]
      ?.headerRight as () => ReactElement;
    const header = await renderWithProviders(headerRight());
    mockShowActionSheet.mockImplementation(
      (_options: unknown, callback: (selectedIndex?: number) => void) => callback(1)
    );
    await fireEvent.press(header.getByLabelText('排序'));

    expect(mockShowActionSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '排序',
        options: ['✓ 最新優先', '最舊優先', '取消'],
        cancelButtonIndex: 2,
        userInterfaceStyle: 'light',
      }),
      expect.any(Function)
    );

    await waitFor(() =>
      expect(screen.getAllByText(/較新|較舊/).map((item) => item.props.children)).toEqual([
        '較舊',
        '較新',
      ])
    );
  });

  it('confirms before clearing all history', async () => {
    mockUseHistory.mockReturnValue({
      data: [{ type: 'title', title: '哈利波特', viewedAt: 2000 }],
      isLoading: false,
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    await renderWithProviders(
      <HistoryScreen
        navigation={navigation as never}
        route={{ key: 'History', name: 'History', params: undefined } as never}
      />
    );

    const setOptions = navigation.setOptions as jest.Mock;
    const headerRight = setOptions.mock.calls.at(-1)?.[0]?.headerRight as
      (() => ReactElement<{ onPress: () => void }> | null) | undefined;
    expect(headerRight).toBeDefined();
    const headerNode = headerRight!();
    expect(headerNode).not.toBeNull();
    const header = await renderWithProviders(headerNode!);
    await fireEvent.press(header.getByLabelText('全部清除'));

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

  it('keeps sort enabled and disables clear-all when history is empty', async () => {
    mockUseHistory.mockReturnValue({ data: [], isLoading: false });

    const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
    await renderWithProviders(
      <HistoryScreen
        navigation={navigation as never}
        route={{ key: 'History', name: 'History', params: undefined } as never}
      />
    );

    const setOptions = navigation.setOptions as jest.Mock;
    const headerRight = setOptions.mock.calls.at(-1)?.[0]?.headerRight as
      (() => ReactElement) | undefined;
    expect(headerRight).toBeDefined();
    const header = await renderWithProviders(headerRight!());
    expect(header.getByLabelText('排序')).toBeEnabled();
    expect(header.getByLabelText('全部清除')).toBeDisabled();
  });
});
