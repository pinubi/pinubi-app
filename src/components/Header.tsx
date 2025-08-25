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
  rightIcon?: keyof typeof Ionicons.glyphMap;
  secondaryRightIcon?: keyof typeof Ionicons.glyphMap;
  onSecondaryRightPress?: () => void;
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
  rightIcon,
  secondaryRightIcon,
  onSecondaryRightPress,
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
    
    // Default back button for navigation
    if (onLeftPress) {
      return (
        <TouchableOpacity onPress={onLeftPress} className='w-10 h-10 items-center justify-center'>
          <Ionicons name='arrow-back' size={24} color='#374151' />
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
      <View className='flex-row items-center gap-2'>
        {/* Primary right icon */}
        {rightIcon && onRightPress && (
          <TouchableOpacity 
            onPress={onRightPress} 
            className='w-10 h-10 items-center justify-center'
          >
            <Ionicons name={rightIcon} size={24} color='#374151' />
          </TouchableOpacity>
        )}
        
        {/* Secondary right icon */}
        {secondaryRightIcon && onSecondaryRightPress && (
          <TouchableOpacity 
            onPress={onSecondaryRightPress}
            className='w-10 h-10 items-center justify-center'
          >
            <Ionicons name={secondaryRightIcon} size={24} color='#374151' />
          </TouchableOpacity>
        )}
        
        {/* Default user profile icon if no custom icons */}
        {!rightIcon && !secondaryRightIcon && (
          <TouchableOpacity onPress={onRightPress} disabled={!onRightPress}>
            <View className='w-10 h-10 bg-gray-200 rounded-full items-center justify-center'>
              <Ionicons name='person-outline' size={16} color='#6B7280' />
            </View>
          </TouchableOpacity>
        )}
      </View>
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
