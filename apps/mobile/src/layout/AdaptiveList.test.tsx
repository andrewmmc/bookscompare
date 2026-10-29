import { act } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { useReservedRegions } from 'react-native-reserved-regions';

import { AdaptiveList } from './AdaptiveList';
import { renderWithProviders } from '../test/test-utils';
import { setTestWindowSize, WIDE_WINDOW } from '../test/windowSize';

import type { AdaptiveListItemInfo } from './AdaptiveList';

const items = ['a', 'b', 'c'];
const mockUseReservedRegions = jest.mocked(useReservedRegions);

function renderList(onMount = jest.fn()) {
  const renderItem = jest.fn(({ item, isFirst, isLast }: AdaptiveListItemInfo<string>) => (
    <Text
      testID={`item-${item}`}
    >{`${item}:${isFirst ? 'first' : ''}:${isLast ? 'last' : ''}`}</Text>
  ));

  function Header() {
    useEffect(() => {
      onMount();
    }, []);
    return null;
  }

  return {
    renderItem,
    screenPromise: renderWithProviders(
      <AdaptiveList
        data={items}
        keyExtractor={(item) => item}
        margin={16}
        renderItem={renderItem}
        testID="list"
        ListHeaderComponent={<Header />}
      />
    ),
  };
}

describe('AdaptiveList', () => {
  afterEach(() => {
    mockUseReservedRegions.mockReturnValue([]);
  });

  it('renders one grouped column on a phone-width window', async () => {
    const { screenPromise } = renderList();
    const screen = await screenPromise;

    expect(screen.getByTestId('list').props.data).toHaveLength(3);
    expect(screen.getByTestId('list').props.contentContainerStyle).toMatchObject({
      paddingLeft: 16,
      paddingRight: 16,
    });
    expect(screen.getByText('a:first:')).toBeOnTheScreen();
    expect(screen.getByText('b::')).toBeOnTheScreen();
    expect(screen.getByText('c::last')).toBeOnTheScreen();
  });

  it('renders two columns of standalone items on a regular-width window', async () => {
    setTestWindowSize(WIDE_WINDOW);
    const { screenPromise } = renderList();
    const screen = await screenPromise;

    expect(screen.getByTestId('list').props.data).toHaveLength(2);
    expect(screen.getByText('a:first:last')).toBeOnTheScreen();
    expect(screen.getByText('b:first:last')).toBeOnTheScreen();
    expect(screen.getByText('c:first:last')).toBeOnTheScreen();
  });

  it('splits columns at an active fold', async () => {
    setTestWindowSize(WIDE_WINDOW);
    mockUseReservedRegions.mockReturnValue([
      { kind: 'division', frame: { x: 430, y: 0, width: 40, height: 760 }, occludesContent: false },
    ]);
    const { screenPromise } = renderList();
    const screen = await screenPromise;

    const [firstRow] = screen.getByTestId('list').props.data;
    expect(firstRow.entries.map((entry: { item: string }) => entry.item)).toEqual(['a', 'b']);
    expect(screen.getByTestId('item-a').parent?.props.style).toEqual({ width: 414 });
    expect(screen.getByTestId('item-b').parent?.props.style).toEqual({ width: 414 });
  });

  it('keeps the same list mounted when the window grows into two columns', async () => {
    const onMount = jest.fn();
    const { screenPromise } = renderList(onMount);
    const screen = await screenPromise;
    expect(screen.getByTestId('list').props.data).toHaveLength(3);

    await act(() => setTestWindowSize(WIDE_WINDOW));

    expect(screen.getByTestId('list').props.data).toHaveLength(2);
    expect(onMount).toHaveBeenCalledTimes(1);
  });
});
