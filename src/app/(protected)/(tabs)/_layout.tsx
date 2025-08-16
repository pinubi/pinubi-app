import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

// Types for better TypeScript support
type IconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  color: string;
  size: number;
  focused: boolean;
}

interface TabConfig {
  name: string;
  title: string;
  icon: IconName;
  iconFocused: IconName;
}

const TabsLayout = () => {
  // Force light mode - no more dark mode support
  const isDark = false;

  // Haptic feedback for tab presses
  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Tab configuration - more contextual to Pinubi's purpose
  const tabsConfig: TabConfig[] = [
    {
      name: 'discover',
      title: 'Descobrir',
      icon: 'search-outline',
      iconFocused: 'search',
    },
    {
      name: 'social',
      title: 'Social',
      icon: 'people-outline',
      iconFocused: 'people',
    },
    {
      name: 'lists',
      title: 'Listas',
      icon: 'bookmark-outline',
      iconFocused: 'bookmark',
    },
  ];

  // Light mode colors only
  const colors = {
    background: '#ffffff',
    headerBackground: '#ffffff',
    headerTitle: '#18181b',
    tabBarBorder: '#e4e4e7',
    tabBarActive: '#b13bff', // Primary-500 from theme
    tabBarInactive: '#a1a1aa', // Light mode neutral color
  };

  const TabIcon = ({ name, iconFocused, color, size, focused }: TabIconProps & { name: IconName; iconFocused: IconName }) => (
    <Ionicons 
      name={focused ? iconFocused : name} 
      size={size} 
      color={color}
    />
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.headerBackground,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 0,
          borderBottomColor: colors.tabBarBorder,
        },
        headerTitleStyle: {
          color: colors.headerTitle,
          fontSize: 18,
          fontWeight: '600',
          fontFamily: 'Poppins_600SemiBold',
        },
        headerTintColor: colors.headerTitle,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 34 : 12,
          paddingTop: 8,
          position: 'absolute',
          shadowColor: '#00000010',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          fontFamily: 'Poppins_500Medium',
          marginTop: 2,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarHideOnKeyboard: Platform.OS === 'android',
      }}
      screenListeners={{
        tabPress: handleTabPress,
      }}
    >
      {tabsConfig.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size, focused }) => (
              <TabIcon
                name={tab.icon}
                iconFocused={tab.iconFocused}
                color={color}
                size={size}
                focused={focused}
              />
            ),
            tabBarAccessibilityLabel: `Aba ${tab.title}`,
          }}
        />
      ))}
    </Tabs>
  );
};

export default TabsLayout;
