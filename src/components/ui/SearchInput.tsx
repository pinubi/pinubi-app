import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder = 'Buscar lugares...',
  autoFocus = false,
}) => {
  return (
    <View className="px-2 py-2">
      <View className="bg-gray-100 rounded-xl flex-row items-center px-4 py-3">
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          autoFocus={autoFocus}
          className="flex-1 ml-3 text-base text-gray-900"
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')}>
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default SearchInput;
