import type { SupportedLocale } from './locale';

interface Dictionary {
  app: {
    brand: string;
  };
  tabs: {
    home: string;
    favourites: string;
    about: string;
    settings: string;
  };
  navigation: {
    home: string;
    barcodeScanner: string;
    searchResult: string;
    favourites: string;
    about: string;
    history: string;
    settings: string;
  };
  home: {
    leadText: string;
    leadTextWithTitleSearch: string;
    isbnTab: string;
    titleTab: string;
    isbnPlaceholder: string;
    titlePlaceholder: string;
    scanAction: string;
    clearAction: string;
    searchAction: string;
    historyAction: string;
  };
  history: {
    title: string;
    emptyTitle: string;
    emptyDescription: string;
    viewedOn: (dateText: string) => string;
    isbnLabel: (isbn: string) => string;
    clearAllAction: string;
    clearAllConfirmTitle: string;
    clearAllConfirmMessage: string;
    clearAllConfirmAction: string;
    cancelAction: string;
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
    fromPrice: (price: string) => string;
    storeCount: (count: number) => string;
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
  favourites: {
    title: string;
    emptyTitle: string;
    emptyDescription: string;
    addedOn: (dateText: string) => string;
    removeAction: string;
    addAccessibilityLabel: string;
    removeAccessibilityLabel: string;
    clearAllAction: string;
    clearAllConfirmTitle: string;
    clearAllConfirmMessage: string;
    clearAllConfirmAction: string;
    cancelAction: string;
  };
  about: {
    title: string;
    version: (appVersion: string, buildNumber: string) => string;
    disclaimer: string;
    items: {
      privacy: string;
      feedback: string;
      copyright: string;
    };
  };
  settings: {
    title: string;
    generalSection: string;
    appearanceSection: string;
    openLinksIn: string;
    openLinksInApp: string;
    openLinksInBrowser: string;
    appearance: string;
    appearanceSystem: string;
    appearanceLight: string;
    appearanceDark: string;
    cancelAction: string;
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
    favourites: '我的收藏',
    about: '關於我們',
    settings: '設定',
  },
  navigation: {
    home: '好書價 BooksCompare',
    barcodeScanner: '國際標準書號掃描',
    searchResult: '搜尋結果',
    favourites: '我的收藏',
    about: '關於我們',
    history: '搜尋記錄',
    settings: '設定',
  },
  home: {
    leadText: '掃描或輸入書本的國際標準書號 (ISBN 碼)，輕鬆找到最心儀的價格！',
    leadTextWithTitleSearch:
      '掃描或輸入書本的國際標準書號 (ISBN 碼)，或直接輸入書名，輕鬆找到最心儀的價格！',
    isbnTab: 'ISBN 碼',
    titleTab: '書名',
    isbnPlaceholder: 'ISBN 碼',
    titlePlaceholder: '輸入書名',
    scanAction: '掃描',
    clearAction: '清除',
    searchAction: '搜尋好書價',
    historyAction: '搜尋記錄',
  },
  history: {
    title: '搜尋記錄',
    emptyTitle: '還沒有任何搜尋記錄',
    emptyDescription: '搜尋或掃描過的書本會出現在這裡，方便您再次查看。',
    viewedOn: (dateText) => `${dateText} 查看`,
    isbnLabel: (isbn) => `ISBN ${isbn}`,
    clearAllAction: '全部清除',
    clearAllConfirmTitle: '清除所有搜尋記錄？',
    clearAllConfirmMessage: '此動作無法復原，所有搜尋記錄都會被移除。',
    clearAllConfirmAction: '全部清除',
    cancelAction: '取消',
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
    fromPrice: (price) => `${price} 起`,
    storeCount: (count) => `${count} 家書店`,
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
  favourites: {
    title: '我的收藏',
    emptyTitle: '還沒有收藏任何書',
    emptyDescription: '在搜尋結果中點擊愛心，將書本加入您的收藏。',
    addedOn: (dateText) => `${dateText} 加入收藏`,
    removeAction: '移除',
    addAccessibilityLabel: '加入收藏',
    removeAccessibilityLabel: '從收藏中移除',
    clearAllAction: '全部清除',
    clearAllConfirmTitle: '清除所有收藏？',
    clearAllConfirmMessage: '此動作無法復原，所有已收藏的書本都會被移除。',
    clearAllConfirmAction: '全部清除',
    cancelAction: '取消',
  },
  about: {
    title: '好書價 BooksCompare',
    version: (appVersion, buildNumber) =>
      `版本 v${appVersion}${buildNumber ? ` (${buildNumber})` : ''}`,
    disclaimer:
      '好書價是獨立的開源專案，與博客來、金石堂、城邦讀書花園、誠品線上等網路書店均無任何隸屬、合作或贊助關係。所有商標屬於其原始持有者，引用僅為描述用途。售價以各書店官方網站為準，App 僅彙整公開資料供讀者參考。',
    items: {
      privacy: '使用條款及私隱政策',
      feedback: '提交意見',
      copyright: '© 2026 Andrew Mok',
    },
  },
  settings: {
    title: '設定',
    generalSection: '一般',
    appearanceSection: '外觀',
    openLinksIn: '開啟連結',
    openLinksInApp: '在 App 內開啟',
    openLinksInBrowser: '在瀏覽器開啟',
    appearance: '外觀',
    appearanceSystem: '跟隨系統',
    appearanceLight: '淺色',
    appearanceDark: '深色',
    cancelAction: '取消',
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
    favourites: 'Favourites',
    about: 'About',
    settings: 'Settings',
  },
  navigation: {
    home: 'BooksCompare',
    barcodeScanner: 'Scan ISBN',
    searchResult: 'Results',
    favourites: 'Favourites',
    about: 'About',
    history: 'History',
    settings: 'Settings',
  },
  home: {
    leadText: "Scan or type an ISBN to find the best price across Taiwan's online bookstores.",
    leadTextWithTitleSearch:
      "Scan an ISBN, or type an ISBN or book title to find the best price across Taiwan's online bookstores.",
    isbnTab: 'ISBN',
    titleTab: 'Title',
    isbnPlaceholder: 'ISBN',
    titlePlaceholder: 'Book title',
    scanAction: 'Scan',
    clearAction: 'Clear',
    searchAction: 'Compare prices',
    historyAction: 'History',
  },
  history: {
    title: 'History',
    emptyTitle: 'No history yet',
    emptyDescription: 'Books you search or scan will appear here for quick access.',
    viewedOn: (dateText) => `Viewed on ${dateText}`,
    isbnLabel: (isbn) => `ISBN ${isbn}`,
    clearAllAction: 'Clear all',
    clearAllConfirmTitle: 'Clear all history?',
    clearAllConfirmMessage: 'This cannot be undone. All search and scan history will be removed.',
    clearAllConfirmAction: 'Clear all',
    cancelAction: 'Cancel',
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
    fromPrice: (price) => `from ${price}`,
    storeCount: (count) => `${count} ${count === 1 ? 'store' : 'stores'}`,
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
  favourites: {
    title: 'Favourites',
    emptyTitle: 'No favourites yet',
    emptyDescription: 'Tap the heart on a search result to save it here.',
    addedOn: (dateText) => `Added on ${dateText}`,
    removeAction: 'Remove',
    addAccessibilityLabel: 'Add to favourites',
    removeAccessibilityLabel: 'Remove from favourites',
    clearAllAction: 'Clear all',
    clearAllConfirmTitle: 'Clear all favourites?',
    clearAllConfirmMessage: 'This cannot be undone. All saved books will be removed.',
    clearAllConfirmAction: 'Clear all',
    cancelAction: 'Cancel',
  },
  about: {
    title: 'BooksCompare',
    version: (appVersion, buildNumber) =>
      `Version v${appVersion}${buildNumber ? ` (${buildNumber})` : ''}`,
    disclaimer:
      'BooksCompare is an independent open-source project and is not affiliated with, partnered with, or sponsored by Books.com.tw, KingStone, Cite Book Garden, eslite.com, or any other online bookstore. All trademarks belong to their original owners and are referenced for descriptive purposes only. Prices are based on each bookstore’s official website; the app only aggregates public information for readers’ reference.',
    items: {
      privacy: 'Terms & Privacy Policy',
      feedback: 'Send feedback',
      copyright: '© 2026 Andrew Mok',
    },
  },
  settings: {
    title: 'Settings',
    generalSection: 'General',
    appearanceSection: 'Appearance',
    openLinksIn: 'Open links',
    openLinksInApp: 'In app',
    openLinksInBrowser: 'Browser',
    appearance: 'Appearance',
    appearanceSystem: 'System',
    appearanceLight: 'Light',
    appearanceDark: 'Dark',
    cancelAction: 'Cancel',
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
