import { clearFavourites, type Favourite } from './favourites';
import { clearHistory, type HistoryEntry } from './history';
import { DEFAULT_PREFERENCES, replacePreferences, type Preferences } from './preferences';

export interface ResetAppDataResult {
  preferences: Preferences;
  history: HistoryEntry[];
  favourites: Favourite[];
}

export async function resetAppData(): Promise<ResetAppDataResult> {
  const [preferences, history, favourites] = await Promise.all([
    replacePreferences({ ...DEFAULT_PREFERENCES }),
    clearHistory(),
    clearFavourites(),
  ]);

  return { preferences, history, favourites };
}
