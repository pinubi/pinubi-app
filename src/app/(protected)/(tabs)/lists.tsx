import Header from '@/components/Header';
import { CreateEditListBottomSheetPortal, ProfileBottomSheetPortal, type BottomSheetRef } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useLists } from '@/hooks/useLists';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import type { ListFormData } from '@/types/lists';

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
  isPublic = false,
  backgroundColor = 'bg-orange-500',
  onPress,
  onLongPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      className='bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-1 mx-1 mb-4 h-[180px] max-w-[196px]'
      style={{ elevation: 2 }}
    >
      {/* Emoji Icon */}
      <View className={`w-12 h-12 ${backgroundColor} rounded-xl items-center justify-center mb-3`}>
        <Text className='text-xl'>{emoji}</Text>
      </View>

      {/* Content */}
      <View className='flex-1'>
        <Text className='text-base font-semibold text-gray-900 mb-1' numberOfLines={1} ellipsizeMode='tail'>{title}</Text>
        <Text className='text-sm text-gray-600 flex-1 leading-relaxed' numberOfLines={2} ellipsizeMode='tail'>{subtitle}</Text>

        {/* Footer */}
        <View className='flex-row items-center justify-between mt-2'>
          <Text className='text-sm text-gray-500'>{placesCount} lugares</Text>
          <View className='w-4 h-4 items-center justify-center'>
            {isPublic ? (
              <Ionicons name='globe-outline' size={14} color='#9CA3AF' />
            ) : (
              <Ionicons name='lock-closed' size={14} color='#9CA3AF' />
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
      className='bg-white rounded-2xl p-4 flex-1 mx-1 mb-4 border-2 border-dashed border-gray-300 items-center justify-center h-[180px] max-w-[196px]'
    >
      <View className='w-12 h-12 bg-gray-100 rounded-xl items-center justify-center mb-3'>
        <Ionicons name='add' size={24} color='#9CA3AF' />
      </View>
      <Text className='text-base font-medium text-gray-600 text-center'>NOVA LISTA</Text>
    </TouchableOpacity>
  );
};

const ListsScreen = () => {
  const router = useRouter();
  const profileBottomSheetRef = useRef<BottomSheetRef>(null);
  const createEditListBottomSheetRef = useRef<BottomSheetRef>(null);

  // Check if we need to reopen profile bottom sheet when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const checkReopenFlag = async () => {
        try {
          const shouldReopen = await AsyncStorage.getItem('shouldReopenProfileBottomSheet');
          if (shouldReopen === 'true') {
            // Clear the flag
            await AsyncStorage.removeItem('shouldReopenProfileBottomSheet');
            // Reopen the profile bottom sheet with a small delay
            setTimeout(() => {
              profileBottomSheetRef.current?.snapToIndex(0);
            }, 100);
          }
        } catch (error) {
          console.error('Error checking reopen flag:', error);
        }
      };

      checkReopenFlag();
    }, [])
  );

  // Hooks
  const { userPhoto } = useAuth();
  const { 
    lists, 
    loading, 
    error, 
    createList, 
    updateList, 
    clearError,
    favoritesList,
    wantToVisitList,
    customLists 
  } = useLists();

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

  const handleSaveList = async (data: ListFormData) => {
    try {
      console.log('Save list data:', data);
      
      const result = await createList(data);
      if (result) {
        console.log('Successfully created list:', result.id);
        // Bottom sheet will close automatically due to successful creation
      } else {
        // Error handled by the store, show alert if needed
        if (error) {
          Alert.alert('Erro', error);
        }
      }
    } catch (err) {
      console.error('Unexpected error creating list:', err);
      Alert.alert('Erro', 'Não foi possível criar a lista. Tente novamente.');
    }
  };

  const handleListPress = (listId: string) => {
    // Find the list data
    const list = lists.find((l) => l.id === listId);
    if (list) {
      router.push({
        pathname: '/(protected)/viewList',
        params: {
          listId: list.id,
          title: list.title,
          emoji: list.emoji,
          description: list.description,
          canDelete: list.canDelete ? 'true' : 'false',
          canRename: list.canRename ? 'true' : 'false',
          placesCount: list.placesCount.toString(),
          isPublic: list.visibility === 'public' ? 'true' : 'false',
        },
      });
    }
  };

  // Clear error when component unmounts or user dismisses
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000); // Clear error after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Helper function to get background color based on emoji or index
  const getBackgroundColor = (emoji: string, index: number): string => {
    const colors = [
      'bg-orange-500',
      'bg-yellow-500', 
      'bg-pink-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-indigo-500',
    ];
    return colors[index % colors.length] || 'bg-orange-500';
  };

  return (
    <View className='flex-1 bg-gray-50'>
      {/* Header */}
      <Header
        title='Pinubi'
        userPhoto={userPhoto}
        onRightPress={handleProfilePress}        
        className='bg-white border-b border-gray-100'
      />

      {/* Content */}
      <ScrollView className='flex-1 px-4 pt-6' showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {loading && (
          <View className='flex-1 items-center justify-center py-20'>
            <ActivityIndicator size="large" color='#b13bff' />
            <Text className='text-gray-600 mt-4'>Carregando suas listas...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
            <Text className='text-red-800 font-medium'>{error}</Text>
            <TouchableOpacity 
              onPress={clearError}
              className='mt-2'
            >
              <Text className='text-red-600 text-sm'>Dispensar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lists Content */}
        {!loading && (
          <>
            {/* Auto-generated Lists Row */}
            <View className='w-full flex-row mb-0'>
              {/* Want to Visit List */}
              {wantToVisitList ? (
                <ListCard
                  emoji={wantToVisitList.emoji}
                  title={wantToVisitList.title}
                  subtitle={wantToVisitList.description}
                  placesCount={wantToVisitList.placesCount}
                  backgroundColor='bg-yellow-500'
                  onPress={() => handleListPress(wantToVisitList.id)}
                />
              ) : (
                <ListCard
                  emoji='🍽️'
                  title='QUERO VISITAR'
                  subtitle='Lugares que você quer visitar'
                  placesCount={0}
                  backgroundColor='bg-yellow-500'
                />
              )}

              {/* Favorites List */}
              {favoritesList ? (
                <ListCard
                  emoji={favoritesList.emoji}
                  title={favoritesList.title}
                  subtitle={favoritesList.description}
                  placesCount={favoritesList.placesCount}
                  backgroundColor='bg-orange-500'
                  onPress={() => handleListPress(favoritesList.id)}
                />
              ) : (
                <ListCard
                  emoji='🍕'
                  title='FAVORITOS'
                  subtitle='Lugares que você favoritou'
                  placesCount={0}
                  backgroundColor='bg-orange-500'
                />
              )}
            </View>

            {/* Custom Lists */}
            {customLists.length > 0 ? (
              <View className='w-full'>
                {/* Add New List + First Custom List Row */}
                <View className='w-full flex-row mb-0'>
                  <NewListCard onPress={handleCreateList} />
                  {customLists[0] && (
                    <ListCard
                      emoji={customLists[0].emoji}
                      title={customLists[0].title}
                      subtitle={customLists[0].description}
                      placesCount={customLists[0].placesCount}
                      backgroundColor={getBackgroundColor(customLists[0].emoji, 0)}
                      isPublic={customLists[0].visibility === 'public'}
                      onPress={() => handleListPress(customLists[0].id)}
                      onLongPress={() => handleEditList(customLists[0].id)}
                    />
                  )}
                </View>

                {/* Remaining Custom Lists */}
                {customLists.slice(1).length > 0 && (
                  <View className='w-full flex-row flex-wrap'>
                    {customLists.slice(1).map((list, index) => (
                      <View key={list.id} className='w-1/2'>
                        <ListCard
                          emoji={list.emoji}
                          title={list.title}
                          subtitle={list.description}
                          placesCount={list.placesCount}
                          backgroundColor={getBackgroundColor(list.emoji, index + 1)}
                          isPublic={list.visibility === 'public'}
                          onPress={() => handleListPress(list.id)}
                          onLongPress={() => handleEditList(list.id)}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              /* No Custom Lists - Just show New List Card */
              <View className='w-full flex-row mb-0'>
                <NewListCard onPress={handleCreateList} />
                <View className='flex-1 mx-1' />
              </View>
            )}

            {/* Empty State */}
            {!loading && lists.length === 0 && !error && (
              <View className='flex-1 items-center justify-center py-20'>
                <Text className='text-6xl mb-4'>📋</Text>
                <Text className='text-xl font-semibold text-gray-900 mb-2'>Suas listas aparecerão aqui</Text>
                <Text className='text-gray-600 text-center mb-6'>
                  Crie sua primeira lista para organizar os lugares que você quer visitar
                </Text>
                <TouchableOpacity
                  onPress={handleCreateList}
                  className='bg-orange-500 px-6 py-3 rounded-lg'
                >
                  <Text className='text-white font-semibold'>Criar primeira lista</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Bottom spacing */}
        <View className='h-6' />
      </ScrollView>

      {/* Profile Bottom Sheet */}
      <ProfileBottomSheetPortal ref={profileBottomSheetRef} onClose={() => profileBottomSheetRef.current?.close()} />

      {/* Create/Edit List Bottom Sheet */}
      <CreateEditListBottomSheetPortal
        ref={createEditListBottomSheetRef}
        mode='create'
        onSave={handleSaveList}
        onClose={() => createEditListBottomSheetRef.current?.close()}
      />
    </View>
  );
};

export default ListsScreen;
