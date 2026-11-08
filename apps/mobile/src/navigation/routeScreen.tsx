import { useNavigation, useRoute } from 'expo-router';

import type { ComponentType } from 'react';

interface ScreenNavigationProps {
  navigation: unknown;
  route: unknown;
}

/**
 * Turns a screen that takes React Navigation `navigation`/`route` props into an Expo Router route
 * component. Expo Router does not pass those props, so they are read from the screen's context.
 */
export function routeScreen<P extends ScreenNavigationProps>(Screen: ComponentType<P>) {
  function RouteScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    return <Screen {...({ navigation, route } as P)} />;
  }
  RouteScreen.displayName = `RouteScreen(${Screen.displayName ?? Screen.name})`;
  return RouteScreen;
}
