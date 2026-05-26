import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';

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
      return focused ? 'search' : 'search-outline';
    case 'FavouritesTab':
      return focused ? 'heart' : 'heart-outline';
    case 'AboutTab':
    default:
      return focused ? 'information-circle' : 'information-circle-outline';
  }
}

export function RootNavigator() {
  const { colors, scheme } = useTheme();
  const blurTint = scheme === 'dark' ? 'dark' : 'light';
  const useBlur = Platform.OS === 'ios';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: useBlur
          ? {
              position: 'absolute',
              backgroundColor: 'transparent',
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.divider,
              elevation: 0,
            }
          : {
              backgroundColor: colors.surface,
              borderTopColor: colors.divider,
            },
        ...(useBlur
          ? {
              tabBarBackground: () => (
                <BlurView intensity={70} tint={blurTint} style={StyleSheet.absoluteFill} />
              ),
            }
          : {}),
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
