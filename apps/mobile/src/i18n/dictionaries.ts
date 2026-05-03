import type { SupportedLocale } from './locale';

interface Dictionary {
  app: {
    brand: string;
  };
  tabs: {
    home: string;
    about: string;
  };
  navigation: {
    home: string;
    barcodeScanner: string;
    searchResult: string;
    about: string;
  };
  home: {
    leadText: string;
    isbnTab: string;
    titleTab: string;
    isbnPlaceholder: string;
    titlePlaceholder: string;
    scanAction: string;
    searchAction: string;
  };
  scanner: {
    permissionCheckingLabel: string;
    permissionRequiredTitle: string;
    permissionRequiredDescription: string;
    permissionRequiredAction: string;
    helpText: string;
  };
  searchResult: {
    sourceStatus: { ready: string; error: string; disabled: string };
    sourceChipsAccessibilityLabel: string;
    ebookBadge: string;
    resultsCount: (count: number) => string;
    loadingLabel: string;
    networkErrorTitle: string;
    networkErrorDescription: string;
    retryAction: string;
    allErroredTitle: string;
    allErroredDescription: string;
    notLiveTitle: string;
    notLiveDescription: string;
    notFoundTitle: string;
    notFoundDescription: string;
  };
  priceTag: {
    discountTag: (discountRate: number) => string;
  };
  about: {
    title: string;
    version: (appVersion: string, buildNumber: string) => string;
    items: {
      privacy: string;
      declaration: string;
      feedback: string;
      copyright: string;
    };
  };
  webview: {
    shareAccessibility: string;
    loadingLabel: string;
    notFoundTitle: string;
    notFoundDescription: string;
    notFoundAction: string;
    errorTitle: string;
    errorDescription: string;
    errorAction: string;
  };
  loading: {
    defaultLabel: string;
  };
}

const zhTW: Dictionary = {
  app: {
    brand: '好書價 BooksCompare',
  },
  tabs: {
    home: '書本搜尋',
    about: '關於我們',
  },
  navigation: {
    home: '好書價 BooksCompare',
    barcodeScanner: '國際標準書號掃描',
    searchResult: '搜尋結果',
    about: '關於我們',
  },
  home: {
    leadText: '掃描或輸入書本的國際標準書號 (ISBN 碼)，或直接輸入書名，輕鬆找到最心儀的價格！',
    isbnTab: 'ISBN 碼',
    titleTab: '書名',
    isbnPlaceholder: 'ISBN 碼',
    titlePlaceholder: '輸入書名',
    scanAction: '掃描',
    searchAction: '搜尋好書價',
  },
  scanner: {
    permissionCheckingLabel: '正在檢查相機權限…',
    permissionRequiredTitle: '需要相機權限',
    permissionRequiredDescription: '請允許相機存取，才能直接掃描書本背面的 ISBN 條碼。',
    permissionRequiredAction: '允許相機權限',
    helpText: '請將國際標準書號 (ISBN 碼) 放進掃描框內。',
  },
  searchResult: {
    sourceStatus: {
      ready: '已比對',
      error: '暫時無法連線',
      disabled: '尚未支援',
    },
    sourceChipsAccessibilityLabel: '書店狀態',
    ebookBadge: '電子書',
    resultsCount: (count) => `共找到 ${count} 個結果。`,
    loadingLabel: '正在比對最新書價…',
    networkErrorTitle: '未能載入內容',
    networkErrorDescription: '請檢查您的網絡連接。\n如持續遇到此問題，請聯絡我們以取得協助。',
    retryAction: '重新載入',
    allErroredTitle: '書店暫時無法回應',
    allErroredDescription: '所有書店連線都失敗了。\n請稍後再試，或下拉重新整理。',
    notLiveTitle: '即時搜尋尚未啟用',
    notLiveDescription: '目前沒有可用的書店即時資料。\n請稍後再試。',
    notFoundTitle: '未能找到結果',
    notFoundDescription:
      '抱歉，找不到所搜尋書本的價格資料。\n您慣用的網絡書店不在名單上？\n歡迎提交意見給我們！',
  },
  priceTag: {
    discountTag: (discountRate) => `${discountRate}折`,
  },
  about: {
    title: '好書價 BooksCompare',
    version: (appVersion, buildNumber) =>
      `版本 v${appVersion}${buildNumber ? ` (${buildNumber})` : ''}`,
    items: {
      privacy: '使用條款及私隱政策',
      declaration: '免責聲明',
      feedback: '提交意見',
      copyright: '(c) 2026 Andrew Mok',
    },
  },
  webview: {
    shareAccessibility: '分享',
    loadingLabel: '正在打開書店頁面…',
    notFoundTitle: '頁面仍在準備中',
    notFoundDescription: '這個連結目前回傳 404。等 marketing site 上線後，這些頁面會直接顯示。',
    notFoundAction: '在瀏覽器開啟',
    errorTitle: '未能載入內容',
    errorDescription: '請檢查您的網絡連接。如持續遇到此問題，請稍後再試。',
    errorAction: '在瀏覽器開啟',
  },
  loading: {
    defaultLabel: '載入中…',
  },
};

const en: Dictionary = {
  app: {
    brand: 'BooksCompare',
  },
  tabs: {
    home: 'Search',
    about: 'About',
  },
  navigation: {
    home: 'BooksCompare',
    barcodeScanner: 'Scan ISBN',
    searchResult: 'Results',
    about: 'About',
  },
  home: {
    leadText:
      "Scan an ISBN, or type an ISBN or book title to find the best price across Taiwan's online bookstores.",
    isbnTab: 'ISBN',
    titleTab: 'Title',
    isbnPlaceholder: 'ISBN',
    titlePlaceholder: 'Book title',
    scanAction: 'Scan',
    searchAction: 'Compare prices',
  },
  scanner: {
    permissionCheckingLabel: 'Checking camera permission…',
    permissionRequiredTitle: 'Camera permission needed',
    permissionRequiredDescription:
      'Allow camera access so we can scan the ISBN barcode on the back cover.',
    permissionRequiredAction: 'Grant camera permission',
    helpText: 'Position the ISBN barcode inside the frame.',
  },
  searchResult: {
    sourceStatus: {
      ready: 'Available',
      error: 'Unreachable',
      disabled: 'Not supported',
    },
    sourceChipsAccessibilityLabel: 'Bookstore status',
    ebookBadge: 'eBook',
    resultsCount: (count) => `Found ${count} ${count === 1 ? 'result' : 'results'}.`,
    loadingLabel: 'Comparing the latest prices…',
    networkErrorTitle: 'Could not load content',
    networkErrorDescription:
      'Please check your internet connection.\nIf the issue persists, contact us for help.',
    retryAction: 'Retry',
    allErroredTitle: 'Bookstores are not responding',
    allErroredDescription:
      'All bookstore connections failed.\nPlease try again later or pull to refresh.',
    notLiveTitle: 'Live search is not yet enabled',
    notLiveDescription: 'No live bookstore data is available right now.\nPlease try again later.',
    notFoundTitle: 'No results found',
    notFoundDescription:
      "Sorry, we couldn't find pricing for that book.\nIs your favourite bookstore missing?\nLet us know!",
  },
  priceTag: {
    discountTag: (discountRate) => `${discountRate}% list`,
  },
  about: {
    title: 'BooksCompare',
    version: (appVersion, buildNumber) =>
      `Version v${appVersion}${buildNumber ? ` (${buildNumber})` : ''}`,
    items: {
      privacy: 'Terms & Privacy Policy',
      declaration: 'Disclaimer',
      feedback: 'Send feedback',
      copyright: '(c) 2026 Andrew Mok',
    },
  },
  webview: {
    shareAccessibility: 'Share',
    loadingLabel: 'Opening the bookstore…',
    notFoundTitle: 'Page is not ready yet',
    notFoundDescription:
      'This link currently returns 404. Once the marketing site is live, this page will load here.',
    notFoundAction: 'Open in browser',
    errorTitle: 'Could not load content',
    errorDescription:
      'Please check your internet connection. If the issue persists, please try again later.',
    errorAction: 'Open in browser',
  },
  loading: {
    defaultLabel: 'Loading…',
  },
};

export const dictionaries: Record<SupportedLocale, Dictionary> = {
  'zh-TW': zhTW,
  en,
};

export type { Dictionary };
