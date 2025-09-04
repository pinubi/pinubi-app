import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

interface StatCard {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface ProfileSection {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: ProfileItem[];
}

interface ProfileItem {
  id: string;
  label: string;
  value?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();

  // Check if we need to reopen profile bottom sheet when going back
  const shouldReopenBottomSheet = params.onBack === 'reopenProfileBottomSheet';

  const handleBackPress = async () => {
    // If we came from the profile bottom sheet, set a flag to reopen it
    if (shouldReopenBottomSheet) {
      try {
        await AsyncStorage.setItem('shouldReopenProfileBottomSheet', 'true');
      } catch (error) {
        console.error('Error setting reopen flag:', error);
      }
    }
    
    router.back();
  };

  // Mock data - In a real app, this would come from your user profile service
  const userStats: StatCard[] = [
    {
      label: 'Listas',
      value: '3',
      icon: 'bookmark',
      color: '#3b82f6',
    },
    {
      label: 'Lugares',
      value: '25',
      icon: 'location',
      color: '#10b981',
    },
    {
      label: 'Avaliações',
      value: '12',
      icon: 'star',
      color: '#f59e0b',
    },
    {
      label: 'Seguidores',
      value: '48',
      icon: 'people',
      color: '#8b5cf6',
    },
  ];

  const profileSections: ProfileSection[] = [
    // {
    //   id: 'social',
    //   title: 'Social',
    //   icon: 'people-outline',
    //   items: [
    //     {
    //       id: 'followers-following',
    //       label: 'Seguidores e Seguindo',
    //       value: 'Ver conexões e solicitações',
    //       icon: 'people-outline',
    //       iconColor: '#8b5cf6',
    //       showChevron: true,
    //       onPress: () => {
    //         router.push('/(protected)/followers');
    //       },
    //     },
    //   ],
    // },
    // {
    //   id: 'account',
    //   title: 'Conta',
    //   icon: 'person-circle-outline',
    //   items: [
    //     {
    //       id: 'personal-info',
    //       label: 'Informações Pessoais',
    //       value: 'Editar perfil e preferências',
    //       icon: 'person-outline',
    //       showChevron: true,
    //       onPress: () => {
    //         // Navigate to personal info edit screen
    //         Alert.alert('Em breve', 'Funcionalidade de edição de perfil será implementada em breve!');
    //       },
    //     },
    //     {
    //       id: 'account-type',
    //       label: 'Tipo de Conta',
    //       value: 'Gratuita',
    //       icon: 'card-outline',
    //       iconColor: '#10b981',
    //       showChevron: true,
    //       onPress: () => {
    //         // Navigate to subscription screen
    //         Alert.alert('Upgrade', 'Deseja fazer upgrade para Premium?');
    //       },
    //     },
    //     {
    //       id: 'invite-friends',
    //       label: 'Convidar Amigos',
    //       value: 'Compartilhe o Pinubi',
    //       icon: 'share-outline',
    //       iconColor: '#3b82f6',
    //       showChevron: true,
    //       onPress: () => {
    //         // Navigate to invite friends screen
    //         Alert.alert('Convites', 'Funcionalidade de convites será implementada em breve!');
    //       },
    //     },
    //   ],
    // },
    // {
    //   id: 'preferences',
    //   title: 'Preferências',
    //   icon: 'settings-outline',
    //   items: [
    //     {
    //       id: 'notifications',
    //       label: 'Notificações',
    //       value: 'Ativadas',
    //       icon: 'notifications-outline',
    //       iconColor: '#f59e0b',
    //       showChevron: true,
    //       onPress: () => {
    //         // Navigate to notifications settings
    //         Alert.alert('Notificações', 'Configurações de notificações em breve!');
    //       },
    //     },
    //     {
    //       id: 'privacy',
    //       label: 'Privacidade',
    //       value: 'Perfil Público',
    //       icon: 'eye-outline',
    //       iconColor: '#8b5cf6',
    //       showChevron: true,
    //       onPress: () => {
    //         // Navigate to privacy settings
    //         Alert.alert('Privacidade', 'Configurações de privacidade em breve!');
    //       },
    //     },
    //     {
    //       id: 'location',
    //       label: 'Localização',
    //       value: 'São Paulo, SP',
    //       icon: 'location-outline',
    //       iconColor: '#ef4444',
    //       showChevron: true,
    //       onPress: () => {
    //         // Navigate to location settings
    //         Alert.alert('Localização', 'Configurações de localização em breve!');
    //       },
    //     },
    //   ],
    // },
    {
      id: 'support',
      title: 'Suporte',
      icon: 'help-circle-outline',
      items: [
        // {
        //   id: 'help',
        //   label: 'Central de Ajuda',
        //   icon: 'help-circle-outline',
        //   iconColor: '#06b6d4',
        //   showChevron: true,
        //   onPress: () => {
        //     Alert.alert('Ajuda', 'Central de ajuda em breve!');
        //   },
        // },
        {
          id: 'feedback',
          label: 'Enviar Feedback',
          icon: 'chatbubble-outline',
          iconColor: '#10b981',
          showChevron: true,
          onPress: () => {
            Alert.alert('Feedback', 'Obrigado pelo interesse! Sistema de feedback em breve.');
          },
        },
        {
          id: 'about',
          label: 'Sobre o Pinubi',
          icon: 'information-circle-outline',
          iconColor: '#8b5cf6',
          showChevron: true,
          onPress: () => {
            Alert.alert(
              'Sobre o Pinubi',
              'Pinubi v1.0.0\n\nSeu companheiro digital para descobrir, organizar e compartilhar lugares especiais.\n\nFeito com ❤️ para explorar'
            );
          },
        },
      ],
    },
  ];

  const handleSignOut = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair? Você pode voltar a qualquer momento.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut();
              router.replace('/(public)/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatMemberSince = (date: string) => {
    try {
      return format(new Date(date), "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return 'Janeiro de 2025';
    }
  };

  const renderStatCard = (stat: StatCard) => {
    const handleStatPress = () => {
      if (stat.label === 'Seguidores') {
        router.push('/(protected)/followers');
      }
    };

    const CardComponent = stat.label === 'Seguidores' ? TouchableOpacity : View;
    
    return (
      <CardComponent 
        key={stat.label} 
        className={`flex-1 bg-white rounded-2xl p-4 mx-1 shadow-sm border border-gray-100 ${stat.label === 'Seguidores' ? 'active:scale-95' : ''}`}
        onPress={stat.label === 'Seguidores' ? handleStatPress : undefined}
      >
        <View className='flex-row items-center justify-between mb-2'>
          <View style={{ backgroundColor: `${stat.color}20` }} className='w-10 h-10 rounded-xl items-center justify-center'>
            <Ionicons name={stat.icon} size={20} color={stat.color} />
          </View>
          {stat.label === 'Seguidores' && (
            <Ionicons name='chevron-forward' size={16} color='#9ca3af' />
          )}
        </View>
        <Text className='text-2xl font-bold text-gray-900 mb-1'>{stat.value}</Text>
        <Text className='text-sm text-gray-600'>{stat.label}</Text>
      </CardComponent>
    );
  };

  const renderProfileItem = (item: ProfileItem) => (
    <TouchableOpacity
      key={item.id}
      onPress={item.onPress}
      className='flex-row items-center py-4 px-4 bg-white rounded-2xl mb-2 shadow-sm border border-gray-100 active:bg-gray-50'
    >
      <View style={{ backgroundColor: `${item.iconColor || '#9333ea'}20` }} className='w-11 h-11 rounded-xl items-center justify-center mr-4'>
        <Ionicons name={item.icon} size={20} color={item.iconColor || '#9333ea'} />
      </View>
      
      <View className='flex-1'>
        <Text className='text-gray-900 font-semibold text-base mb-0.5'>{item.label}</Text>
        {item.value && <Text className='text-gray-600 text-sm'>{item.value}</Text>}
      </View>
      
      {item.showChevron && <Ionicons name='chevron-forward' size={20} color='#9ca3af' />}
    </TouchableOpacity>
  );

  const renderSection = (section: ProfileSection) => (
    <View key={section.id} className='mb-8'>
      <View className='flex-row items-center mb-4 px-4'>
        <Ionicons name={section.icon} size={20} color='#6b7280' />
        <Text className='text-gray-600 font-semibold text-base ml-2 uppercase tracking-wide'>{section.title}</Text>
      </View>
      <View className='px-4'>
        {section.items.map(renderProfileItem)}
      </View>
    </View>
  );

  return (
    <View className='flex-1 bg-gray-50'>
      {/* Header */}
      <View className='bg-white pt-14 pb-6 px-4'>
        <View className='flex-row items-center justify-between'>
          <TouchableOpacity onPress={handleBackPress} className='w-10 h-10 items-center justify-center'>
            <Ionicons name='arrow-back' size={24} color='#374151' />
          </TouchableOpacity>
          <Text className='text-gray-900 font-bold text-xl'>Perfil</Text>
          <View className='w-10 h-10' />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className='flex-1'>
        {/* User Profile Section */}
        <View className='bg-white mx-4 mt-6 rounded-3xl p-6 shadow-sm border border-gray-100'>
          <View className='items-center'>
            {/* Profile Picture */}
            <View className='relative mb-4'>
              {user?.photo ? (
                <Image source={{ uri: user.photo }} className='w-24 h-24 rounded-full' />
              ) : (
                <View className='w-24 h-24 bg-primary-500 rounded-full items-center justify-center'>
                  <Text className='text-white text-3xl font-bold'>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
              )}
              
              {/* Edit Button */}
              <TouchableOpacity 
                className='absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 rounded-full items-center justify-center shadow-md'
                onPress={() => Alert.alert('Editar Foto', 'Funcionalidade de edição de foto em breve!')}
              >
                <Ionicons name='camera' size={16} color='white' />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <Text className='text-gray-900 font-bold text-2xl mb-1'>{user?.name || 'Usuário'}</Text>
            <Text className='text-gray-600 text-base mb-1'>{user?.email}</Text>
            <Text className='text-gray-500 text-sm'>
              Membro desde {formatMemberSince(user?.createdAt || new Date().toISOString())}
            </Text>

            {/* Account Status Badge */}
            <View className='mt-4 bg-primary-100 px-4 py-2 rounded-full'>
              <Text className='text-primary-700 font-semibold text-sm'>Conta Gratuita</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        {/* <View className='px-4 mt-6'>
          <Text className='text-gray-600 font-semibold text-base mb-4 px-2 uppercase tracking-wide'>Estatísticas</Text>
          <View className='flex-row'>
            {userStats.map(renderStatCard)}
          </View>
        </View> */}

        {/* Profile Sections */}
        <View className='mt-8'>
          {profileSections.map(renderSection)}
        </View>

        {/* Sign Out Button */}
        <View className='px-4 pb-8'>
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={loading}
            className='flex-row items-center justify-center py-4 px-4 bg-red-50 rounded-2xl border border-red-100'
          >
            <Ionicons name='log-out-outline' size={20} color='#dc2626' />
            <Text className='text-red-600 font-semibold ml-2'>
              {loading ? 'Saindo...' : 'Sair da Conta'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version Footer */}
        <View className='items-center pb-20 pt-4'>
          <Text className='text-primary-500 font-bold text-xl mb-1'>Pinubi</Text>
          <Text className='text-gray-500 text-sm'>Versão 1.0.0 • Feito com ❤️ para descobrir</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
