import Header from '@/components/Header';
import {
  CreateEditListBottomSheetPortal,
  ProfileBottomSheetPortal,
  type BottomSheetRef
} from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface ListFormData {
  title: string;
  emoji: string;
  description: string;
  visibility: 'public' | 'private';
  tags: string[];
}

interface ListCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  placesCount: number;
  isPrivate?: boolean;
  isPublic?: boolean;
  backgroundColor?: string;
  onPress?: () => void;
  onLongPress?: () => void;
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
  onLongPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
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
  const profileBottomSheetRef = useRef<BottomSheetRef>(null);
  const createEditListBottomSheetRef = useRef<BottomSheetRef>(null);

  // Hooks
  const { userPhoto } = useAuth();

  const handleProfilePress = () => {
    profileBottomSheetRef.current?.snapToIndex(0);
  };

  const handleCreateList = () => {
    createEditListBottomSheetRef.current?.snapToIndex(0);
  };

  const handleEditList = (listId: string) => {
    // TODO: Load list data and open in edit mode
    console.log('Edit list:', listId);
    createEditListBottomSheetRef.current?.snapToIndex(0);
  };

  const handleSaveList = (data: ListFormData) => {
    // TODO: Implement save list functionality (create or update)
    console.log('Save list data:', data);
    
    // For now, just log the data
    // In the next step, we'll implement the actual Firebase operations
  };

  const handleListPress = (listId: string) => {
    // TODO: Navigate to list details
    console.log('Navigate to list:', listId);
  };

  const handleBack = () => {
    // TODO: Implement back navigation
    console.log('Go back');
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
        userPhoto={userPhoto}
        onRightPress={handleProfilePress}
        onLeftPress={handleBack}        
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
              onLongPress={() => handleEditList('3')}
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
              onLongPress={() => handleEditList('4')}
            />
            <ListCard
              emoji="💕"
              title="DATE NIGHT"
              subtitle="Lugares românticos"
              placesCount={7}
              backgroundColor="bg-pink-500"
              isPrivate={true}
              onPress={() => handleListPress('5')}
              onLongPress={() => handleEditList('5')}
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-6" />
      </ScrollView>

      {/* Profile Bottom Sheet */}
      <ProfileBottomSheetPortal
        ref={profileBottomSheetRef}
        onClose={() => profileBottomSheetRef.current?.close()}
      />

      {/* Create/Edit List Bottom Sheet */}
      <CreateEditListBottomSheetPortal
        ref={createEditListBottomSheetRef}
        mode="create"
        onSave={handleSaveList}
        onClose={() => createEditListBottomSheetRef.current?.close()}
      />
    </View>
  );
};

export default ListsScreen;
