import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Tab {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface FilterTabsProps<T extends string> {
  tabs: Array<{
    id: T;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }>;
  activeTab: T;
  onTabChange: (tabId: T) => void;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
}

function FilterTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  tabClassName = "",
  activeTabClassName = "bg-primary-500",
  inactiveTabClassName = "bg-gray-100",
}: FilterTabsProps<T>) {
  return (
    <View className={`bg-white px-4 py-3 ${className}`}>
      <View className="flex-row">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            className={`flex-row items-center px-4 py-2 rounded-full mr-3 ${
              activeTab === tab.id 
                ? activeTabClassName
                : inactiveTabClassName
            } ${tabClassName}`}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.id ? '#FFFFFF' : '#6B7280'}
              style={{ marginRight: 6 }}
            />
            <Text className={`font-medium ${
              activeTab === tab.id 
                ? 'text-white' 
                : 'text-gray-600'
            }`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default FilterTabs;
