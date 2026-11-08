export interface WebViewScreenParams {
  title: string;
  url: string;
  showOptions?: boolean;
}

export type SearchResultRoutes = {
  SearchResult: { isbn: string } | { title: string };
  SearchWebView: WebViewScreenParams;
};

// Route names match the files under `src/app/`; each tab's first screen is its `index` route.
export type HomeStackParamList = SearchResultRoutes & {
  index: undefined;
  BarcodeScanner: undefined;
  History: undefined;
};

export type FavouritesStackParamList = SearchResultRoutes & {
  index: undefined;
};

export type AboutStackParamList = {
  index: undefined;
  Settings: undefined;
  LanguagePreferences: undefined;
  OpenLinksPreferences: undefined;
  ThemePreferences: undefined;
  StorePreferences: undefined;
  BookTypePreferences: undefined;
  AboutWebView: WebViewScreenParams;
};
