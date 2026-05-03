import type { NavigatorScreenParams } from '@react-navigation/native';

export interface WebViewScreenParams {
  title: string;
  url: string;
  showOptions?: boolean;
}

export type BookDetailParams = { isbn: string } | { title: string; author?: string };

export type HomeStackParamList = {
  Home: undefined;
  BarcodeScanner: undefined;
  SearchResult: { title: string };
  BookDetail: BookDetailParams;
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
