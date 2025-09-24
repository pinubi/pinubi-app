import { FollowRequest } from '@/types/users';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface FollowRequestCardProps {
  request: FollowRequest;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onUserPress?: (userId: string) => void;
}

export const FollowRequestCard: React.FC<FollowRequestCardProps> = ({
  request,
  onAccept,
  onReject,
  onUserPress
}) => {
  const handleUserPress = () => {
    onUserPress?.(request.fromUserId);
  };

  const handleAccept = () => {
    onAccept(request.id);
  };

  const handleReject = () => {
    onReject(request.id);
  };

  const timeAgo = () => {
    const now = new Date();
    const created = new Date(request.createdAt);
    const diffMs = now.getTime() - created.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `${String(diffMinutes)}min`;
    if (diffHours < 24) return `${String(diffHours)}h`;
    return `${String(diffDays)}d`;
  };

  return (
    <View 
      className='bg-gradient-to-r from-white to-blue-50 p-4 rounded-3xl border border-blue-100 mb-3 shadow-md'
      style={{
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className='flex-row items-center'>
        {/* User info */}
        <TouchableOpacity 
          onPress={handleUserPress}
          className='flex-row items-center flex-1'
        >
          <Image 
            source={{ 
              uri: request.fromUser.photoURL || `https://i.pravatar.cc/100?u=${request.fromUserId}` 
            }} 
            className='w-12 h-12 rounded-full' 
          />
          <View className='flex-1 ml-3'>
            <Text className='text-gray-900 font-semibold text-base'>
              {request.fromUser.displayName}
            </Text>
            {request.fromUser.username && (
              <Text className='text-gray-500 text-sm'>
                @{request.fromUser.username}
              </Text>
            )}
            <Text className='text-gray-600 text-xs mt-1'>
              Solicitou seguir você • {timeAgo()}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action buttons */}
        <View className='flex-row space-x-3 ml-2'>
          <TouchableOpacity
            onPress={handleReject}
            className='bg-gradient-to-r from-red-50 to-red-100 p-3 rounded-full border border-red-200 shadow-sm active:scale-95'
            style={{
              shadowColor: '#ef4444',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Ionicons name='close' size={20} color='#dc2626' />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleAccept}
            className='bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-full shadow-lg active:scale-95'
            style={{
              shadowColor: '#22c55e',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <Ionicons name='checkmark' size={20} color='white' />
          </TouchableOpacity>
        </View>
      </View>

      {/* Additional info */}
      {request.fromUser.mutualFollowersCount && request.fromUser.mutualFollowersCount > 0 && (
        <View className='flex-row items-center mt-3 pt-3 border-t border-gray-100'>
          <Ionicons name='people-outline' size={16} color='#6b7280' />
          <Text className='text-gray-600 text-sm ml-1'>
            {String(request.fromUser.mutualFollowersCount)} amigos em comum
          </Text>
        </View>
      )}
    </View>
  );
};
