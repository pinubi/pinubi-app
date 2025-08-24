import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

import PinubiLogo from '@/components/PinubiLogo';
import { useAuth } from '@/hooks/useAuth';

// Opções de preferências do usuário
const DIETARY_RESTRICTIONS = [
  { id: 'vegetarian', label: 'Vegetariano', emoji: '🥗' },
  { id: 'vegan', label: 'Vegano', emoji: '🌱' },
  { id: 'gluten_free', label: 'Sem Glúten', emoji: '🌾' },
  { id: 'lactose_free', label: 'Sem Lactose', emoji: '🥛' },
  { id: 'halal', label: 'Halal', emoji: '☪️' },
  { id: 'kosher', label: 'Kosher', emoji: '✡️' },
  { id: 'none', label: 'Nenhuma', emoji: '🍽️' },
];

const FOOD_CATEGORIES = [
  { id: 'japanese', label: 'Japonês', emoji: '🍣' },
  { id: 'italian', label: 'Italiano', emoji: '🍝' },
  { id: 'burgers', label: 'Hambúrguer', emoji: '🍔' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'mexican', label: 'Mexicano', emoji: '🌮' },
  { id: 'chinese', label: 'Chinês', emoji: '🥡' },
  { id: 'thai', label: 'Tailandês', emoji: '🍜' },
  { id: 'indian', label: 'Indiano', emoji: '🍛' },
  { id: 'brazilian', label: 'Brasileiro', emoji: '🇧🇷' },
  { id: 'seafood', label: 'Frutos do Mar', emoji: '🦐' },
  { id: 'steakhouse', label: 'Churrascaria', emoji: '🥩' },
  { id: 'coffee', label: 'Cafeteria', emoji: '☕' },
  { id: 'desserts', label: 'Sobremesas', emoji: '🍰' },
  { id: 'healthy', label: 'Saudável', emoji: '🥗' },
];

const PRICE_RANGES = [
  { id: 1, label: 'Econômico', description: 'Até R$ 25', emoji: '💰' },
  { id: 2, label: 'Moderado', description: 'R$ 25 - R$ 60', emoji: '💰💰' },
  { id: 3, label: 'Caro', description: 'R$ 60 - R$ 100', emoji: '💰💰💰' },
  { id: 4, label: 'Muito Caro', description: 'Acima de R$ 100', emoji: '💰💰💰💰' },
];

const RegisterScreen = () => {
  const router = useRouter();
  const { signUpWithEmailAndPassword, loading, error, clearError } = useAuth();

  // Estados do formulário
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Dados básicos (Passo 1)
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
    
    // Preferências (Passo 2)
    categories: [] as string[],
    priceRange: [1, 3] as [number, number],
    dietaryRestrictions: [] as string[],
    
    // Localização (Passo 3)
    country: 'Brasil',
    state: '',
    city: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validação de cada passo
  const validateStep1 = () => {
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
    if (!formData.inviteCode.trim()) {
      Alert.alert('Erro', 'Por favor, insira o código de convite');
      return false;
    }
    if (formData.inviteCode.length !== 6) {
      Alert.alert('Erro', 'O código de convite deve ter 6 caracteres');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.categories.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos uma categoria de preferência');
      return false;
    }
    if (formData.dietaryRestrictions.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos uma restrição alimentar (ou "Nenhuma")');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.state.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu estado');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Erro', 'Por favor, insira sua cidade');
      return false;
    }
    return true;
  };

  // Navegação entre passos
  const nextStep = () => {
    clearError();
    
    switch (currentStep) {
      case 1:
        if (validateStep1()) setCurrentStep(2);
        break;
      case 2:
        if (validateStep2()) setCurrentStep(3);
        break;
      case 3:
        if (validateStep3()) handleRegister();
        break;
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Função de registro
  const handleRegister = async () => {
    try {
      console.log('Iniciando registro com dados:', {
        ...formData,
        password: '***',
        confirmPassword: '***'
      });

      await signUpWithEmailAndPassword(
        formData.email.trim(),
        formData.password,
        {
          displayName: formData.name.trim(),
          inviteCode: formData.inviteCode.trim().toUpperCase(),
          preferences: {
            categories: formData.categories,
            priceRange: formData.priceRange,
            dietaryRestrictions: formData.dietaryRestrictions,
          },
          location: {
            country: formData.country,
            state: formData.state.trim(),
            city: formData.city.trim(),
          }
        }
      );

      console.log('Registro concluído com sucesso');
    } catch (err) {
      console.error('Erro no registro:', err);
    }
  };

  // Funções auxiliares para seleção múltipla
  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const toggleDietaryRestriction = (restrictionId: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restrictionId)
        ? prev.dietaryRestrictions.filter(id => id !== restrictionId)
        : [...prev.dietaryRestrictions, restrictionId]
    }));
  };

  const setPriceRange = (minIndex: number, maxIndex: number) => {
    setFormData(prev => ({
      ...prev,
      priceRange: [minIndex + 1, maxIndex + 1] as [number, number]
    }));
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

      {/* Header com progresso */}
      <View className='px-6 py-4'>
        <View className='flex-row items-center justify-between mb-4'>
          <TouchableOpacity onPress={() => router.back()} className='p-2'>
            <Ionicons name='arrow-back' size={24} color='#6b7280' />
          </TouchableOpacity>
          
          <View className='flex-1 mx-4'>
            <Text className='text-center text-sm text-neutral-600 mb-2'>
              Passo {currentStep} de 3
            </Text>
            <View className='h-2 bg-neutral-200 rounded-full'>
              <View 
                className='h-full bg-primary-500 rounded-full transition-all'
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </View>
          </View>
          
          <View className='w-10' />
        </View>

        {/* Logo */}
        <View className='items-center mb-6'>
          <PinubiLogo size={32} color='#b13bff' />
          <Text className='text-xl font-bold text-primary-800 mt-2'>Criar Conta</Text>
        </View>
      </View>

      <ScrollView className='flex-1 px-6' showsVerticalScrollIndicator={false}>
        {/* Passo 1: Dados Básicos */}
        {currentStep === 1 && (
          <View className='flex-col gap-4'>
            <Text className='text-lg font-semibold text-neutral-800 text-center mb-4'>
              Dados Básicos
            </Text>

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

            {/* Código de Convite */}
            <View>
              <Text className='text-neutral-700 font-medium text-sm ml-1 mb-2'>Código de Convite</Text>
              <View className='bg-white border-2 border-neutral-200 rounded-xl px-4 py-4 flex-row items-center'>
                <Ionicons name='ticket-outline' size={20} color='#6b7280' />
                <TextInput
                  value={formData.inviteCode}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, inviteCode: text.toUpperCase() }))}
                  placeholder='ABC123'
                  placeholderTextColor='#9ca3af'
                  autoCapitalize='characters'
                  maxLength={6}
                  className='flex-1 ml-3 text-neutral-800 text-base tracking-wider'
                />
              </View>
              <Text className='text-xs text-neutral-500 mt-1 ml-1'>
                Peça um código para alguém que já usa o Pinubi
              </Text>
            </View>
          </View>
        )}

        {/* Passo 2: Preferências */}
        {currentStep === 2 && (
          <View className='space-y-6'>
            <Text className='text-lg font-semibold text-neutral-800 text-center mb-4'>
              Suas Preferências
            </Text>

            {/* Categorias Favoritas */}
            <View>
              <Text className='text-neutral-700 font-medium text-sm ml-1 mb-3'>
                Categorias Favoritas (selecione várias)
              </Text>
              <View className='flex-row flex-wrap gap-2'>
                {FOOD_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => toggleCategory(category.id)}
                    className={`px-3 py-2 rounded-full border-2 flex-row items-center ${
                      formData.categories.includes(category.id)
                        ? 'bg-primary-100 border-primary-300'
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    <Text className='mr-1'>{category.emoji}</Text>
                    <Text className={`text-sm ${
                      formData.categories.includes(category.id)
                        ? 'text-primary-700 font-medium'
                        : 'text-neutral-700'
                    }`}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Faixa de Preço */}
            <View>
              <Text className='text-neutral-700 font-medium text-sm ml-1 mt-3 mb-3'>
                Faixa de Preço Preferida
              </Text>
              <View className='flex-col gap-2'>
                {PRICE_RANGES.map((range, index) => (
                  <TouchableOpacity
                    key={range.id}
                    onPress={() => setPriceRange(index, index)}
                    className={`p-4 rounded-xl border-2 flex-row items-center justify-between ${
                      formData.priceRange[0] <= range.id && formData.priceRange[1] >= range.id
                        ? 'bg-primary-100 border-primary-300'
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    <View className='flex-row items-center'>
                      <Text className='mr-3 text-lg'>{range.emoji}</Text>
                      <View>
                        <Text className={`font-medium ${
                          formData.priceRange[0] <= range.id && formData.priceRange[1] >= range.id
                            ? 'text-primary-700'
                            : 'text-neutral-800'
                        }`}>
                          {range.label}
                        </Text>
                        <Text className='text-sm text-neutral-600'>{range.description}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Restrições Alimentares */}
            <View>
              <Text className='text-neutral-700 font-medium text-sm ml-1 mt-3 mb-3'>
                Restrições Alimentares
              </Text>
              <View className='flex-row flex-wrap gap-2'>
                {DIETARY_RESTRICTIONS.map((restriction) => (
                  <TouchableOpacity
                    key={restriction.id}
                    onPress={() => toggleDietaryRestriction(restriction.id)}
                    className={`px-3 py-2 rounded-full border-2 flex-row items-center ${
                      formData.dietaryRestrictions.includes(restriction.id)
                        ? 'bg-primary-100 border-primary-300'
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    <Text className='mr-1'>{restriction.emoji}</Text>
                    <Text className={`text-sm ${
                      formData.dietaryRestrictions.includes(restriction.id)
                        ? 'text-primary-700 font-medium'
                        : 'text-neutral-700'
                    }`}>
                      {restriction.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Passo 3: Localização */}
        {currentStep === 3 && (
          <View className='space-y-6'>
            <Text className='text-lg font-semibold text-neutral-800 text-center mb-4'>
              Sua Localização
            </Text>

            <Text className='text-sm text-neutral-600 text-center mb-6'>
              Isso nos ajuda a mostrar recomendações relevantes para sua região
            </Text>

            {/* Estado */}
            <View>
              <Text className='text-neutral-700 font-medium text-sm ml-1 mb-2'>Estado</Text>
              <View className='bg-white border-2 border-neutral-200 rounded-xl px-4 py-4 flex-row items-center'>
                <Ionicons name='location-outline' size={20} color='#6b7280' />
                <TextInput
                  value={formData.state}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
                  placeholder='Ex: São Paulo'
                  placeholderTextColor='#9ca3af'
                  autoCapitalize='words'
                  className='flex-1 ml-3 text-neutral-800 text-base'
                />
              </View>
            </View>

            {/* Cidade */}
            <View>
              <Text className='text-neutral-700 font-medium text-sm ml-1 mt-2 mb-2'>Cidade</Text>
              <View className='bg-white border-2 border-neutral-200 rounded-xl px-4 py-4 flex-row items-center'>
                <Ionicons name='business-outline' size={20} color='#6b7280' />
                <TextInput
                  value={formData.city}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                  placeholder='Ex: São Paulo'
                  placeholderTextColor='#9ca3af'
                  autoCapitalize='words'
                  className='flex-1 ml-3 text-neutral-800 text-base'
                />
              </View>
            </View>

            {/* Resumo das informações */}
            <View className='bg-primary-50 p-4 rounded-xl border border-primary-200 mt-6'>
              <Text className='text-primary-800 font-semibold mb-2'>Resumo da sua conta:</Text>
              <Text className='text-primary-700 text-sm'>• Nome: {formData.name}</Text>
              <Text className='text-primary-700 text-sm'>• Email: {formData.email}</Text>
              <Text className='text-primary-700 text-sm'>• Categorias: {formData.categories.length} selecionadas</Text>
              <Text className='text-primary-700 text-sm'>• Localização: {formData.city}, {formData.state}</Text>
            </View>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <TouchableOpacity
            className='mt-6 px-4 py-3 bg-red-50 rounded-xl border border-red-200'
            onPress={clearError}
          >
            <View className='flex-row items-center'>
              <Ionicons name='alert-circle' size={18} color='#dc2626' />
              <Text className='text-red-600 text-sm ml-2 flex-1'>{error}</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Footer com botões */}
      <View className='px-6 py-4 bg-white border-t border-neutral-200'>
        <View className='flex-row gap-2'>
          {currentStep > 1 && (
            <TouchableOpacity
              onPress={prevStep}
              disabled={loading}
              className='bg-neutral-200 rounded-xl px-6 py-4 items-center justify-center'
            >
              <Text className='text-neutral-700 font-semibold text-base'>Voltar</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={nextStep}
            disabled={loading}
            className='flex-1 bg-primary-500 rounded-xl px-6 py-4 items-center justify-center'
            style={{
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <View className='flex-row items-center'>
          <ActivityIndicator size='small' color='white' />
          <Text className='ml-3 text-white font-semibold text-base'>
            {currentStep === 3 ? 'Criando...' : 'Processando...'}
          </Text>
              </View>
            ) : (
              <Text className='text-white font-semibold text-base'>
          {currentStep === 3 ? 'Criar Conta' : 'Próximo'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Link para login */}
        <TouchableOpacity 
          onPress={() => router.navigate('/(public)/login' as any)} 
          className='mt-4 items-center'
        >
          <Text className='text-primary-600 font-medium text-sm'>
            Já tem uma conta? Fazer login
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default RegisterScreen;
