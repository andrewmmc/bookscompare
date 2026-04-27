import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AboutStack } from './AboutStack';
import { HomeStack } from './HomeStack';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator() {
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
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            color={color}
            name={route.name === 'HomeTab' ? 'search' : 'information-circle'}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: '書本搜尋' }} />
      <Tab.Screen name="AboutTab" component={AboutStack} options={{ title: '關於我們' }} />
    </Tab.Navigator>
  );
}
