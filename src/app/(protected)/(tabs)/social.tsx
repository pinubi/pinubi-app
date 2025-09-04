import { EmptyFeedComponent, FeedItemComponent } from '@/components/feed';
import Header from '@/components/Header';
import { ProfileBottomSheetPortal, type BottomSheetRef } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

const SocialScreen = () => {
  const profileBottomSheetRef = useRef<BottomSheetRef>(null);
  const router = useRouter();
  const { userPhoto } = useAuth();

  // Feed integration
  // const {
  //   items: feedItems,
  //   loading,
  //   refreshing,
  //   hasMore,
  //   error,
  //   refresh,
  //   loadMore,
  //   likeItem,
  //   markAsViewed,
  // } = useFeed({
  //   limit: 20,
  //   maxDistance: 50,
  //   includeGeographic: true,
  // });

  // Convert feed items to activity posts for UI compatibility
  // const activities = feedItems.map(mapFeedItemToActivityPost);

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
      // await likeItem(itemId);
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
    // markAsViewed(activity.id);

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
    // if (!loading || refreshing) return null;

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
    // if (hasMore && !loading && !refreshing) {
    //   loadMore();
    // }
  };

  // Show error state
  // if (error && activities.length === 0) {
  //   return (
  //     <View className='flex-1 bg-gray-50'>
  //       <Header title='Pinubi' className='border-b border-gray-100' onRightPress={handleProfilePress} />
  //       <ErrorComponent error={error} onRetry={refresh} />
  //       <ProfileBottomSheetPortal ref={profileBottomSheetRef} onClose={() => profileBottomSheetRef.current?.close()} />
  //     </View>
  //   );
  // }

  return (
    <View className='flex-1 bg-gray-50'>
      {/* Header */}
      <Header
        title='Pinubi'
        className='border-b border-gray-100'
        // rightIcon='search-outline'
        userPhoto={userPhoto}
        // onRightPress={handleSearchPress}
        onRightPress={handleProfilePress}
        // onSecondaryRightPress={handleProfilePress}
      />

      {/* Match Social Card */}
      {/* <View className='mx-4 mt-4 mb-6'>
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
      </View> */}

      {/* Coming Soon Component */}
      <View className='flex-1 items-center justify-center px-4 bottom-[10%]'>
        <View className='bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mt-4'>
          <View className='items-center'>
            <View className='bg-primary-100 rounded-full p-4 mb-4'>
              <Ionicons name='time-outline' size={32} color='#b13bff' />
            </View>
            <Text className='text-xl font-bold text-gray-800 mb-2 text-center'>Feed Social em Breve</Text>
            <Text className='text-gray-600 text-center text-base leading-6 mb-6'>
              Estamos trabalhando duro para trazer a você uma experiência incrível de feed social. Em breve você poderá
              ver atividades dos seus amigos e descobrir novas aventuras!
            </Text>
            <View className='bg-primary-50 rounded-xl p-4 w-full'>
              <View className='flex-row items-center mb-3'>
                <Ionicons name='checkmark-circle' size={20} color='#b13bff' />
                <Text className='text-primary-700 font-medium ml-2'>O que está chegando:</Text>
              </View>
              <View className='space-y-2'>
                <View className='flex-row items-center'>
                  <View className='w-2 h-2 bg-primary-400 rounded-full mr-3' />
                  <Text className='text-gray-700 text-sm'>Feed de atividades em tempo real</Text>
                </View>
                <View className='flex-row items-center'>
                  <View className='w-2 h-2 bg-primary-400 rounded-full mr-3' />
                  <Text className='text-gray-700 text-sm'>Interação com posts dos amigos</Text>
                </View>
                <View className='flex-row items-center'>
                  <View className='w-2 h-2 bg-primary-400 rounded-full mr-3' />
                  <Text className='text-gray-700 text-sm'>Descoberta de novos locais</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
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
