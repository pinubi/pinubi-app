import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { UserCard } from '@/components/users/UserCard';
import { useAuth } from '@/hooks/useAuth';
import { useFollowers } from '@/hooks/useFollowers';
import type { FollowRequest, PublicUser, UserActionType } from '@/types/users';

type TabType = 'followers' | 'following' | 'requests';

const FollowersScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('followers');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    followers,
    following,
    followRequests,
    searchResults,
    loading,
    searchLoading,
    error,
    searchError,
    stats,
    actions,
  } = useFollowers(user?.id);

  // Search with debounce
  useEffect(() => {
    const searchDebounce = setTimeout(() => {
      const query = searchQuery.trim();
      if (query && query.length >= 3) {
        actions.searchUsers(query);
      } else {
        actions.clearSearchResults();
      }
    }, 500);

    return () => clearTimeout(searchDebounce);
  }, [searchQuery]);

  useEffect(() => {
    // Load initial stats immediately when component mounts
    actions.loadFollowStats();
  }, []);

  useEffect(() => {
    // Load initial data based on active tab
    if (activeTab === 'followers') {
      actions.loadFollowers();
    } else if (activeTab === 'following') {
      actions.loadFollowing();
    } else {
      actions.loadFollowRequests();
    }
  }, [activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await actions.refresh();
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUserAction = async (userId: string, action: UserActionType) => {
    try {
      await actions.handleUserAction(userId, action);

      // Show success message
      const messages = {
        follow: 'Solicitação de seguir enviada!',
        unfollow: 'Você deixou de seguir este usuário.',
        remove_follower: 'Você removeu este usuário dos seus seguidores.',
        cancel_request: 'Solicitação cancelada.',
        accept_request: 'Solicitação aceita! Agora vocês se seguem.',
        reject_request: 'Solicitação rejeitada.',
      };

      Alert.alert('Sucesso', messages[action]);
    } catch (err) {
      console.error('Error handling user action:', err);
      Alert.alert('Erro', 'Não foi possível realizar a ação');
    }
  };

  const handleUserPress = (selectedUser: PublicUser) => {
    // Navigate to user profile - implement when user profile screen is ready
    Alert.alert('Perfil', `Navegar para o perfil de ${selectedUser.displayName}`);
  };

  const getTabCount = (tab: TabType): number => {
    switch (tab) {
      case 'followers':
        return stats.followersCount;
      case 'following':
        return stats.followingCount;
      case 'requests':
        return stats.pendingRequestsCount;
      default:
        return 0;
    }
  };

  const filterUsers = (users: PublicUser[]) => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.location?.city.toLowerCase().includes(query)
    );
  };

  const renderTabButton = (tab: TabType, label: string) => {
    const count = getTabCount(tab);

    return (
      <TouchableOpacity
        key={tab}
        onPress={() => setActiveTab(tab)}
        className={`flex-1 py-3 px-4 rounded-xl ${activeTab === tab ? 'bg-primary-50' : 'bg-transparent'} active:scale-95`}
      >
        <View className='items-center'>
          <Text className={`font-semibold text-sm ${activeTab === tab ? 'text-primary-600' : 'text-gray-600'}`}>
            {label}
          </Text>
          <Text className={`text-xs mt-1 ${activeTab === tab ? 'text-primary-500' : 'text-gray-400'}`}>{count}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFollowRequest = (request: FollowRequest) => (
    <View key={request.id} className='bg-white p-4 rounded-2xl border border-gray-100 mb-3 shadow-sm'>
      {/* User Info */}
      <View className='flex-row items-center mb-3'>
        <View className='w-12 h-12 rounded-full overflow-hidden mr-3'>
          {request.fromUser.photoURL ? (
            <Image source={{ uri: request.fromUser.photoURL }} className='w-full h-full' />
          ) : (
            <View className='w-full h-full bg-primary-500 items-center justify-center'>
              <Text className='text-white font-bold text-lg'>
                {request.fromUser.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View className='flex-1'>
          <Text className='font-semibold text-gray-900 text-base'>{request.fromUser.displayName}</Text>
          {request.fromUser.username && <Text className='text-gray-500 text-sm'>@{request.fromUser.username}</Text>}
          {request.fromUser.mutualFollowersCount && request.fromUser.mutualFollowersCount > 0 && (
            <Text className='text-gray-600 text-xs mt-1'>{request.fromUser.mutualFollowersCount} amigos em comum</Text>
          )}
        </View>
      </View>

      {/* Message */}
      {request.message && (
        <View className='mt-3 bg-gray-50 p-3 rounded-xl'>
          <Text className='text-gray-700 text-sm italic'>"{request.message}"</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View className='flex-row mt-4 space-x-3'>
        <TouchableOpacity
          onPress={() => handleUserAction(request.fromUserId, 'accept_request')}
          className='flex-1 bg-primary-500 py-3 rounded-xl active:scale-95'
        >
          <Text className='text-white text-center font-semibold'>Aceitar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleUserAction(request.fromUserId, 'reject_request')}
          className='flex-1 bg-gray-100 py-3 rounded-xl active:scale-95'
        >
          <Text className='text-gray-700 text-center font-semibold'>Rejeitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    // Show search results if there's a search query
    if (searchQuery.trim()) {
      if (searchLoading) {
        return (
          <View className='flex-1 justify-center items-center'>
            <ActivityIndicator size='large' color='#b13bff' />
            <Text className='text-gray-500 mt-2'>Buscando usuários...</Text>
          </View>
        );
      }

      if (searchError) {
        return (
          <View className='flex-1 justify-center items-center px-8'>
            <View className='bg-red-100 w-20 h-20 rounded-full items-center justify-center mb-4'>
              <Ionicons name='alert-circle-outline' size={32} color='#ef4444' />
            </View>
            <Text className='text-gray-900 font-bold text-xl mb-2 text-center'>Erro na busca</Text>
            <Text className='text-gray-500 text-center leading-6 mb-6'>{searchError}</Text>
            <TouchableOpacity
              onPress={() => actions.searchUsers(searchQuery)}
              className='bg-primary-500 px-6 py-3 rounded-xl'
            >
              <Text className='text-white font-semibold'>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        );
      }

      if (searchResults.length === 0) {
        return (
          <View className='flex-1 justify-center items-center px-8'>
            <View className='bg-primary-100 w-20 h-20 rounded-full items-center justify-center mb-4'>
              <Ionicons name='search-outline' size={32} color='#b13bff' />
            </View>
            <Text className='text-gray-900 font-bold text-xl mb-2 text-center'>Nenhum usuário encontrado</Text>
            <Text className='text-gray-500 text-center leading-6'>
              Tente buscar por outro nome, username ou localização
            </Text>
          </View>
        );
      }

      // Show search results
      return (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          className='flex-1 px-4'
        >
          <View className='mb-4 px-2'>
            <Text className='text-gray-600 text-sm font-medium'>
              {String(searchResults.length)}{' '}
              {searchResults.length === 1 ? 'usuário encontrado' : 'usuários encontrados'}
            </Text>
          </View>
          {searchResults.map((user) => (
            <UserCard key={user.id} user={user} onPress={handleUserPress} onAction={handleUserAction} />
          ))}
          <View className='h-20' />
        </ScrollView>
      );
    }

    // Regular content when not searching
    if (loading && !refreshing) {
      return (
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size='large' color='#b13bff' />
          <Text className='text-gray-500 mt-2'>Carregando...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className='flex-1 justify-center items-center px-8'>
          <View className='bg-red-100 w-20 h-20 rounded-full items-center justify-center mb-4'>
            <Ionicons name='alert-circle-outline' size={32} color='#ef4444' />
          </View>
          <Text className='text-gray-900 font-bold text-xl mb-2 text-center'>Ops! Algo deu errado</Text>
          <Text className='text-gray-500 text-center leading-6 mb-6'>{error}</Text>
          <TouchableOpacity onPress={() => actions.refresh()} className='bg-primary-500 px-6 py-3 rounded-xl'>
            <Text className='text-white font-semibold'>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'requests') {
      const filteredRequests = followRequests.filter(
        (request) =>
          !searchQuery.trim() ||
          request.fromUser.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.fromUser.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredRequests.length === 0) {
        return (
          <View className='flex-1 justify-center items-center px-8'>
            <View className='bg-primary-100 w-20 h-20 rounded-full items-center justify-center mb-4'>
              <Ionicons name='person-add-outline' size={32} color='#b13bff' />
            </View>
            <Text className='text-gray-900 font-bold text-xl mb-2 text-center'>
              {searchQuery ? 'Nenhuma solicitação encontrada' : 'Nenhuma solicitação pendente'}
            </Text>
            <Text className='text-gray-500 text-center leading-6'>
              {searchQuery ? 'Tente buscar por outro nome' : 'Quando alguém solicitar seguir você, aparecerá aqui'}
            </Text>
          </View>
        );
      }

      return (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          className='flex-1 px-4'
        >
          {filteredRequests.map(renderFollowRequest)}
          <View className='h-20' />
        </ScrollView>
      );
    }

    const currentUsers = activeTab === 'followers' ? followers : following;
    const filteredUsers = filterUsers(currentUsers);

    if (filteredUsers.length === 0) {
      const isFollowersTab = activeTab === 'followers';
      return (
        <View className='flex-1 justify-center items-center px-8'>
          <View className='bg-primary-100 w-20 h-20 rounded-full items-center justify-center mb-4'>
            <Ionicons name={isFollowersTab ? 'people-outline' : 'person-outline'} size={32} color='#b13bff' />
          </View>
          <Text className='text-gray-900 font-bold text-xl mb-2 text-center'>
            {searchQuery
              ? 'Nenhum usuário encontrado'
              : isFollowersTab
                ? 'Nenhum seguidor ainda'
                : 'Não segue ninguém ainda'}
          </Text>
          <Text className='text-gray-500 text-center leading-6'>
            {searchQuery
              ? 'Tente buscar por outro nome ou local'
              : isFollowersTab
                ? 'Quando alguém seguir você, aparecerá aqui'
                : 'Comece a seguir pessoas para descobrir lugares incríveis!'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        className='flex-1 px-4'
      >
        {filteredUsers.map((user) => (
          <UserCard
            key={user.id}
            activeTab={activeTab}
            user={user}
            onPress={handleUserPress}
            onAction={handleUserAction}
          />
        ))}
        <View className='h-20' />
      </ScrollView>
    );
  };

  return (
    <View className='flex-1 bg-gray-50'>
      {/* Header */}
      <View className='bg-white pt-14 pb-4 px-4 border-b border-gray-100'>
        <View className='flex-row items-center justify-between mb-4'>
          <TouchableOpacity onPress={() => router.back()} className='w-10 h-10 items-center justify-center'>
            <Ionicons name='arrow-back' size={24} color='#374151' />
          </TouchableOpacity>
          <Text className='text-gray-900 font-bold text-xl'>Conexões</Text>
          <View className='w-10 h-10' />
        </View>

        {/* Search Input */}
        <View className='flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 mb-4'>
          <Ionicons name='search-outline' size={20} color='#9ca3af' />
          <TextInput
            placeholder='Buscar usuários por nome...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            className='flex-1 ml-3 text-gray-900 text-base'
            placeholderTextColor='#9ca3af'
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name='close-circle' size={20} color='#9ca3af' />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs - Hidden when searching */}
        {!searchQuery.trim() && (
          <View className='flex-row bg-gray-100 rounded-2xl p-1'>
            {renderTabButton('followers', 'Seguidores')}
            {renderTabButton('following', 'Seguindo')}
            {renderTabButton('requests', 'Solicitações')}
          </View>
        )}

        {/* Search results header */}
        {searchQuery.trim() && (
          <View className='bg-primary-50 p-3 rounded-xl'>
            <Text className='text-primary-600 font-medium text-sm text-center'>🔍 Buscando por "{searchQuery}"</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className='flex-1 pt-4'>{renderContent()}</View>
    </View>
  );
};

export default FollowersScreen;
