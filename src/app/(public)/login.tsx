import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GoogleLogo from '@/components/GoogleLogo';
import { useAuth } from '@/hooks/useAuth';

const LoginScreen = () => {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmailAndPassword, loading, error, isSignedIn, isAuthenticated, clearError } =
    useAuth();

  // State for email/password login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailLogin, setIsEmailLogin] = useState(false);

  // Navigate to protected route when user is signed in (including mock)
  useEffect(() => {
    if (isSignedIn || isAuthenticated) {
      console.log('Navegando para tela protegida - isSignedIn:', isSignedIn, 'isAuthenticated:', isAuthenticated);
      router.replace('/(protected)/(tabs)/social');
    }
  }, [isSignedIn, isAuthenticated, router]);

  const handleGoogleSignIn = async () => {
    try {
      console.log('Iniciando login com Google...');
      await signInWithGoogle();
      console.log('Login com Google concluído');
    } catch (err) {
      // Error is handled by the auth store and useEffect above
      console.error('Erro de login no componente:', err);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      console.log('Iniciando login com email...');
      await signInWithEmailAndPassword(email, password);
      console.log('Login com email concluído');
    } catch (err) {
      console.error('Erro de login com email:', err);
      // Error is handled by the auth store and useEffect above
    }
  };

  const toggleLoginMethod = () => {
    setIsEmailLogin(!isEmailLogin);
    setEmail('');
    setPassword('');
    clearError();
  };

  return (
    <SafeAreaView className='flex-1'>
      <StatusBar barStyle='dark-content' backgroundColor='transparent' translucent />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#f4e6ff', '#ffffff', '#f4e6ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className='absolute inset-0'
      />

      {/* Decorative Background Elements - Adjusted for mobile */}
      <View className='absolute top-16 left-6 w-24 h-24 bg-primary-100 rounded-full opacity-20' />
      <View className='absolute top-32 right-8 w-20 h-20 bg-primary-200 rounded-full opacity-30' />
      <View className='absolute bottom-32 left-8 w-16 h-16 bg-primary-300 rounded-full opacity-25' />
      <View className='absolute bottom-48 right-6 w-20 h-20 bg-primary-100 rounded-full opacity-20' />

      <ScrollView
        className='flex-1'
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Main Content */}
        <View className='flex-1 justify-center items-center px-6 py-8'>
          {/* Brand Section */}
          <View className='items-center mb-12'>
            {/* App Icon/Logo */}
            <View className='w-20 h-20 bg-primary-500 rounded-2xl mb-6 items-center justify-center shadow-lg'>
              <Ionicons name='location' size={32} color='white' />
            </View>

            {/* App Name */}
            <Text className='text-3xl font-bold text-primary-800 mb-2 tracking-wide'>Pinubi</Text>

            {/* Tagline */}
            <Text className='text-base text-primary-600 text-center mb-2 font-medium'>Seu Companheiro Digital</Text>
            <Text className='text-sm text-neutral-600 text-center leading-5 px-2'>
              Descubra, organize e compartilhe os lugares que importam para você
            </Text>
          </View>

          {/* Login Form Section */}
          <View className='mb-10 w-full max-w-sm'>
            {isEmailLogin ? (
              <View className='space-y-4'>
                {/* Email Input */}
                <View className='space-y-2'>
                  <Text className='text-neutral-700 font-medium text-sm ml-1'>Email</Text>
                  <View className='bg-white border-2 border-neutral-200 rounded-xl px-4 py-3 flex-row items-center'>
                    <Ionicons name='mail-outline' size={20} color='#6b7280' />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder='seu@email.com'
                      placeholderTextColor='#9ca3af'
                      keyboardType='email-address'
                      autoCapitalize='none'
                      autoCorrect={false}
                      className='flex-1 ml-3 text-neutral-800 text-base'
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View className='space-y-2'>
                  <Text className='text-neutral-700 font-medium text-sm ml-1'>Senha</Text>
                  <View className='bg-white border-2 border-neutral-200 rounded-xl px-4 py-3 flex-row items-center'>
                    <Ionicons name='lock-closed-outline' size={20} color='#6b7280' />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder='Sua senha'
                      placeholderTextColor='#9ca3af'
                      secureTextEntry={!showPassword}
                      autoCapitalize='none'
                      autoCorrect={false}
                      className='flex-1 ml-3 text-neutral-800 text-base'
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color='#6b7280' />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Email Sign In Button */}
                <TouchableOpacity
                  onPress={handleEmailSignIn}
                  disabled={loading}
                  className='bg-primary-500 rounded-xl px-6 py-4 items-center justify-center shadow-lg mt-4'
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    transform: loading ? [{ scale: 0.98 }] : [{ scale: 1 }],
                  }}
                >
                  {loading ? (
                    <View className='flex-row items-center'>
                      <ActivityIndicator size='small' color='white' />
                      <Text className='ml-3 text-white font-semibold text-base'>Entrando...</Text>
                    </View>
                  ) : (
                    <Text className='text-white font-semibold text-base'>Entrar</Text>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View className='flex-row items-center my-6'>
                  <View className='flex-1 h-px bg-neutral-300' />
                  <Text className='px-4 text-neutral-500 text-sm'>ou</Text>
                  <View className='flex-1 h-px bg-neutral-300' />
                </View>

                {/* Google Sign In Button */}
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                  className='bg-white border-2 border-neutral-200 rounded-xl px-6 py-4 flex-row items-center justify-center shadow-lg'
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    transform: loading ? [{ scale: 0.98 }] : [{ scale: 1 }],
                  }}
                >
                  <GoogleLogo size={20} />
                  <Text className='ml-3 text-neutral-800 font-semibold text-base'>Continuar com Google</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className='space-y-4'>
                {/* Google Sign In Button */}
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                  className='bg-white border-2 border-primary-200 rounded-2xl px-6 py-4 flex-row items-center justify-center shadow-lg'
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    transform: loading ? [{ scale: 0.98 }] : [{ scale: 1 }],
                  }}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator size='small' color='#b13bff' />
                      <Text className='ml-3 text-primary-600 font-semibold text-base'>Entrando...</Text>
                    </>
                  ) : (
                    <>
                      <GoogleLogo size={20} />
                      <Text className='ml-3 text-neutral-800 font-semibold text-base'>Continuar com Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View className='flex-row items-center my-4'>
                  <View className='flex-1 h-px bg-neutral-300' />
                  <Text className='px-4 text-neutral-500 text-sm'>ou</Text>
                  <View className='flex-1 h-px bg-neutral-300' />
                </View>

                {/* Email Login Button */}
                <TouchableOpacity
                  onPress={toggleLoginMethod}
                  disabled={loading}
                  className='bg-primary-500 rounded-2xl px-6 py-4 flex-row items-center justify-center shadow-lg'
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Ionicons name='mail' size={20} color='white' />
                  <Text className='ml-3 text-white font-semibold text-base'>Entrar com Email</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Toggle Login Method */}
            <TouchableOpacity onPress={toggleLoginMethod} className='mt-6 items-center'>
              <Text className='text-primary-600 font-medium text-sm'>
                {isEmailLogin ? 'Voltar para opções de login' : 'Já tem uma conta? Entre com email'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Benefits Section - Only show when not in email login mode */}
          {!isEmailLogin && (
            <View className='mb-10 w-full max-w-sm'>
              <View className='flex-row items-center mb-4'>
                <View className='w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-3'>
                  <Ionicons name='compass' size={16} color='#b13bff' />
                </View>
                <Text className='text-neutral-700 flex-1 text-sm'>Descubra lugares especiais</Text>
              </View>

              <View className='flex-row items-center mb-4'>
                <View className='w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-3'>
                  <Ionicons name='people' size={16} color='#b13bff' />
                </View>
                <Text className='text-neutral-700 flex-1 text-sm'>Conecte-se com amigos através de lugares</Text>
              </View>

              <View className='flex-row items-center'>
                <View className='w-8 h-8 bg-primary-100 rounded-full items-center justify-center mr-3'>
                  <Ionicons name='heart' size={16} color='#b13bff' />
                </View>
                <Text className='text-neutral-700 flex-1 text-sm'>Crie coleções das suas memórias</Text>
              </View>
            </View>
          )}

          {/* Sign In Button - Remove this section as it's now handled above */}
          {/* This section is replaced by the Login Form Section above */}

          {/* Additional Call to Action */}
          <Text className='text-neutral-500 text-center mt-6 px-6 leading-5 text-xs'>
            Comece sua jornada de descoberta e transforme cada lugar em uma história que vale a pena compartilhar
          </Text>

          {/* Error Display */}
          {error && (
            <TouchableOpacity
              className='mt-6 px-4 py-3 bg-red-50 rounded-xl border border-red-200 w-full max-w-sm'
              onPress={clearError}
            >
              <View className='flex-row items-center'>
                <Ionicons name='alert-circle' size={18} color='#dc2626' />
                <Text className='text-red-600 text-xs ml-2 flex-1'>{error}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View className='pb-8 items-center px-6'>
          <Text className='text-neutral-400 text-xs text-center'>
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;
