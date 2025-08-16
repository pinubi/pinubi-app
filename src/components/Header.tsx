import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title?: string;
  showTitle?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  userPhoto?: string | null;
  className?: string;
  titleClassName?: string;
}

const Header: React.FC<HeaderProps> = ({
  title = 'Pinubi',
  showTitle = true,
  leftElement,
  rightElement,
  onLeftPress,
  onRightPress,
  userPhoto,
  className = '',
  titleClassName = '',
}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate top padding based on platform and safe area
  const topPadding = Platform.select({
    ios: insets.top > 0 ? insets.top : 44, // Use safe area inset or default iOS status bar height
    android: insets.top > 0 ? insets.top + 8 : 24, // Add some extra padding for Android
    default: 24,
  });
  const renderLeftElement = () => {
    if (leftElement) {
      return (
        <TouchableOpacity onPress={onLeftPress} disabled={!onLeftPress}>
          {leftElement}
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderRightElement = () => {
    if (rightElement) {
      return (
        <TouchableOpacity onPress={onRightPress} disabled={!onRightPress}>
          {rightElement}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity onPress={onRightPress} disabled={!onRightPress}>
        <View className='w-10 h-10 bg-gray-200 rounded-full items-center justify-center'>
          <Ionicons name='person-outline' size={16} color='#6B7280' />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View 
      className={`bg-white px-4 pb-3 ${className}`}
      style={{ paddingTop: topPadding }}
    >
      <View className='flex-row items-center justify-between'>
        {/* Left element */}
        <View className='flex-1 items-start'>{renderLeftElement()}</View>

        {/* Title */}
        {showTitle && (
          <View className='flex-2 items-center'>
            <Text className={`text-2xl font-black text-primary-500 tracking-tight ${titleClassName}`}>{title}</Text>
          </View>
        )}

        {/* Right element */}
        <View className='flex-1 items-end'>{renderRightElement()}</View>
      </View>
    </View>
  );
};

export default Header;
