import Header from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface VotingOption {
  id: string;
  name: string;
  votes: number;
  percentage: number;
  hasVoted: boolean;
}

interface ActivityPost {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  type: 'voting' | 'list' | 'review' | 'place_added';
  timestamp: string;
  content: {
    title: string;
    description?: string;
    category?: string;
    options?: VotingOption[];
  };
  interactions: {
    likes: number;
    comments: number;
    hasLiked: boolean;
  };
}

const SocialScreen = () => {
  const [activities] = useState<ActivityPost[]>([
    {
      id: '1',
      user: {
        name: 'Marina Silva',
        username: '@marina.eats',
        avatar: 'https://i.pravatar.cc/100?img=1',
      },
      type: 'voting',
      timestamp: '1h',
      content: {
        title: 'Brunch de domingo - onde vamos?',
        description: 'Galera, ajudem a decidir: Café da Esquina ou The Breakfast Club?',
        category: 'Votação entre amigos',
        options: [
          { id: '1', name: 'Opção A', votes: 50, percentage: 50, hasVoted: true },
          { id: '2', name: 'Opção B', votes: 50, percentage: 50, hasVoted: false },
        ],
      },
      interactions: {
        likes: 18,
        comments: 12,
        hasLiked: false,
      },
    },
    {
      id: '2',
      user: {
        name: 'Carlos Mendes',
        username: '@carlosvibes',
        avatar: 'https://i.pravatar.cc/100?img=12',
      },
      type: 'list',
      timestamp: '2h',
      content: {
        title: 'Rolês Noturnos SP',
        description: 'Minha seleção dos melhores lugares para curtir a noite paulistana',
        category: 'Entretenimento',
      },
      interactions: {
        likes: 45,
        comments: 8,
        hasLiked: true,
      },
    },
  ]);

  const handleVote = (postId: string, optionId: string) => {
    // Handle voting logic here
    console.log('Vote:', postId, optionId);
  };

  const handleLike = (postId: string) => {
    // Handle like logic here
    console.log('Like:', postId);
  };
  
  const handleBack = () => {
    // TODO: Implement back navigation
    console.log('Go back');
  };

  const renderVotingPost = (post: ActivityPost) => (
    <View key={post.id} className='bg-white mx-4 mb-4 rounded-2xl border border-gray-100'>
      {/* User header */}
      <View className='flex-row items-center p-4 pb-3'>
        <Image source={{ uri: post.user.avatar }} className='w-10 h-10 rounded-full' />
        <View className='flex-1 ml-3'>
          <View className='flex-row items-center'>
            <Text className='font-semibold text-gray-900 text-sm'>{post.user.name}</Text>
            <Text className='text-gray-500 text-sm ml-1'>{post.user.username}</Text>
            <Text className='text-gray-400 text-sm ml-1'>•</Text>
            <Text className='text-gray-500 text-sm ml-1'>{post.timestamp}</Text>
          </View>
          <View className='flex-row items-center mt-1'>
            <View className='bg-orange-100 px-2 py-1 rounded-md'>
              <Text className='text-orange-600 text-xs font-medium'>📊 criou uma votação</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <View className='px-4'>
        <Text className='text-gray-900 font-semibold text-base mb-2'>{post.content.title}</Text>
        {post.content.description && <Text className='text-gray-600 text-sm mb-4'>{post.content.description}</Text>}

        {/* Voting options */}
        {post.content.options && (
          <View className='space-y-3 mb-4'>
            {post.content.options.map((option) => (
              <TouchableOpacity key={option.id} onPress={() => handleVote(post.id, option.id)} className='relative'>
                <View className='bg-gray-50 rounded-xl p-4 border border-gray-100'>
                  <View className='flex-row items-center justify-between mb-2'>
                    <Text className='text-gray-700 font-medium'>{option.name}</Text>
                    <Text className='text-gray-600 text-sm'>{option.percentage}%</Text>
                  </View>

                  {/* Progress bar */}
                  <View className='h-2 bg-gray-200 rounded-full overflow-hidden'>
                    <View
                      className={`h-full rounded-full ${option.hasVoted ? 'bg-primary-500' : 'bg-gray-400'}`}
                      style={{ width: `${option.percentage}%` }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Category tag */}
        {post.content.category && (
          <View className='mb-4'>
            <View className='bg-orange-100 px-3 py-1.5 rounded-lg self-start'>
              <Text className='text-orange-600 text-xs font-medium'>{post.content.category}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Interactions */}
      <View className='flex-row items-center px-4 py-3 border-t border-gray-50'>
        <TouchableOpacity onPress={() => handleLike(post.id)} className='flex-row items-center mr-6'>
          <Ionicons
            name={post.interactions.hasLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.interactions.hasLiked ? '#ef4444' : '#6b7280'}
          />
          <Text className='text-gray-600 text-sm ml-1'>{post.interactions.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity className='flex-row items-center'>
          <Ionicons name='chatbubble-outline' size={20} color='#6b7280' />
          <Text className='text-gray-600 text-sm ml-1'>{post.interactions.comments}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderListPost = (post: ActivityPost) => (
    <View key={post.id} className='bg-white mx-4 mb-4 rounded-2xl border border-gray-100'>
      {/* User header */}
      <View className='flex-row items-center p-4 pb-3'>
        <Image source={{ uri: post.user.avatar }} className='w-10 h-10 rounded-full' />
        <View className='flex-1 ml-3'>
          <View className='flex-row items-center'>
            <Text className='font-semibold text-gray-900 text-sm'>{post.user.name}</Text>
            <Text className='text-gray-500 text-sm ml-1'>{post.user.username}</Text>
            <Text className='text-gray-400 text-sm ml-1'>•</Text>
            <Text className='text-gray-500 text-sm ml-1'>{post.timestamp}</Text>
          </View>
          <View className='flex-row items-center mt-1'>
            <View className='bg-blue-100 px-2 py-1 rounded-md'>
              <Text className='text-blue-600 text-xs font-medium'>📋 criou uma lista</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <View className='px-4'>
        <Text className='text-gray-900 font-semibold text-base mb-2'>{post.content.title}</Text>
        {post.content.description && <Text className='text-gray-600 text-sm mb-4'>{post.content.description}</Text>}

        {/* Category tag */}
        {post.content.category && (
          <View className='mb-4'>
            <View className='bg-purple-100 px-3 py-1.5 rounded-lg self-start'>
              <Text className='text-purple-600 text-xs font-medium'>{post.content.category}</Text>
            </View>
          </View>
        )}
      </View>

      {/* List preview image */}
      <View className='px-4 mb-4'>
        <View className='h-40 bg-primary-400 rounded-xl overflow-hidden relative'>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop' }}
            className='w-full h-full opacity-80'
          />
          <View className='absolute inset-0 bg-primary-500 opacity-30' />
        </View>
      </View>

      {/* Interactions */}
      <View className='flex-row items-center px-4 py-3 border-t border-gray-50'>
        <TouchableOpacity onPress={() => handleLike(post.id)} className='flex-row items-center mr-6'>
          <Ionicons
            name={post.interactions.hasLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.interactions.hasLiked ? '#ef4444' : '#6b7280'}
          />
          <Text className='text-gray-600 text-sm ml-1'>{post.interactions.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity className='flex-row items-center'>
          <Ionicons name='chatbubble-outline' size={20} color='#6b7280' />
          <Text className='text-gray-600 text-sm ml-1'>{post.interactions.comments}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className='flex-1 bg-gray-50'>
      {/* Header */}
      <Header
        title='Pinubi'
        className='border-b border-gray-100'
        leftElement={
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name='chevron-back' size={24} color='#374151' />
          </TouchableOpacity>
        }
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

      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Following section header */}
        <View className='px-4 mb-4'>
          <Text className='text-gray-500 text-sm font-medium'>De pessoas que você segue</Text>
        </View>

        {/* Activity Feed */}
        <View>
          {activities.map((post) => {
            if (post.type === 'voting') {
              return renderVotingPost(post);
            } else if (post.type === 'list') {
              return renderListPost(post);
            }
            return null;
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default SocialScreen;
