import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

const ListsScreen = () => {
  return (
    <View className="flex-1 bg-white">
      {/* Content */}
      <View className="flex-1 justify-center items-center px-6">
        <Ionicons name="bookmark-outline" size={80} color="#b13bff" />
        <Text className="text-2xl font-bold text-gray-800 mt-4 mb-2">
          Listas
        </Text>
        <Text className="text-gray-600 text-center text-base mb-4">
          Olá, Usuário!
        </Text>
        <Text className="text-gray-600 text-center text-base">
          Organize seu conteúdo com listas personalizadas e coleções.
        </Text>
      </View>
    </View>
  );
};

export default ListsScreen;
