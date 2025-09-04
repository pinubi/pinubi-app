import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { router } from 'expo-router';
import React, { forwardRef, useCallback, useMemo, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { usePortal } from './PortalProvider';

export type BottomSheetRef = BottomSheet;

interface ProfileMenuOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}

interface ProfileBottomSheetPortalProps {
  onClose?: () => void;
}

const ProfileBottomSheetPortal = forwardRef<BottomSheetRef, ProfileBottomSheetPortalProps>(({ onClose }, ref) => {
  const { user, signOut } = useAuth();
  const { showPortal, hidePortal } = usePortal();
  const bottomSheetRef = useRef<BottomSheetRef>(null);

  const snapPoints = useMemo(() => ['80%'], []);

  // Expose methods to parent component
  React.useImperativeHandle(ref, () => ({
    snapToIndex: (index: number) => {
      if (index >= 0) {
        showBottomSheet();
      } else {
        hideBottomSheet();
      }
    },
    close: () => {
      hideBottomSheet();
    },
    collapse: () => {
      hideBottomSheet();
    },
    expand: () => {
      showBottomSheet();
    },
    snapToPosition: (position: string | number) => {
      showBottomSheet();
    },
    forceClose: () => {
      hideBottomSheet();
    },
  }));

  const handleSheetChanges = useCallback(
    (index: number) => {
      console.log('ProfileBottomSheet index changed to:', index);
      if (index === -1) {
        hideBottomSheet();
        onClose?.();
      }
    },
    [onClose]
  );

  const showBottomSheet = () => {
    const bottomSheetContent = (
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onChange={handleSheetChanges}
        enableOverDrag={false}
        keyboardBehavior='interactive'
        keyboardBlurBehavior='restore'
        style={{
          zIndex: 1001,
          elevation: 1001,
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        }}
        backgroundStyle={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        handleStyle={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 12,
        }}
        handleIndicatorStyle={{
          backgroundColor: '#E5E7EB',
          width: 40,
          height: 4,
          borderRadius: 2,
        }}
      >
        <BottomSheetScrollView>
          {/* User Profile Header */}
          <View className='px-4 py-6 border-b border-gray-100'>
            <View className='flex-row items-center'>
              <View className='w-16 h-16 bg-primary-500 rounded-full items-center justify-center mr-4'>
                {user?.photo ? (
                  <Text className='text-white text-xl font-bold'>{user.name?.charAt(0).toUpperCase() || 'U'}</Text>
                ) : (
                  <Ionicons name='person' size={28} color='white' />
                )}
              </View>
              <View className='flex-1'>
                <Text className='text-gray-900 font-bold text-xl mb-1'>{user?.name || 'Usuário'}</Text>
                <Text className='text-gray-600 text-sm'>
                  {`Membro desde ${format(user?.createdAt || new Date(), 'yyyy')} `}
                </Text>
              </View>
              <TouchableOpacity onPress={hideBottomSheet}>
                <Ionicons name='close' size={24} color='#6b7280' />
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Sections */}
          <View className='pt-6'>
            {renderMenuSection('RECURSOS INTELIGENTES', intelligentResources)}
            {/* {renderMenuSection('CONFIGURAÇÕES', configurations)} */}
          </View>

          {/* Footer */}
          <View className='px-4 pt-6 border-t border-gray-100'>
            <TouchableOpacity
              onPress={handleSignOut}
              className='flex-row items-center justify-center py-3 px-4 bg-red-50 rounded-2xl mb-4'
            >
              <Ionicons name='log-out-outline' size={20} color='#dc2626' />
              <Text className='text-red-600 font-semibold ml-2'>Sair da conta</Text>
            </TouchableOpacity>

            <View className='items-center pt-4 pb-10'>
              <Text className='text-primary-500 font-bold text-2xl mb-1'>Pinubi</Text>
              <Text className='text-gray-500 text-sm'>Versão 1.0.0 • Feito com ❤️ para descobrir</Text>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );

    showPortal(bottomSheetContent, 'profile-bottom-sheet');
  };

  const hideBottomSheet = () => {
    hidePortal('profile-bottom-sheet');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      hideBottomSheet();
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
        hideBottomSheet();
        // Pass a callback to reopen this bottom sheet when coming back
        router.push({
          pathname: '/(protected)/profile',
          params: {
            onBack: 'reopenProfileBottomSheet'
          }
        });
      },
    },
    // {
    //   id: 'smart-voting',
    //   icon: 'analytics-outline',
    //   title: 'Votação Inteligente',
    //   description: 'Sistema de decisão em grupo',
    //   onPress: () => {
    //     console.log('Navigate to smart voting');
    //     hideBottomSheet();
    //   },
    // },
    // {
    //   id: 'personal-reviews',
    //   icon: 'star-outline',
    //   title: 'Avaliações pessoais',
    //   description: 'Suas avaliações e histórico',
    //   onPress: () => {
    //     console.log('Navigate to personal reviews');
    //     hideBottomSheet();
    //   },
    // },
    // {
    //   id: 'your-lists',
    //   icon: 'bookmark-outline',
    //   title: 'Suas Listas',
    //   description: 'Gerenciar coleções de lugares',
    //   onPress: () => {
    //     console.log('Navigate to your lists');
    //     hideBottomSheet();
    //   },
    // },
    // {
    //   id: 'auto-import',
    //   icon: 'download-outline',
    //   title: 'Importação automática',
    //   description: 'Sincronizar com outros apps',
    //   onPress: () => {
    //     console.log('Navigate to auto import');
    //     hideBottomSheet();
    //   },
    // },
    // {
    //   id: 'pinubi-assist',
    //   icon: 'chatbubble-ellipses-outline',
    //   title: 'Pinubi Assist',
    //   description: 'Assistente inteligente',
    //   onPress: () => {
    //     console.log('Navigate to Pinubi Assist');
    //     hideBottomSheet();
    //   },
    // },
  ];

  const configurations: ProfileMenuOption[] = [
    {
      id: 'settings',
      icon: 'settings-outline',
      title: 'Configurações',
      description: 'Preferências do app',
      onPress: () => {
        console.log('Navigate to settings');
        hideBottomSheet();
      },
    },
  ];

  const renderMenuSection = (title: string, options: ProfileMenuOption[]) => (
    <View className='mb-6'>
      <Text className='text-gray-500 text-sm font-medium uppercase tracking-wide mb-3 px-4'>{title}</Text>
      <View className='space-y-2'>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={option.onPress}
            className='flex-row items-center px-4 py-3 mx-2 rounded-2xl bg-gray-50 active:bg-gray-100'
          >
            <View className='w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3'>
              <Ionicons name={option.icon} size={20} color='#9333ea' />
            </View>
            <View className='flex-1'>
              <Text className='text-gray-900 font-semibold text-base mb-0.5'>{option.title}</Text>
              <Text className='text-gray-600 text-sm'>{option.description}</Text>
            </View>
            <Ionicons name='chevron-forward' size={20} color='#9ca3af' />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // This component doesn't render anything itself - it uses the portal
  return null;
});

ProfileBottomSheetPortal.displayName = 'ProfileBottomSheetPortal';

export default ProfileBottomSheetPortal;
