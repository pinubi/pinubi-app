import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { usePortal } from './PortalProvider';

export type BottomSheetRef = BottomSheet;

interface PlaceFormData {
  name: string;
  description: string;
  category: string;
  priceRange: string;
  cuisine?: string;
}

interface AddPlaceBottomSheetPortalProps {
  listId: string;
  onSave?: (data: PlaceFormData) => void;
  onClose?: () => void;
}

// Category options
const CATEGORY_OPTIONS = [
  { id: 'restaurant', label: 'Restaurante', icon: 'restaurant-outline' },
  { id: 'cafe', label: 'Café', icon: 'cafe-outline' },
  { id: 'bar', label: 'Bar', icon: 'wine-outline' },
  { id: 'fast-food', label: 'Fast Food', icon: 'pizza-outline' },
  { id: 'dessert', label: 'Sobremesa', icon: 'ice-cream-outline' },
  { id: 'bakery', label: 'Padaria', icon: 'storefront-outline' },
];

// Price range options
const PRICE_RANGE_OPTIONS = [
  { id: '$', label: '$', description: 'Econômico' },
  { id: '$$', label: '$$', description: 'Moderado' },
  { id: '$$$', label: '$$$', description: 'Caro' },
  { id: '$$$$', label: '$$$$', description: 'Muito caro' },
];

// Cuisine options
const CUISINE_OPTIONS = [
  'Brasileira', 'Italiana', 'Japonesa', 'Chinesa', 'Americana', 'Mexicana',
  'Indiana', 'Francesa', 'Árabe', 'Tailandesa', 'Coreana', 'Grega',
  'Espanhola', 'Peruana', 'Vegetariana', 'Vegana', 'Contemporânea', 'Fusion'
];

const AddPlaceBottomSheetPortal = forwardRef<BottomSheetRef, AddPlaceBottomSheetPortalProps>(
  ({ listId, onSave, onClose }, ref) => {
    const { showPortal, hidePortal } = usePortal();
    const bottomSheetRef = useRef<BottomSheetRef>(null);
    
    const snapPoints = useMemo(() => ['90%'], []);
    const [isVisible, setIsVisible] = useState(false);

    // Form state
    const [formData, setFormData] = useState<PlaceFormData>({
      name: '',
      description: '',
      category: '',
      priceRange: '',
      cuisine: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCuisineOptions, setShowCuisineOptions] = useState(false);

    // Form validation
    const isFormValid = useMemo(() => {
      return formData.name.trim().length >= 2 && 
             formData.category.length > 0 && 
             formData.priceRange.length > 0;
    }, [formData.name, formData.category, formData.priceRange]);

    // Expose methods to parent component
    React.useImperativeHandle(ref, () => ({
      snapToIndex: (index: number) => {
        if (index >= 0) {
          showBottomSheet();
        } else {
          hideBottomSheet();
        }
      },
      close: hideBottomSheet,
      collapse: hideBottomSheet,
      expand: showBottomSheet,
      snapToPosition: showBottomSheet,
      forceClose: hideBottomSheet,
    }));

    const handleSheetChanges = useCallback(
      (index: number) => {
        console.log('AddPlaceBottomSheet index changed to:', index);
        if (index === -1) {
          hideBottomSheet();
          onClose?.();
        }
      },
      [onClose]
    );

    const showBottomSheet = useCallback(() => {
      setIsVisible(true);
    }, []);

    const hideBottomSheet = useCallback(() => {
      setIsVisible(false);
    }, []);

    const handleSave = useCallback(async () => {
      if (!isFormValid || isSaving) return;

      try {
        setIsSaving(true);

        const trimmedName = formData.name.trim();
        if (trimmedName.length < 2) {
          Alert.alert('Erro', 'O nome do lugar deve ter pelo menos 2 caracteres.');
          return;
        }

        const placeData: PlaceFormData = {
          ...formData,
          name: trimmedName,
          description: formData.description.trim(),
        };

        onSave?.(placeData);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          priceRange: '',
          cuisine: '',
        });
        setSearchQuery('');
        
        hideBottomSheet();
      } catch (error) {
        console.error('Error saving place:', error);
        Alert.alert('Erro', 'Não foi possível adicionar o lugar. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    }, [isFormValid, isSaving, formData, onSave, hideBottomSheet]);

    const filteredCuisines = useMemo(() => {
      if (!searchQuery) return CUISINE_OPTIONS;
      return CUISINE_OPTIONS.filter(cuisine => 
        cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [searchQuery]);

    // Handle portal visibility
    useEffect(() => {
      if (isVisible) {
        const content = (
          <BottomSheet
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            enableDynamicSizing={false}
            onChange={handleSheetChanges}
            enableOverDrag={false}
            keyboardBehavior='interactive'
            keyboardBlurBehavior='restore'
            style={{
              zIndex: 1001,
              elevation: 1001,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: -4 },
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
            <BottomSheetScrollView style={{ backgroundColor: 'white' }}>
              {/* Header */}
              <View className='px-4 py-4 border-b border-gray-100'>
                <View className='flex-row items-center justify-between'>
                  <Text className='text-gray-900 font-bold text-xl'>
                    Adicionar Lugar
                  </Text>
                  <TouchableOpacity onPress={hideBottomSheet}>
                    <Ionicons name='close' size={24} color='#6b7280' />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search Section */}
              <View className='px-4 py-6 bg-white border-b border-gray-100'>
                <View className='flex-row items-center bg-primary-50 rounded-2xl px-4 py-4 mb-4'>
                  <Ionicons name='search' size={20} color='#9333ea' />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder='Buscar restaurantes, bares, cafés...'
                    className='flex-1 ml-3 text-gray-900'
                    placeholderTextColor='#9CA3AF'
                  />
                </View>

                <View className='items-center'>
                  <Text className='text-4xl mb-3'>🍽️</Text>
                  <Text className='text-lg font-semibold text-gray-900 mb-2'>
                    Descubra novos lugares
                  </Text>
                  <Text className='text-gray-600 text-center'>
                    Digite o nome ou categoria do lugar que você quer adicionar
                  </Text>
                </View>
              </View>

              {/* Manual Add Form */}
              <View className='px-4 py-6'>
                <Text className='text-lg font-semibold text-gray-900 mb-4'>
                  Ou adicione manualmente
                </Text>

                {/* Place Name */}
                <View className='mb-4'>
                  <Text className='text-sm font-medium text-gray-700 mb-2'>
                    Nome do lugar *
                  </Text>
                  <TextInput
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder='Ex: Restaurante da Maria'
                    className='bg-gray-50 rounded-xl px-4 py-3 text-gray-900'
                    maxLength={100}
                  />
                </View>

                {/* Category */}
                <View className='mb-4'>
                  <Text className='text-sm font-medium text-gray-700 mb-3'>
                    Categoria *
                  </Text>
                  <View className='flex-row flex-wrap gap-2'>
                    {CATEGORY_OPTIONS.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        onPress={() => setFormData(prev => ({ ...prev, category: category.id }))}
                        className={`flex-row items-center px-4 py-3 rounded-xl border ${
                          formData.category === category.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={18}
                          color={formData.category === category.id ? '#9333ea' : '#6b7280'}
                        />
                        <Text
                          className={`ml-2 font-medium ${
                            formData.category === category.id ? 'text-primary-600' : 'text-gray-700'
                          }`}
                        >
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Price Range */}
                <View className='mb-4'>
                  <Text className='text-sm font-medium text-gray-700 mb-3'>
                    Faixa de preço *
                  </Text>
                  <View className='flex-row gap-2'>
                    {PRICE_RANGE_OPTIONS.map((price) => (
                      <TouchableOpacity
                        key={price.id}
                        onPress={() => setFormData(prev => ({ ...prev, priceRange: price.id }))}
                        className={`flex-1 items-center p-4 rounded-xl border ${
                          formData.priceRange === price.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Text
                          className={`text-lg font-bold mb-1 ${
                            formData.priceRange === price.id ? 'text-primary-600' : 'text-gray-700'
                          }`}
                        >
                          {price.label}
                        </Text>
                        <Text
                          className={`text-xs text-center ${
                            formData.priceRange === price.id ? 'text-primary-600' : 'text-gray-500'
                          }`}
                        >
                          {price.description}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Cuisine */}
                <View className='mb-4'>
                  <Text className='text-sm font-medium text-gray-700 mb-2'>
                    Tipo de culinária (opcional)
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCuisineOptions(!showCuisineOptions)}
                    className='bg-gray-50 rounded-xl px-4 py-3 flex-row items-center justify-between'
                  >
                    <Text className={formData.cuisine ? 'text-gray-900' : 'text-gray-500'}>
                      {formData.cuisine || 'Selecione uma culinária'}
                    </Text>
                    <Ionicons 
                      name={showCuisineOptions ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color='#6b7280' 
                    />
                  </TouchableOpacity>

                  {showCuisineOptions && (
                    <View className='mt-2 bg-white border border-gray-200 rounded-xl max-h-48'>
                      <BottomSheetScrollView style={{ maxHeight: 192 }}>
                        {filteredCuisines.map((cuisine, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              setFormData(prev => ({ ...prev, cuisine }));
                              setShowCuisineOptions(false);
                            }}
                            className='px-4 py-3 border-b border-gray-100'
                          >
                            <Text className='text-gray-900'>{cuisine}</Text>
                          </TouchableOpacity>
                        ))}
                      </BottomSheetScrollView>
                    </View>
                  )}
                </View>

                {/* Description */}
                <View className='mb-6'>
                  <Text className='text-sm font-medium text-gray-700 mb-2'>
                    Descrição (opcional)
                  </Text>
                  <TextInput
                    value={formData.description}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                    placeholder='Descreva o lugar...'
                    multiline
                    numberOfLines={3}
                    className='bg-gray-50 rounded-xl px-4 py-3 text-gray-900'
                    style={{ textAlignVertical: 'top' }}
                    maxLength={200}
                  />
                </View>
              </View>

              {/* Bottom Actions */}
              <View className='px-4 pt-4 pb-8 border-t border-gray-100 bg-white'>
                <View className='flex-row gap-2'>
                  <TouchableOpacity
                    onPress={hideBottomSheet}
                    className='flex-1 py-4 bg-gray-100 rounded-2xl items-center'
                  >
                    <Text className='text-gray-700 font-semibold'>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={!isFormValid || isSaving}
                    className={`flex-1 py-4 rounded-2xl items-center ${
                      isFormValid && !isSaving ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  >
                    <Text className={`font-semibold ${isFormValid && !isSaving ? 'text-white' : 'text-gray-500'}`}>
                      {isSaving ? 'Adicionando...' : 'Adicionar lugar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BottomSheetScrollView>
          </BottomSheet>
        );

        showPortal(content, 'add-place-bottom-sheet');
      } else {
        hidePortal('add-place-bottom-sheet');
      }
    }, [isVisible, formData, searchQuery]);

    return null;
  }
);

AddPlaceBottomSheetPortal.displayName = 'AddPlaceBottomSheetPortal';

export default AddPlaceBottomSheetPortal;
