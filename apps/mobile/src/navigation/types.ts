import type { NavigatorScreenParams } from '@react-navigation/native';

export interface WebViewScreenParams {
  title: string;
  url: string;
  showOptions?: boolean;
}

export type HomeStackParamList = {
  Home: undefined;
  BarcodeScanner: undefined;
  SearchResult: { isbn: string; title?: never } | { title: string; isbn?: never };
  SearchWebView: WebViewScreenParams;
};

export type AboutStackParamList = {
  About: undefined;
  AboutWebView: WebViewScreenParams;
};

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  AboutTab: NavigatorScreenParams<AboutStackParamList>;
};
