import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import useOnboardingStore from '@/store/onboardingStore';
import { completeOnboardingFlow } from '@/utils/firestoreHelpers';

const InviteScreen = () => {
  const router = useRouter();
  const { updateUserValidation } = useAuth();
  const { data, updateSignup, completeOnboarding } = useOnboardingStore();
  const [inviteCode, setInviteCode] = useState(data?.signup?.inviteCode || '');
  const [loading, setLoading] = useState(false);

  // Validation
  const validateInviteCode = () => {
    if (!inviteCode.trim()) {
      Alert.alert('Erro', 'Por favor, insira o código de convite');
      return false;
    }
    if (inviteCode.length !== 6) {
      Alert.alert('Erro', 'O código de convite deve ter 6 caracteres');
      return false;
    }
    return true;
  };

  // Handle invite code submission
  const handleSubmitInviteCode = async () => {
    if (!validateInviteCode()) return;
    
    try {
      setLoading(true);
      
      console.log('Starting onboarding completion with invite code:', inviteCode);
      
      // Validate that we have all required onboarding data
      if (!data?.preferences || !data?.location || !data?.permissions) {
        Alert.alert('Erro', 'Dados de onboarding incompletos. Por favor, complete todas as etapas anteriores.');
        router.push('/onboarding/welcome' as any);
        return;
      }
      
      // Store invite code in onboarding store
      updateSignup({
        displayName: data?.signup?.displayName || '',
        inviteCode: inviteCode.trim().toUpperCase(),
      });

      // Call the complete onboarding flow with Cloud Functions
      const result = await completeOnboardingFlow(
        inviteCode.trim().toUpperCase(),
        data.preferences,
        data.location,
        data.permissions
      );
      
      if (result.success) {
        console.log('Onboarding completed successfully:', result.data);
        
        // Mark onboarding as completed in store
        completeOnboarding();
        
        // Update user validation status to allow access to protected routes
        // The Cloud Function should have already updated the user in Firestore
        updateUserValidation(true, true, true);
        
        console.log('User is now validated and active - redirecting to protected app');
        
        // Show success message and redirect
        Alert.alert(
          'Bem-vindo ao Pinubi! 🎉',
          'Sua conta foi ativada com sucesso. Agora você pode descobrir lugares incríveis!',
          [
            {
              text: 'Começar a explorar',
              onPress: () => {
                router.replace('/(protected)/(tabs)/social');
              }
            }
          ]
        );
      } else {
        console.error('Onboarding completion failed:', result.error);
        Alert.alert('Erro', result.error || 'Erro ao validar código de convite. Tente novamente.');
      }
      
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      Alert.alert('Erro', 'Erro inesperado. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Open how to get invite code
  const handleHowToGetCode = () => {
    Alert.alert(
      'Como conseguir um código?',
      'Para conseguir um código de convite:\n\n1. Peça para um amigo que já usa o Pinubi\n2. Entre em contato conosco pelo Instagram @pinubi.app\n3. Participe de nossos eventos e promoções',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Abrir Instagram', 
          onPress: () => Linking.openURL('https://instagram.com/pinubi.app') 
        },
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className='flex-1'>      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#f4e6ff', '#ffffff', '#f4e6ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className='absolute inset-0'
      />

      {/* Header */}
      <View className='px-6 py-4'>
        <View className='flex-row items-center justify-between mb-4'>
          <TouchableOpacity onPress={handleBack} className='p-2'>
            <Ionicons name='arrow-back' size={24} color='#6b7280' />
          </TouchableOpacity>
          
          <View className='flex-1 mx-4'>
            <Text className='text-center text-sm text-neutral-600 mb-2'>
              Passo 5 de 5
            </Text>
            <View className='h-2 bg-neutral-200 rounded-full'>
              <View 
                className='h-full bg-primary-500 rounded-full'
                style={{ width: '100%' }}
              />
            </View>
          </View>
          
          <View className='w-10' />
        </View>

        <View className='items-center mb-6'>
          <Text className='text-xl font-bold text-neutral-800 text-center'>
            Código de Convite
          </Text>
          <Text className='text-sm text-neutral-600 mt-2 text-center'>
            Insira seu código para ativar sua conta
          </Text>
        </View>
      </View>

      <ScrollView className='flex-1 px-6' showsVerticalScrollIndicator={false}>
        <View className='space-y-6'>
          {/* Invite Code Icon */}
          <View className='items-center py-8'>
            <View className='w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4'>
              <Ionicons name='ticket' size={40} color='#b13bff' />
            </View>
            <Text className='text-lg font-semibold text-neutral-800'>
              Quase lá! 🎉
            </Text>
            <Text className='text-sm text-neutral-600 text-center mt-2 leading-relaxed'>
              O Pinubi está em acesso antecipado. Insira seu código de 6 caracteres para ativar sua conta.
            </Text>
          </View>

          {/* Invite Code Input */}
          <View className='mb-3'>
            <Text className='text-neutral-700 font-medium text-sm ml-1 mb-2'>Código de Convite</Text>
            <View className='bg-white border-2 border-neutral-200 rounded-xl px-4 py-4 flex-row items-center'>
              <Ionicons name='ticket-outline' size={20} color='#6b7280' />
              <TextInput
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                placeholder='ABC123'
                placeholderTextColor='#9ca3af'
                autoCapitalize='characters'
                maxLength={6}
                className='flex-1 ml-3 text-neutral-800 text-base tracking-wider'
                style={{ letterSpacing: 2 }}
              />
            </View>
            <Text className='text-xs text-neutral-500 mt-1 ml-1'>
              O código é composto por 6 caracteres alfanuméricos
            </Text>
          </View>

          {/* How to get code */}
          <TouchableOpacity
            onPress={handleHowToGetCode}
            className='bg-blue-50 rounded-xl p-4 border border-blue-200 mb-3'
          >
            <View className='flex-row items-center mb-2'>
              <Ionicons name='help-circle' size={20} color='#2563eb' />
              <Text className='text-blue-800 font-medium ml-2'>Como conseguir um código?</Text>
            </View>
            <Text className='text-blue-700 text-sm leading-relaxed'>
              Ainda não tem um código? Toque aqui para ver como conseguir seu convite para o Pinubi.
            </Text>
          </TouchableOpacity>

          {/* Benefits */}
          <View className='bg-gradient-to-r from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-200 mb-3'>
            <View className='flex-row items-center mb-4'>
              <Ionicons name='star' size={20} color='#b13bff' />
              <Text className='text-primary-800 font-semibold ml-2'>Acesso Antecipado</Text>
            </View>
            
            <Text className='text-primary-700 text-sm leading-relaxed mb-4'>
              Com o código de convite, você terá acesso a:
            </Text>
            
            <View className='space-y-2'>
              <View className='flex-row items-center'>
                <Ionicons name='restaurant' size={16} color='#b13bff' />
                <Text className='text-primary-700 text-sm ml-2'>Descobrir lugares únicos</Text>
              </View>
              <View className='flex-row items-center'>
                <Ionicons name='list' size={16} color='#b13bff' />
                <Text className='text-primary-700 text-sm ml-2'>Criar listas personalizadas</Text>
              </View>
              <View className='flex-row items-center'>
                <Ionicons name='people' size={16} color='#b13bff' />
                <Text className='text-primary-700 text-sm ml-2'>Conectar com outros foodlovers</Text>
              </View>
              <View className='flex-row items-center'>
                <Ionicons name='sparkles' size={16} color='#b13bff' />
                <Text className='text-primary-700 text-sm ml-2'>Sugestões personalizadas da IA</Text>
              </View>
              <View className='flex-row items-center'>
                <Ionicons name='gift' size={16} color='#b13bff' />
                <Text className='text-primary-700 text-sm ml-2'>5 créditos grátis para IA</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className='px-6 py-4 bg-white border-t border-neutral-200'>
        <View className='flex-row gap-2'>
          <TouchableOpacity
            onPress={handleBack}
            disabled={loading}
            className='bg-neutral-200 rounded-xl px-6 py-4 items-center justify-center'
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            <Text className='text-neutral-700 font-semibold text-base'>Voltar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSubmitInviteCode}
            disabled={loading || inviteCode.length !== 6}
            className='flex-1 bg-primary-500 rounded-xl px-6 py-4 items-center justify-center'
            style={{ opacity: (loading || inviteCode.length !== 6) ? 0.7 : 1 }}
          >
            {loading ? (
              <View className='flex-row items-center'>
                <ActivityIndicator size='small' color='white' />
                <Text className='text-white font-semibold text-base ml-2'>
                  Validando...
                </Text>
              </View>
            ) : (
              <View className='flex-row items-center'>
                <Text className='text-white font-semibold text-base mr-2'>
                  Ativar Conta
                </Text>
                <Ionicons name='checkmark-circle' size={16} color='white' />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default InviteScreen;
