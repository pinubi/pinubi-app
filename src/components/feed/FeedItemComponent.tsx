import { ActivityPost } from '@/types/feed';
import { trackFeedEvents } from '@/utils/feedAnalytics';
import { getActivityActionText, getActivityBadgeColor, getActivityIcon } from '@/utils/feedUtils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface FeedItemComponentProps {
  item: ActivityPost;
  onLike?: (itemId: string) => void;
  onComment?: (itemId: string) => void;
  onPress?: (item: ActivityPost) => void;
}

export const FeedItemComponent: React.FC<FeedItemComponentProps> = ({
  item,
  onLike,
  onComment,
  onPress
}) => {
  const badgeColors = getActivityBadgeColor(item.type);
  const actionIcon = getActivityIcon(item.type);
  const actionText = getActivityActionText(item.type);

  const handlePress = () => {
    onPress?.(item);
  };

  const handleLike = () => {
    onLike?.(item.id);
    trackFeedEvents.feedItemLiked(item.id, item.type);
  };

  const handleComment = () => {
    onComment?.(item.id);
    trackFeedEvents.feedItemCommented(item.id, item.type);
  };

  const renderContent = () => {
    switch (item.type) {
      case 'review':
        return renderReviewContent();
      case 'place_added':
      case 'place_visited':
        return renderPlaceContent();
      case 'list_created':
        return renderListContent();
      default:
        return renderGenericContent();
    }
  };

  const renderReviewContent = () => (
    <>
      <View className='px-4'>
        <Text className='text-gray-900 font-semibold text-base mb-2'>{item.content.title}</Text>
        {item.content.description && (
          <Text className='text-gray-600 text-sm mb-3'>{item.content.description}</Text>
        )}
        
        {/* Rating */}
        {item.content.rating && (
          <View className='flex-row items-center mb-3'>
            <Ionicons name='star' size={16} color='#fbbf24' />
            <Text className='text-gray-700 font-medium ml-1'>{item.content.rating}</Text>
            <Text className='text-gray-500 text-sm ml-2'>de 10</Text>
          </View>
        )}

        {/* Place info */}
        {item.content.placeName && (
          <View className='bg-gray-50 rounded-lg p-3 mb-3'>
            <Text className='text-gray-900 font-medium'>{item.content.placeName}</Text>
            {item.content.placeAddress && (
              <Text className='text-gray-500 text-sm mt-1'>{item.content.placeAddress}</Text>
            )}
          </View>
        )}
      </View>

      {/* Photos */}
      {item.content.photos && item.content.photos.length > 0 && (
        <View className='px-4 mb-4'>
          <Image
            source={{ uri: item.content.photos[0] }}
            className='w-full h-40 rounded-xl'
            resizeMode='cover'
          />
        </View>
      )}
    </>
  );

  const renderPlaceContent = () => (
    <>
      <View className='px-4'>
        <Text className='text-gray-900 font-semibold text-base mb-2'>{item.content.title}</Text>
        {item.content.description && (
          <Text className='text-gray-600 text-sm mb-3'>{item.content.description}</Text>
        )}

        {/* Place info */}
        {item.content.placeName && (
          <View className='bg-gray-50 rounded-lg p-3 mb-3'>
            <Text className='text-gray-900 font-medium'>{item.content.placeName}</Text>
            {item.content.placeAddress && (
              <Text className='text-gray-500 text-sm mt-1'>{item.content.placeAddress}</Text>
            )}
          </View>
        )}
      </View>

      {/* Photos */}
      {item.content.photos && item.content.photos.length > 0 && (
        <View className='px-4 mb-4'>
          <Image
            source={{ uri: item.content.photos[0] }}
            className='w-full h-40 rounded-xl'
            resizeMode='cover'
          />
        </View>
      )}
    </>
  );

  const renderListContent = () => (
    <>
      <View className='px-4'>
        <Text className='text-gray-900 font-semibold text-base mb-2'>{item.content.title}</Text>
        {item.content.description && (
          <Text className='text-gray-600 text-sm mb-4'>{item.content.description}</Text>
        )}
      </View>

      {/* List preview image */}
      <View className='px-4 mb-4'>
        <View className='h-40 bg-primary-400 rounded-xl overflow-hidden relative'>
          {item.content.photos && item.content.photos.length > 0 ? (
            <Image
              source={{ uri: item.content.photos[0] }}
              className='w-full h-full opacity-80'
              resizeMode='cover'
            />
          ) : (
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop' }}
              className='w-full h-full opacity-80'
              resizeMode='cover'
            />
          )}
          <View className='absolute inset-0 bg-primary-500 opacity-30' />
        </View>
      </View>
    </>
  );

  const renderGenericContent = () => (
    <View className='px-4'>
      <Text className='text-gray-900 font-semibold text-base mb-2'>{item.content.title}</Text>
      {item.content.description && (
        <Text className='text-gray-600 text-sm mb-4'>{item.content.description}</Text>
      )}
    </View>
  );

  return (
    <TouchableOpacity 
      onPress={handlePress}
      className='bg-white mx-4 mb-4 rounded-2xl border border-gray-100'
      activeOpacity={0.7}
    >
      {/* User header */}
      <View className='flex-row items-center p-4 pb-3'>
        <Image source={{ uri: item.user.avatar }} className='w-10 h-10 rounded-full' />
        <View className='flex-1 ml-3'>
          <View className='flex-row items-center'>
            <Text className='font-semibold text-gray-900 text-sm'>{item.user.name}</Text>
            <Text className='text-gray-500 text-sm ml-1'>{item.user.username}</Text>
            <Text className='text-gray-400 text-sm ml-1'>•</Text>
            <Text className='text-gray-500 text-sm ml-1'>{item.timestamp}</Text>
          </View>
          <View className='flex-row items-center mt-1'>
            <View className={`${badgeColors.bg} px-2 py-1 rounded-md`}>
              <Text className={`${badgeColors.text} text-xs font-medium`}>
                {actionIcon} {actionText}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Category tag */}
      {item.content.category && (
        <View className='px-4 mb-4'>
          <View className='bg-gray-100 px-3 py-1.5 rounded-lg self-start'>
            <Text className='text-gray-600 text-xs font-medium'>{item.content.category}</Text>
          </View>
        </View>
      )}

      {/* Interactions */}
      <View className='flex-row items-center px-4 py-3 border-t border-gray-50'>
        <TouchableOpacity onPress={handleLike} className='flex-row items-center mr-6'>
          <Ionicons
            name={item.interactions.hasLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={item.interactions.hasLiked ? '#ef4444' : '#6b7280'}
          />
          <Text className='text-gray-600 text-sm ml-1'>{item.interactions.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleComment} className='flex-row items-center'>
          <Ionicons name='chatbubble-outline' size={20} color='#6b7280' />
          <Text className='text-gray-600 text-sm ml-1'>{item.interactions.comments}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
