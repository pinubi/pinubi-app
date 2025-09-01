import { PublicUser, UserActionType } from '@/types/users';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface UserCardProps {
  user: PublicUser;
  activeTab: 'followers' | 'following';
  onPress?: (user: PublicUser) => void;
  onAction?: (userId: string, action: UserActionType) => void;
  showStats?: boolean;
  showLocation?: boolean;
  compact?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  activeTab,
  onPress,
  onAction,
  showStats = true,
  showLocation = true,
  compact = false,
}) => {  
  // Ensure user has all required properties with defaults
  const safeUser = {
    ...user,
    displayName: user?.name || 'Usuário',
    username: user.username || undefined,
    photoURL: user.photoURL || undefined,
    commonCategories: user.commonCategories || [],
    commonPlaces: user.commonPlaces || 0,
    mutualFollowersCount: user.mutualFollowersCount || 0,
    listsCount: user.listsCount || 0,
    placesCount: user.placesCount || 0,
    followersCount: user.followersCount || 0,
    followingCount: user.followingCount || 0,
  };

  const handlePress = () => {
    onPress?.(safeUser);
  };

  const handleAction = (action: UserActionType) => {
    onAction?.(safeUser.id, action);
  };

  const getActionType = () => {    
    if (activeTab && activeTab === 'followers') {
      return 'remove_follower';
    } else if (activeTab && activeTab === 'following') {
      return 'unfollow';
    } else {
      return 'follow';
    }
  };

  const getActionButton = () => {
    if (safeUser.isFollowing) {
      return (
        <TouchableOpacity
          onPress={() => handleAction('unfollow')}
          className='bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-2.5 rounded-full border border-gray-200 shadow-sm active:scale-95'
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <View className='flex-row items-center'>
            <Ionicons name='checkmark-circle' size={16} color='#059669' />
            <Text className='text-gray-700 text-sm font-semibold ml-1'>Seguindo</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (safeUser.hasFollowRequest) {
      return (
        <TouchableOpacity
          onPress={() => handleAction('cancel_request')}
          className='bg-gradient-to-r from-orange-50 to-orange-100 px-5 py-2.5 rounded-full border border-orange-200 shadow-sm active:scale-95'
          style={{
            shadowColor: '#fb923c',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <View className='flex-row items-center'>
            <Ionicons name='hourglass-outline' size={16} color='#ea580c' />
            <Text className='text-orange-600 text-sm font-semibold ml-1'>Pendente</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => handleAction(getActionType())}
        className='bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 rounded-full shadow-lg active:scale-95'
        style={{
          shadowColor: '#3b82f6',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
          elevation: 3,
        }}
      >
        <View className='flex-row items-center'>
          <Ionicons name='person-add' size={16} color='#b13bff' />
          <Text className='text-[#b13bff] text-sm font-semibold ml-1'>
            {activeTab ? (activeTab === 'followers' ? 'Remover' : 'Deixar de Seguir') : 'Seguir'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getPremiumBadge = () => {
    if (safeUser.accountType === 'premium') {
      return (
        <View
          className='bg-gradient-to-r from-yellow-100 to-yellow-200 px-2.5 py-1 rounded-full ml-2 border border-yellow-300 shadow-sm'
          style={{
            shadowColor: '#f59e0b',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1,
            elevation: 1,
          }}
        >
          <Text className='text-yellow-700 text-xs font-bold'>PRO</Text>
        </View>
      );
    }
    return null;
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        className='flex-row items-center p-4 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-100 mb-3 shadow-sm active:scale-98'
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <Image
          source={{ uri: safeUser.photoURL || `https://i.pravatar.cc/100?u=${safeUser.id}` }}
          className='w-12 h-12 rounded-full'
        />
        <View className='flex-1 ml-3'>
          <View className='flex-row items-center'>
            <Text className='text-gray-900 font-semibold text-base'>{safeUser.displayName}</Text>
            {getPremiumBadge()}
          </View>
          {safeUser.username && <Text className='text-gray-500 text-sm'>@{safeUser.username}</Text>}
          {safeUser.mutualFollowersCount && safeUser.mutualFollowersCount > 0 && (
            <Text className='text-gray-600 text-xs mt-1'>{String(safeUser.mutualFollowersCount)} amigos em comum</Text>
          )}
        </View>
        <View className='ml-2'>{getActionButton()}</View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      className='bg-gradient-to-r from-white to-gray-50 p-5 rounded-3xl border border-gray-100 mb-4 shadow-md active:scale-98'
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View className='flex-row items-start mb-3'>
        <Image
          source={{ uri: safeUser.photoURL || `https://i.pravatar.cc/100?u=${safeUser.id}` }}
          className='w-16 h-16 rounded-full'
        />
        <View className='flex-1 ml-3'>
          <View className='flex-row items-center justify-between'>
            <View className='flex-1'>
              <View className='flex-row items-center'>
                <Text className='text-gray-900 font-bold text-lg'>{safeUser.displayName}</Text>
                {getPremiumBadge()}
              </View>
              {safeUser.username && <Text className='text-gray-500 text-sm'>@{safeUser.username}</Text>}
            </View>
            {getActionButton()}
          </View>
        </View>
      </View>

      {/* Location */}
      {showLocation && safeUser.location && (
        <View className='flex-row items-center mb-3'>
          <Ionicons name='location-outline' size={16} color='#6b7280' />
          <Text className='text-gray-600 text-sm ml-1'>
            {safeUser.location.city}, {safeUser.location.state}
          </Text>
        </View>
      )}

      {/* Stats */}
      {showStats && (
        <View className='flex-row justify-between mb-3'>
          <View className='flex-1 items-center'>
            <Text className='text-gray-900 font-bold text-lg'>{String(safeUser.listsCount)}</Text>
            <Text className='text-gray-500 text-xs'>Listas</Text>
          </View>
          <View className='flex-1 items-center'>
            <Text className='text-gray-900 font-bold text-lg'>{String(safeUser.placesCount)}</Text>
            <Text className='text-gray-500 text-xs'>Lugares</Text>
          </View>
          <View className='flex-1 items-center'>
            <Text className='text-gray-900 font-bold text-lg'>{String(safeUser.followersCount)}</Text>
            <Text className='text-gray-500 text-xs'>Seguidores</Text>
          </View>
          <View className='flex-1 items-center'>
            <Text className='text-gray-900 font-bold text-lg'>{String(safeUser.followingCount)}</Text>
            <Text className='text-gray-500 text-xs'>Seguindo</Text>
          </View>
        </View>
      )}

      {/* Common interests */}
      {safeUser.commonCategories && safeUser.commonCategories.length > 0 && (
        <View className='mb-3'>
          <Text className='text-gray-700 text-sm font-medium mb-2'>Interesses em comum:</Text>
          <View className='flex-row flex-wrap'>
            {safeUser.commonCategories.slice(0, 3).map((category, index) => (
              <View key={index} className='bg-primary-100 px-2 py-1 rounded-full mr-2 mb-1'>
                <Text className='text-primary-600 text-xs'>{category}</Text>
              </View>
            ))}
            {safeUser.commonCategories.length > 3 && (
              <View className='bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1'>
                <Text className='text-gray-600 text-xs'>+{String(safeUser.commonCategories.length - 3)}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Mutual followers */}
      {safeUser.mutualFollowersCount && safeUser.mutualFollowersCount > 0 && (
        <View className='flex-row items-center'>
          <Ionicons name='people-outline' size={16} color='#6b7280' />
          <Text className='text-gray-600 text-sm ml-1'>{String(safeUser.mutualFollowersCount)} amigos em comum</Text>
        </View>
      )}

      {/* Common places */}
      {safeUser.commonPlaces && safeUser.commonPlaces > 0 && (
        <View className='flex-row items-center mt-1'>
          <Ionicons name='location-outline' size={16} color='#6b7280' />
          <Text className='text-gray-600 text-sm ml-1'>{String(safeUser.commonPlaces)} lugares em comum</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
