<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of your project. BooksCompare already had a solid analytics foundation — `posthog-react-native` was installed and a custom analytics abstraction layer (`src/analytics/`) wrapped the SDK with `track()`, `identify()`, and `register()` helpers. This session verified and completed that setup:

- **Environment variables** set: `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` written to `apps/mobile/.env`.
- **SDK already configured**: `app.config.ts` reads the env vars and passes them as `Constants.expoConfig.extra.posthogKey` / `posthogHost`; the PostHog client initialises lazily on first `initAnalytics()` call in `App.tsx`.
- **Three new events added** to `SearchResultScreen.tsx` to cover the search result state: `search_result_loaded`, `search_result_empty`, and `search_result_error`.
- All pre-existing events across every screen were documented (22 total, including 3 newly added).

| Event                             | Description                                           | File                                                      |
| --------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| `home_click_search`               | User taps Search with a valid ISBN                    | `apps/mobile/src/screens/home/HomeScreen.tsx`             |
| `home_click_search_title`         | User taps Search with a title query                   | `apps/mobile/src/screens/home/HomeScreen.tsx`             |
| `home_change_mode`                | User switches between ISBN and title search modes     | `apps/mobile/src/screens/home/HomeScreen.tsx`             |
| `home_type_isbn`                  | User types in the ISBN input                          | `apps/mobile/src/screens/home/HomeScreen.tsx`             |
| `home_type_title`                 | User types in the title input                         | `apps/mobile/src/screens/home/HomeScreen.tsx`             |
| `home_click_scan`                 | User opens the barcode scanner                        | `apps/mobile/src/screens/home/HomeScreen.tsx`             |
| `barcode_scanner_valid_barcode`   | Scanner reads a valid ISBN                            | `apps/mobile/src/screens/home/BarcodeScannerScreen.tsx`   |
| `barcode_scanner_invalid_barcode` | Scanner reads a non-ISBN code                         | `apps/mobile/src/screens/home/BarcodeScannerScreen.tsx`   |
| `search_result_loaded` ✨         | Search returned results successfully (+ count & type) | `apps/mobile/src/screens/home/SearchResultScreen.tsx`     |
| `search_result_empty` ✨          | Search completed with no results (+ type)             | `apps/mobile/src/screens/home/SearchResultScreen.tsx`     |
| `search_result_error` ✨          | Search failed with a network/API error (+ type)       | `apps/mobile/src/screens/home/SearchResultScreen.tsx`     |
| `search_result_open_offer`        | User taps a bookstore offer row                       | `apps/mobile/src/screens/home/SearchResultScreen.tsx`     |
| `favourite_add`                   | Book added to favourites (+ isbn, source)             | `apps/mobile/src/screens/home/SearchResultScreen.tsx`     |
| `favourite_remove`                | Book removed from favourites (+ isbn, source)         | `apps/mobile/src/screens/home/SearchResultScreen.tsx`     |
| `favourites_open_book`            | User opens a book from the Favourites list            | `apps/mobile/src/screens/favourites/FavouritesScreen.tsx` |
| `favourites_click_clear_all`      | User taps "Clear All" in Favourites                   | `apps/mobile/src/screens/favourites/FavouritesScreen.tsx` |
| `favourites_clear_all_confirm`    | User confirms clearing all favourites                 | `apps/mobile/src/screens/favourites/FavouritesScreen.tsx` |
| `history_open_entry`              | User opens a history entry                            | `apps/mobile/src/screens/home/HistoryScreen.tsx`          |
| `history_click_clear_all`         | User taps "Clear All" in History                      | `apps/mobile/src/screens/home/HistoryScreen.tsx`          |
| `history_clear_all_confirm`       | User confirms clearing all history                    | `apps/mobile/src/screens/home/HistoryScreen.tsx`          |
| `settings_change`                 | User changes a setting (+ key, value)                 | `apps/mobile/src/screens/about/SettingsScreen.tsx`        |
| `about_open_settings`             | User navigates to Settings from About                 | `apps/mobile/src/screens/about/AboutScreen.tsx`           |
| `about_open_link`                 | User taps an external link on the About screen        | `apps/mobile/src/screens/about/AboutScreen.tsx`           |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1647953)
- [Searches over time](/insights/CAYb3UlS) — ISBN and title search volume per day
- [Search-to-results conversion funnel](/insights/eeGG3oD4) — How many searches produce loaded results
- [Barcode scanner usage](/insights/hgjuxVaB) — Scanner opens, valid and invalid scans
- [Favourites engagement](/insights/UPksRnBD) — Books added and removed from favourites
- [Bookstore offer click-through](/insights/CKSrymUo) — Users tapping through to bookstore pages

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
