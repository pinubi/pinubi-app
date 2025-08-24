import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import PinubiBottomSheet, { type BottomSheetRef } from './BottomSheet';

interface ProfileMenuOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}

interface ProfileBottomSheetProps {
  onClose?: () => void;
}

const ProfileBottomSheet = forwardRef<BottomSheetRef, ProfileBottomSheetProps>(
  ({ onClose }, ref) => {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
      try {
        await signOut();
        onClose?.();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    };

    const intelligentResources: ProfileMenuOption[] = [
      {
        id: 'profile',
        icon: 'person-outline',
        title: 'Perfil',
        description: 'Editar informações pessoais',
        onPress: () => {
          console.log('Navigate to profile');
          onClose?.();
        },
      },
      {
        id: 'smart-voting',
        icon: 'analytics-outline',
        title: 'Votação Inteligente',
        description: 'Sistema de decisão em grupo',
        onPress: () => {
          console.log('Navigate to smart voting');
          onClose?.();
        },
      },
      {
        id: 'personal-reviews',
        icon: 'star-outline',
        title: 'Avaliações pessoais',
        description: 'Suas avaliações e histórico',
        onPress: () => {
          console.log('Navigate to personal reviews');
          onClose?.();
        },
      },
      {
        id: 'your-lists',
        icon: 'bookmark-outline',
        title: 'Suas Listas',
        description: 'Gerenciar coleções de lugares',
        onPress: () => {
          console.log('Navigate to your lists');
          onClose?.();
        },
      },
      {
        id: 'auto-import',
        icon: 'download-outline',
        title: 'Importação automática',
        description: 'Sincronizar com outros apps',
        onPress: () => {
          console.log('Navigate to auto import');
          onClose?.();
        },
      },
      {
        id: 'pinubi-assist',
        icon: 'chatbubble-ellipses-outline',
        title: 'Pinubi Assist',
        description: 'Assistente inteligente',
        onPress: () => {
          console.log('Navigate to Pinubi Assist');
          onClose?.();
        },
      },
    ];

    const configurations: ProfileMenuOption[] = [
      {
        id: 'settings',
        icon: 'settings-outline',
        title: 'Configurações',
        description: 'Preferências do app',
        onPress: () => {
          console.log('Navigate to settings');
          onClose?.();
        },
      },
    ];

    const renderMenuSection = (title: string, options: ProfileMenuOption[]) => (
      <View className="mb-6">
        <Text className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-3 px-4">
          {title}
        </Text>
        <View className="space-y-2">
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={option.onPress}
              className="flex-row items-center px-4 py-3 mx-2 rounded-2xl bg-gray-50 active:bg-gray-100"
            >
              <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
                <Ionicons name={option.icon} size={20} color="#9333ea" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-base mb-0.5">
                  {option.title}
                </Text>
                <Text className="text-gray-600 text-sm">{option.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );

    return (
      <PinubiBottomSheet
        ref={ref}
        snapPoints={['80%']}
        index={-1}
        enablePanDownToClose={true}
        onClose={onClose}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* User Profile Header */}
          <View className="px-4 py-6 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="w-16 h-16 bg-primary-500 rounded-full items-center justify-center mr-4">
                {user?.photo ? (
                  <Text className="text-white text-xl font-bold">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                ) : (
                  <Ionicons name="person" size={28} color="white" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-xl mb-1">
                  {user?.name || 'Usuário'}
                </Text>
                <Text className="text-gray-600 text-sm">
                  Membro desde 2025
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Sections */}
          <View className="pt-6">
            {renderMenuSection('RECURSOS INTELIGENTES', intelligentResources)}
            {renderMenuSection('CONFIGURAÇÕES', configurations)}
          </View>

          {/* Footer */}
          <View className="px-4 pt-6 border-t border-gray-100">
            <TouchableOpacity
              onPress={handleSignOut}
              className="flex-row items-center justify-center py-3 px-4 bg-red-50 rounded-2xl mb-4"
            >
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text className="text-red-600 font-semibold ml-2">Sair da conta</Text>
            </TouchableOpacity>

            <View className="items-center pt-4">
              <Text className="text-primary-500 font-bold text-2xl mb-1">Pinubi</Text>
              <Text className="text-gray-500 text-sm">
                Versão 1.0.0 • Feito com ❤️ para descobrir
              </Text>
            </View>
          </View>
        </ScrollView>
      </PinubiBottomSheet>
    );
  }
);

ProfileBottomSheet.displayName = 'ProfileBottomSheet';

export default ProfileBottomSheet;
