import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { AutocompleteResult } from '@/types/googlePlaces';

interface AutocompleteListProps {
  results: AutocompleteResult[];
  onResultPress: (result: AutocompleteResult) => void;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

const AutocompleteItem: React.FC<{
  result: AutocompleteResult;
  onPress: (result: AutocompleteResult) => void;
}> = ({ result, onPress }) => {
  // Selecionar ícone baseado no tipo
  const getIcon = () => {
    if (result.isRestaurant) {
      return { name: 'restaurant' as const, color: '#F59E0B' };
    }
    if (result.isTouristAttraction) {
      return { name: 'camera' as const, color: '#10B981' };
    }
    return { name: 'location' as const, color: '#6B7280' };
  };

  const icon = getIcon();

  return (
    <TouchableOpacity
      onPress={() => onPress(result)}
      className="flex-row items-center px-4 py-3 border-b border-gray-50"
      activeOpacity={0.7}
    >
      {/* Ícone do tipo de lugar */}
      <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
        <Ionicons name={icon.name} size={18} color={icon.color} />
      </View>

      {/* Informações do lugar */}
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900 mb-1" numberOfLines={1}>
          {result.title}
        </Text>
        {result.subtitle && (
          <Text className="text-sm text-gray-600" numberOfLines={1}>
            {result.subtitle}
          </Text>
        )}
        
        {/* Badges para tipo de lugar */}
        {(result.isRestaurant || result.isTouristAttraction) && (
          <View className="flex-row mt-1">
            {result.isRestaurant && (
              <View className="bg-amber-100 px-2 py-1 rounded-full mr-2">
                <Text className="text-xs text-amber-700 font-medium">Restaurante</Text>
              </View>
            )}
            {result.isTouristAttraction && (
              <View className="bg-emerald-100 px-2 py-1 rounded-full">
                <Text className="text-xs text-emerald-700 font-medium">Atração</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Seta indicativa */}
      <Ionicons name="arrow-up-outline" size={16} color="#9CA3AF" style={{ transform: [{ rotate: '45deg' }] }} />
    </TouchableOpacity>
  );
};

const AutocompleteList: React.FC<AutocompleteListProps> = ({
  results,
  onResultPress,
  loading = false,
  error = null,
  emptyMessage = 'Digite para buscar lugares...',
}) => {
  // Estado de loading
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons name="search" size={32} color="#D1D5DB" />
        <Text className="text-gray-600 text-center mt-2">Buscando lugares...</Text>
      </View>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons name="warning-outline" size={32} color="#EF4444" />
        <Text className="text-red-600 text-center mt-2 font-medium">Erro na busca</Text>
        <Text className="text-gray-600 text-center mt-1 text-sm">{error}</Text>
      </View>
    );
  }

  // Estado vazio
  if (results.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons name="search-outline" size={32} color="#D1D5DB" />
        <Text className="text-gray-600 text-center mt-2">{emptyMessage}</Text>
      </View>
    );
  }

  // Lista de resultados
  return (
    <View className="flex-1">
      {/* Cabeçalho da lista */}
      <View className="px-4 py-2 bg-gray-50 border-b border-gray-100">
        <Text className="text-sm font-medium text-gray-700">
          {String(results.length)} {results.length === 1 ? 'lugar encontrado' : 'lugares encontrados'}
        </Text>
      </View>

      {/* Lista de resultados */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <AutocompleteItem result={item} onPress={onResultPress} />
        )}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

export default AutocompleteList;
