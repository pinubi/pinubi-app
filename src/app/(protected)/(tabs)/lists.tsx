import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface ListCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  placesCount: number;
  isPrivate?: boolean;
  isPublic?: boolean;
  backgroundColor?: string;
  onPress?: () => void;
}

const ListCard: React.FC<ListCardProps> = ({
  emoji,
  title,
  subtitle,
  placesCount,
  isPrivate = false,
  isPublic = false,
  backgroundColor = 'bg-orange-500',
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-1 mx-1 mb-4"
      style={{ elevation: 2 }}
    >
      {/* Emoji Icon */}
      <View className={`w-12 h-12 ${backgroundColor} rounded-xl items-center justify-center mb-3`}>
        <Text className="text-xl">{emoji}</Text>
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900 mb-1">
          {title}
        </Text>
        <Text className="text-sm text-gray-600 flex-1 leading-relaxed">
          {subtitle}
        </Text>
        
        {/* Footer */}
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-sm text-gray-500">
            {placesCount} lugares
          </Text>
          <View className="w-4 h-4 items-center justify-center">
            {isPrivate && (
              <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
            )}
            {isPublic && (
              <Ionicons name="globe-outline" size={14} color="#9CA3AF" />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const NewListCard: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 flex-1 mx-1 mb-4 border-2 border-dashed border-gray-300 items-center justify-center min-h-[180px]"
    >
      <View className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center mb-3">
        <Ionicons name="add" size={24} color="#9CA3AF" />
      </View>
      <Text className="text-base font-medium text-gray-600 text-center">
        NOVA LISTA
      </Text>
    </TouchableOpacity>
  );
};

const ListsScreen = () => {
  const handleCreateList = () => {
    // TODO: Implement create list functionality
    console.log('Create new list');
  };

  const handleListPress = (listId: string) => {
    // TODO: Navigate to list details
    console.log('Navigate to list:', listId);
  };

  const handleBack = () => {
    // TODO: Implement back navigation
    console.log('Go back');
  };

  const handleAddPress = () => {
    // TODO: Implement add functionality
    console.log('Add pressed');
  };

  // Mock data for lists
  const lists = [
    {
      id: '1',
      emoji: '🍽️',
      title: 'CRAVED',
      subtitle: 'Lugares que você quer visitar',
      placesCount: 12,
      backgroundColor: 'bg-yellow-500',
    },
    {
      id: '2', 
      emoji: '🍕',
      title: 'RATING & REVIEWS',
      subtitle: 'Lugares que você já avaliou',
      placesCount: 8,
      backgroundColor: 'bg-orange-500',
    },
    {
      id: '3',
      emoji: '🍰',
      title: 'HAMBURGUERIAS',
      subtitle: 'Melhores hambúrgueres da cidade',
      placesCount: 5,
      backgroundColor: 'bg-yellow-500',
      isPublic: true,
    },
    {
      id: '4',
      emoji: '☕',
      title: 'CAFETERIAS',
      subtitle: 'Cafés especiais para trabalhar',
      placesCount: 12,
      backgroundColor: 'bg-orange-600',
      isPrivate: true,
    },
    {
      id: '5',
      emoji: '💕',
      title: 'DATE NIGHT',
      subtitle: 'Lugares românticos',
      placesCount: 7,
      backgroundColor: 'bg-pink-500',
      isPrivate: true,
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <Header
        title="Pinubi"
        leftElement={
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </TouchableOpacity>
        }        
        rightElement={
          <View className="flex-row items-center">
            {/* Points indicator */}
            <View className="flex-row items-center mr-3">
              <View className="w-2 h-2 bg-primary-500 rounded-full mr-2" />
              <Text className="text-sm font-medium text-gray-700">
                0 pontos
              </Text>
            </View>
            {/* Add button */}
            <TouchableOpacity 
              onPress={handleAddPress}
              className="w-10 h-10 bg-primary-500 rounded-full items-center justify-center"
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        }
        onLeftPress={handleBack}
        onRightPress={handleAddPress}
        className="bg-white border-b border-gray-100"
      />

      {/* Content */}
      <ScrollView 
        className="flex-1 px-4 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Lists Grid */}
        <View className="flex-row flex-wrap justify-between">
          {/* Row 1 */}
          <View className="w-full flex-row mb-0">
            <ListCard
              emoji="🍽️"
              title="VISITAR"
              subtitle="Lugares que você quer visitar"
              placesCount={12}
              backgroundColor="bg-yellow-500"
              onPress={() => handleListPress('1')}
            />
            <ListCard
              emoji="🍕"
              title="NOTAS & REVIEWS"
              subtitle="Lugares que você já avaliou"
              placesCount={8}
              backgroundColor="bg-orange-500"
              onPress={() => handleListPress('2')}
            />
          </View>

          {/* Row 2 */}
          <View className="w-full flex-row mb-0">
            <NewListCard onPress={handleCreateList} />
            <ListCard
              emoji="🍰"
              title="HAMBURGUERIAS"
              subtitle="Melhores hambúrgueres da cidade"
              placesCount={5}
              backgroundColor="bg-yellow-500"
              isPublic={true}
              onPress={() => handleListPress('3')}
            />
          </View>

          {/* Row 3 */}
          <View className="w-full flex-row mb-0">
            <ListCard
              emoji="☕"
              title="CAFETERIAS"
              subtitle="Cafés especiais para trabalhar"
              placesCount={12}
              backgroundColor="bg-orange-600"
              isPrivate={true}
              onPress={() => handleListPress('4')}
            />
            <ListCard
              emoji="💕"
              title="DATE NIGHT"
              subtitle="Lugares românticos"
              placesCount={7}
              backgroundColor="bg-pink-500"
              isPrivate={true}
              onPress={() => handleListPress('5')}
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
};

export default ListsScreen;
