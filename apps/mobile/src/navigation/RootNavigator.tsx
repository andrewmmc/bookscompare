import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AboutStack } from './AboutStack';
import { FavouritesStack } from './FavouritesStack';
import { HomeStack } from './HomeStack';

import { strings } from '../i18n/strings';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

function tabIconName(
  routeName: keyof RootTabParamList,
  focused: boolean
): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case 'HomeTab':
      return 'search';
    case 'FavouritesTab':
      return focused ? 'heart' : 'heart-outline';
    case 'AboutTab':
    default:
      return 'information-circle';
  }
}

export function RootNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
        },
        tabBarLabelStyle: typography.tabLabel,
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons color={color} name={tabIconName(route.name, focused)} size={size} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: strings.tabs.home }} />
      <Tab.Screen
        name="FavouritesTab"
        component={FavouritesStack}
        options={{ title: strings.tabs.favourites }}
      />
      <Tab.Screen name="AboutTab" component={AboutStack} options={{ title: strings.tabs.about }} />
    </Tab.Navigator>
  );
}
