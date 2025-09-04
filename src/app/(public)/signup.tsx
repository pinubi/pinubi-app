import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PinubiLogo from '@/components/PinubiLogo';
import { useAuth } from '@/hooks/useAuth';
import useOnboardingStore from '@/store/onboardingStore';

const SignupScreen = () => {
  const router = useRouter();
  const { signUpWithEmailAndPassword, loading, error, clearError } = useAuth();
  const { updateSignup, resetOnboarding } = useOnboardingStore();

  // Form state for basic signup only
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu nome completo');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu email');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return false;
    }
    return true;
  };

  // Simplified signup - just create Firebase user
  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      clearError();
      console.log('Iniciando signup básico...');

      // Store signup data for onboarding
      updateSignup({
        displayName: formData.name.trim(),
        inviteCode: '', // Will be collected in onboarding
      });

      // Create basic Firebase user with minimal data
      await signUpWithEmailAndPassword(
        formData.email.trim(),
        formData.password,
        {
          displayName: formData.name.trim(),
          inviteCode: '', // Will be collected in onboarding
          // Placeholder preferences - will be collected in onboarding
          preferences: {
            categories: [],
            priceRange: [1, 4],
            dietaryRestrictions: [],
          },
          // Placeholder location - will be collected in onboarding
          location: {
            country: 'Brasil',
            state: '',
            city: '',
          }
        }
      );

      console.log('Signup básico concluído, redirecionando para convite...');
      
      // Redirect directly to invite screen (skipping welcome, preferences, location, permissions)
      router.replace('/(public)/onboarding/invite');
      
    } catch (err) {
      console.error('Erro no signup:', err);
    }
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
          <TouchableOpacity onPress={() => router.back()} className='p-2'>
            <Ionicons name='arrow-back' size={24} color='#6b7280' />
          </TouchableOpacity>
          
          <View className='flex-1 mx-4'>
            <Text className='text-center text-sm text-neutral-600 mb-2'>
              Criar Conta
            </Text>
          </View>
          
          <View className='w-10' />
        </View>

        {/* Logo */}
        <View className='items-center mb-6'>
          <PinubiLogo size={32} color='#b13bff' />
          <Text className='text-xl font-bold text-primary-800 mt-2'>Bem-vindo ao Pinubi</Text>
          <Text className='text-sm text-neutral-600 mt-1 text-center'>
            Vamos criar sua conta para começar
          </Text>
        </View>
      </View>

      <ScrollView className='flex-1 px-6' showsVerticalScrollIndicator={false}>
        <View className='flex-col gap-4'>
          {/* Nome */}
          <View>
            <Text className='text-neutral-700 font-medium text-sm ml-1 mb-2'>Nome Completo</Text>
            <View className='bg-white border-2 border-neutral-200 rounded-xl px-4 py-4 flex-row items-center'>
              <Ionicons name='person-outline' size={20} color='#6b7280' />
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder='Seu nome completo'
                placeholderTextColor='#9ca3af'
                autoCapitalize='words'
                className='flex-1 ml-3 text-neutral-800 text-base'
              />
            </View>
          </View>

          {/* Email */}
          <View>
            <Text className='text-neutral-700 font-medium text-sm ml-1 mb-2'>Email</Text>
            <View className='bg-white border-2 border-neutral-200 rounded-xl px-4 py-4 flex-row items-center'>
              <Ionicons name='mail-outline' size={20} color='#6b7280' />
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder='seu@email.com'
                placeholderTextColor='#9ca3af'
                keyboardType='email-address'
                autoCapitalize='none'
                autoCorrect={false}
                className='flex-1 ml-3 text-neutral-800 text-base'
              />
            </View>
          </View>

          {/* Senha */}
          <View>
            <Text className='text-neutral-700 font-medium text-sm ml-1 mb-2'>Senha</Text>
            <View className='bg-white border-2 border-neutral-200 rounded-xl px-4 py-4 flex-row items-center'>
              <Ionicons name='lock-closed-outline' size={20} color='#6b7280' />
              <TextInput
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                placeholder='Mínimo 6 caracteres'
                placeholderTextColor='#9ca3af'
                secureTextEntry={!showPassword}
                autoCapitalize='none'
                className='flex-1 ml-3 text-neutral-800 text-base'
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color='#6b7280' />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmar Senha */}
          <View>
            <Text className='text-neutral-700 font-medium text-sm ml-1 mb-2'>Confirmar Senha</Text>
            <View className='bg-white border-2 border-neutral-200 rounded-xl px-4 py-4 flex-row items-center'>
              <Ionicons name='lock-closed-outline' size={20} color='#6b7280' />
              <TextInput
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                placeholder='Digite a senha novamente'
                placeholderTextColor='#9ca3af'
                secureTextEntry={!showConfirmPassword}
                autoCapitalize='none'
                className='flex-1 ml-3 text-neutral-800 text-base'
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color='#6b7280' />
              </TouchableOpacity>
            </View>
          </View>

          {/* Early Access Notice */}
          <View className='bg-primary-50 p-4 rounded-xl border border-primary-200 mt-4'>
            <View className='flex-row items-center mb-2'>
              <Ionicons name='star' size={16} color='#b13bff' />
              <Text className='text-primary-800 font-semibold ml-2'>Acesso Antecipado</Text>
            </View>
            <Text className='text-primary-700 text-sm'>
              O Pinubi está em fase beta! Após criar sua conta, você receberá as instruções para conseguir seu código de convite e ativar sua conta.
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <TouchableOpacity
              className='mt-4 px-4 py-3 bg-red-50 rounded-xl border border-red-200'
              onPress={clearError}
            >
              <View className='flex-row items-center'>
                <Ionicons name='alert-circle' size={18} color='#dc2626' />
                <Text className='text-red-600 text-sm ml-2 flex-1'>{error}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className='px-6 py-4 bg-white border-t border-neutral-200'>
        <TouchableOpacity
          onPress={handleSignup}
          disabled={loading}
          className='bg-primary-500 rounded-xl px-6 py-4 items-center justify-center mb-4'
          style={{
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <View className='flex-row items-center'>
              <ActivityIndicator size='small' color='white' />
              <Text className='ml-3 text-white font-semibold text-base'>
                Criando conta...
              </Text>
            </View>
          ) : (
            <Text className='text-white font-semibold text-base'>
              Criar Conta
            </Text>
          )}
        </TouchableOpacity>

        {/* Link para login */}
        <TouchableOpacity 
          onPress={() => router.navigate('/(public)/login')} 
          className='items-center'
        >
          <Text className='text-primary-600 font-medium text-sm'>
            Já tem uma conta? Fazer login
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SignupScreen;
