import type { NavigatorScreenParams } from '@react-navigation/native';

export interface WebViewScreenParams {
  title: string;
  url: string;
  showOptions?: boolean;
}

export type SearchResultRoutes = {
  SearchResult: { isbn: string } | { title: string };
  SearchWebView: WebViewScreenParams;
};

export type HomeStackParamList = SearchResultRoutes & {
  Home: undefined;
  BarcodeScanner: undefined;
  History: undefined;
};

export type FavouritesStackParamList = SearchResultRoutes & {
  Favourites: undefined;
};

export type AboutStackParamList = {
  About: undefined;
  Settings: undefined;
  Account: undefined;
  VerifyOtp: { email: string };
  OpenLinksPreferences: undefined;
  ThemePreferences: undefined;
  StorePreferences: undefined;
  BookTypePreferences: undefined;
  AboutWebView: WebViewScreenParams;
};

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  FavouritesTab: NavigatorScreenParams<FavouritesStackParamList>;
  AboutTab: NavigatorScreenParams<AboutStackParamList>;
};
