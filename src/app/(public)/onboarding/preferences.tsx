import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import useOnboardingStore from '@/store/onboardingStore';

// Opções de preferências do usuário (moved from register.tsx)
const DIETARY_RESTRICTIONS = [
  { id: 'vegetarian', label: 'Vegetariano', emoji: '🥗' },
  { id: 'vegan', label: 'Vegano', emoji: '🌱' },
  { id: 'seafood', label: 'Frutos do Mar', emoji: '🦐' },
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

const PreferencesScreen = () => {
  const router = useRouter();
  const { data, updatePreferences } = useOnboardingStore();

  // Store preferences in onboarding store - will be sent to backend when onboarding completes
  const [preferences, setPreferences] = useState({
    categories: data?.preferences?.categories || [] as string[],
    priceRange: data?.preferences?.priceRange || [1, 4] as number[],
    dietaryRestrictions: data?.preferences?.dietaryRestrictions || [] as string[],
  });

  // Validation
  const validatePreferences = () => {
    if (preferences.categories.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos uma categoria de preferência');
      return false;
    }
    if (preferences.dietaryRestrictions.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos uma restrição alimentar (ou "Nenhuma")');
      return false;
    }
    return true;
  };

  // Continue to next step
  const handleContinue = () => {
    if (!validatePreferences()) return;
    
    // Store preferences in onboarding store
    updatePreferences(preferences);
    console.log('Preferences stored:', preferences);
    
    router.push('/onboarding/location' as any);
  };

  const handleBack = () => {
    router.back();
  };

  // Toggle functions for multi-select
  const toggleCategory = (categoryId: string) => {
    setPreferences(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const toggleDietaryRestriction = (restrictionId: string) => {
    setPreferences(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restrictionId)
        ? prev.dietaryRestrictions.filter(id => id !== restrictionId)
        : [...prev.dietaryRestrictions, restrictionId]
    }));
  };

  const togglePriceRange = (id: number) => {
    setPreferences(prev => ({
      ...prev,
      priceRange: prev.priceRange.includes(id) 
        ? prev.priceRange.filter(item => item !== id)
        : [...prev.priceRange, id]
    }));
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
              Passo 2 de 4
            </Text>
            <View className='h-2 bg-neutral-200 rounded-full'>
              <View 
                className='h-full bg-primary-500 rounded-full'
                style={{ width: '50%' }}
              />
            </View>
          </View>
          
          <View className='w-10' />
        </View>

        <View className='items-center mb-6'>
          <Text className='text-xl font-bold text-neutral-800 text-center'>
            Suas Preferências
          </Text>
          <Text className='text-sm text-neutral-600 mt-2 text-center'>
            Isso nos ajuda a personalizar suas recomendações
          </Text>
        </View>
      </View>

      <ScrollView className='flex-1 px-6' showsVerticalScrollIndicator={false}>
        <View className='space-y-6'>
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
                    preferences.categories.includes(category.id)
                      ? 'bg-primary-100 border-primary-300'
                      : 'bg-white border-neutral-200'
                  }`}
                >
                  <Text className='mr-1'>{category.emoji}</Text>
                  <Text className={`text-sm ${
                    preferences.categories.includes(category.id)
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
              {PRICE_RANGES.map((range) => (
                <TouchableOpacity
                  key={range.id}
                  onPress={() => togglePriceRange(range.id)}
                  className={`p-4 rounded-xl border-2 flex-row items-center justify-between ${
                    preferences.priceRange.includes(range.id)
                      ? 'bg-primary-100 border-primary-300'
                      : 'bg-white border-neutral-200'
                  }`}
                >
                  <View className='flex-row items-center'>
                    <Text className='mr-3 text-lg'>{range.emoji}</Text>
                    <View>
                      <Text className={`font-medium ${
                        preferences.priceRange.includes(range.id)
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
                    preferences.dietaryRestrictions.includes(restriction.id)
                      ? 'bg-primary-100 border-primary-300'
                      : 'bg-white border-neutral-200'
                  }`}
                >
                  <Text className='mr-1'>{restriction.emoji}</Text>
                  <Text className={`text-sm ${
                    preferences.dietaryRestrictions.includes(restriction.id)
                      ? 'text-primary-700 font-medium'
                      : 'text-neutral-700'
                  }`}>
                    {restriction.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Progress Summary */}
          <View className='bg-primary-50 rounded-xl p-4 border border-primary-200 mt-6'>
            <Text className='text-primary-800 font-semibold mb-2'>Resumo das preferências:</Text>
            <Text className='text-primary-700 text-sm'>• Categorias: {preferences.categories.length} selecionadas</Text>
            <Text className='text-primary-700 text-sm'>• Faixa de preço: {preferences.priceRange.length} selecionadas</Text>
            <Text className='text-primary-700 text-sm'>• Restrições: {preferences.dietaryRestrictions.length} selecionadas</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className='px-6 py-4 bg-white border-t border-neutral-200'>
        <View className='flex-row gap-2'>
          <TouchableOpacity
            onPress={handleBack}
            className='bg-neutral-200 rounded-xl px-6 py-4 items-center justify-center'
          >
            <Text className='text-neutral-700 font-semibold text-base'>Voltar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleContinue}
            className='flex-1 bg-primary-500 rounded-xl px-6 py-4 items-center justify-center'
          >
            <View className='flex-row items-center'>
              <Text className='text-white font-semibold text-base mr-2'>
                Continuar
              </Text>
              <Ionicons name='arrow-forward' size={16} color='white' />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PreferencesScreen;
