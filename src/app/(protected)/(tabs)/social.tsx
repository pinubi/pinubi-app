import { EmptyFeedComponent, ErrorComponent, FeedItemComponent } from '@/components/feed';
import Header from '@/components/Header';
import { ProfileBottomSheetPortal, type BottomSheetRef } from '@/components/ui';
import { useFeed } from '@/hooks/useFeed';
import { mapFeedItemToActivityPost } from '@/utils/feedUtils';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const SocialScreen = () => {
  const profileBottomSheetRef = useRef<BottomSheetRef>(null);
  const router = useRouter();

  // Feed integration
  const {
    items: feedItems,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
    likeItem,
    markAsViewed,
  } = useFeed({
    limit: 20,
    maxDistance: 50,
    includeGeographic: true,
  });

  // Convert feed items to activity posts for UI compatibility
  const activities = feedItems.map(mapFeedItemToActivityPost);

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

  const handleLike = async (itemId: string) => {
    try {
      await likeItem(itemId);
    } catch (error) {
      console.error('Erro ao curtir:', error);
    }
  };

  const handleComment = (itemId: string) => {
    // TODO: Implementar navegação para tela de comentários
    console.log('Comment:', itemId);
  };

  const handleActivityPress = (activity: any) => {
    // Mark as viewed for analytics
    markAsViewed(activity.id);

    // TODO: Implementar navegação baseada no tipo da atividade
    console.log('Activity pressed:', activity);
  };

  const handleProfilePress = () => {
    profileBottomSheetRef.current?.snapToIndex(0);
  };

  const handleSearchPress = () => {
    router.push('/(protected)/followers');
  };

  const renderFeedItem = ({ item }: { item: any }) => (
    <FeedItemComponent item={item} onLike={handleLike} onComment={handleComment} onPress={handleActivityPress} />
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;

    return (
      <View className='flex-row items-center justify-center py-4'>
        <ActivityIndicator size='small' color='#b13bff' />
        <Text className='text-gray-600 text-sm ml-2'>Carregando mais...</Text>
      </View>
    );
  };

  const renderEmptyComponent = () => <EmptyFeedComponent onRefresh={refresh} handleSearchPress={handleSearchPress} />;

  const renderLoadingOverlay = () => {
    return (
      <View className='absolute inset-0 bg-gray-50 items-center justify-center z-10'>
        <ActivityIndicator size='large' color='#b13bff' />
        <Text className='text-gray-600 text-base mt-4'>Carregando atividades...</Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !loading && !refreshing) {
      loadMore();
    }
  };

  // Show error state
  if (error && activities.length === 0) {
    return (
      <View className='flex-1 bg-gray-50'>
        <Header title='Pinubi' className='border-b border-gray-100' onRightPress={handleProfilePress} />
        <ErrorComponent error={error} onRetry={refresh} />
        <ProfileBottomSheetPortal ref={profileBottomSheetRef} onClose={() => profileBottomSheetRef.current?.close()} />
      </View>
    );
  }

  return (
    <View className='flex-1 bg-gray-50'>
      {/* Header */}
      <Header
        title='Pinubi'
        className='border-b border-gray-100'
        // rightIcon='search-outline'
        secondaryRightIcon='person-outline'
        // onRightPress={handleSearchPress}
        onSecondaryRightPress={handleProfilePress}
      />

      {/* Match Social Card */}
      <View className='mx-4 mt-4 mb-6'>
        <TouchableOpacity className='bg-primary-500 rounded-2xl p-6 shadow-sm'>
          <View className='flex-row items-center justify-between'>
            <View className='flex-1'>
              <View className='flex-row items-center mb-2'>
                <View className='bg-white/20 rounded-full p-2 mr-3'>
                  <Ionicons name='sparkles' size={24} color='white' />
                </View>
                <Text className='text-white font-bold text-lg'>Match Social</Text>
              </View>
              <Text className='text-white/90 text-sm'>Encontre pessoas com gostos similares</Text>
            </View>
            <View className='bg-white/20 rounded-full p-3'>
              <Ionicons name='people' size={20} color='white' />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      

      {/* Feed List */}
      {/* <View className='flex-1 relative'>
        {loading && activities.length === 0 ? (
          renderLoadingOverlay()
        ) : (
          <FlatList
            data={activities.reverse()} // Show newest first
            renderItem={renderFeedItem}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmptyComponent}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View> */}

      {/* Profile Bottom Sheet */}
      <ProfileBottomSheetPortal ref={profileBottomSheetRef} onClose={() => profileBottomSheetRef.current?.close()} />
    </View>
  );
};

export default SocialScreen;
