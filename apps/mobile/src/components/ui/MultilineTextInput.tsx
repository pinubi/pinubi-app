import React, { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

interface MultilineTextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  maxLength?: number;
  minHeight?: number;
  maxHeight?: number;
  numberOfLines?: number;
  error?: string;
  disabled?: boolean;
  showCharacterCounter?: boolean;
}

export const MultilineTextInput = React.memo(function MultilineTextInput({
  label,
  placeholder = "Digite aqui...",
  value,
  onChangeText,
  maxLength = 500,
  minHeight = 100,
  numberOfLines = 3,
  error,
  disabled = false,
  showCharacterCounter = true,
}: MultilineTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Memoize className to prevent unnecessary re-renders
  const inputClassName = useMemo(() => {
    let baseClasses = 'bg-gray-50 rounded-xl px-4 py-3 text-gray-900';
    
    if (isFocused) {
      baseClasses += ' border border-primary-500';
    } else {
      baseClasses += ' border border-transparent';
    }
    
    if (error) {
      baseClasses += ' border-red-500';
    }
    
    if (disabled) {
      baseClasses += ' bg-gray-100 opacity-60';
    }
    
    return baseClasses;
  }, [isFocused, error, disabled]);

  return (
    <View className="w-full">
      {/* Label */}
      {label && (
        <Text className="text-gray-700 text-sm font-medium mb-2">
          {label}
        </Text>
      )}
      
      {/* TextInput */}
      <TextInput
        key={`multiline-${placeholder}`}
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        maxLength={maxLength}
        editable={!disabled}
        className={inputClassName}
        style={{
          minHeight,
          fontSize: 16,
          lineHeight: 24,
          textAlignVertical: 'top',
        }}
      />

      {/* Character Counter and Error */}
      <View className="flex-row justify-between items-center mt-1">
        {error ? (
          <Text className="text-red-500 text-xs flex-1">
            {error}
          </Text>
        ) : (
          <View />
        )}
        
        {showCharacterCounter && maxLength && (
          <Text className={`text-xs ${
            value.length > maxLength * 0.9 ? 'text-red-500' : 'text-gray-500'
          }`}>
            {value.length}/{maxLength} caracteres
          </Text>
        )}
      </View>
    </View>
  );
});
