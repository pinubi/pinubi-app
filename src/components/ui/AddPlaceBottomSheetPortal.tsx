import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { placesService } from '@/services/placesService';
import type { AutocompleteResult } from '@/types/googlePlaces';
import type { AddPlaceToListRequest } from '@/types/lists';
import AutocompleteList from './AutocompleteList';
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
  onSave?: (data: AddPlaceToListRequest) => void;
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

    // Google Places Autocomplete
    const {
      results: autocompleteResults,
      loading: autocompleteLoading,
      error: autocompleteError,
      search: searchAutocomplete,
      clearResults: clearAutocompleteResults,
      isApiAvailable,
    } = useGooglePlacesAutocomplete({
      debounceDelay: 300,
      minCharacters: 3,
    });

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
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);

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

    // Handle search input changes
    const handleSearchChange = useCallback((text: string) => {
      setSearchQuery(text);
      
      if (text.length >= 3 && isApiAvailable) {
        // Trigger autocomplete search
        setShowAutocomplete(true);
        setShowManualForm(false);
        searchAutocomplete(text);
      } else {
        // Clear autocomplete for short queries
        setShowAutocomplete(false);
        clearAutocompleteResults();
      }
    }, [isApiAvailable, searchAutocomplete, clearAutocompleteResults]);

    // Handle autocomplete selection
    const handleAutocompleteSelect = useCallback(async (result: AutocompleteResult) => {
      console.log('🎯 Autocomplete result selected:', result);
      
      try {
        setIsSaving(true);
        
        // Create or get place from Google Places
        const placeResponse = await placesService.createOrGetPlaceFromAutocomplete(result);
        
        if (!placeResponse.success || !placeResponse.place) {
          Alert.alert('Erro', placeResponse.error || 'Não foi possível adicionar o lugar');
          return;
        }
        
        // Create AddPlaceToListRequest
        const addPlaceRequest: AddPlaceToListRequest = {
          listId,
          placeId: placeResponse.place.id,
          personalNote: '', // Could add a field for this later
          tags: [] // Could add a field for this later
        };
        
        onSave?.(addPlaceRequest);
        
        // Reset form
        setSearchQuery('');
        setShowAutocomplete(false);
        clearAutocompleteResults();
        
        hideBottomSheet();
      } catch (error) {
        console.error('Error adding place from autocomplete:', error);
        Alert.alert('Erro', 'Não foi possível adicionar o lugar. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    }, [listId, onSave, hideBottomSheet, clearAutocompleteResults]);

    // Handle manual place creation
    const handleManualSave = useCallback(async () => {
      if (!isFormValid || isSaving) return;

      try {
        setIsSaving(true);

        const trimmedName = formData.name.trim();
        if (trimmedName.length < 2) {
          Alert.alert('Erro', 'O nome do lugar deve ter pelo menos 2 caracteres.');
          return;
        }

        // Create manual place
        const placeResponse = await placesService.createManualPlace({
          name: trimmedName,
          description: formData.description.trim(),
          category: formData.category,
          priceRange: formData.priceRange,
          cuisine: formData.cuisine?.trim(),
          userId: 'current_user' // Will be handled by the calling component
        });

        if (!placeResponse.success || !placeResponse.place) {
          Alert.alert('Erro', placeResponse.error || 'Não foi possível criar o lugar');
          return;
        }

        // Create AddPlaceToListRequest
        const addPlaceRequest: AddPlaceToListRequest = {
          listId,
          placeId: placeResponse.place.id,
          personalNote: formData.description.trim(),
          tags: formData.cuisine ? [formData.cuisine.toLowerCase()] : []
        };

        onSave?.(addPlaceRequest);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          priceRange: '',
          cuisine: '',
        });
        setSearchQuery('');
        setShowManualForm(false);
        
        hideBottomSheet();
      } catch (error) {
        console.error('Error creating manual place:', error);
        Alert.alert('Erro', 'Não foi possível criar o lugar. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    }, [isFormValid, isSaving, formData, listId, onSave, hideBottomSheet]);

    const handleSave = handleManualSave;

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
            <View style={{ backgroundColor: 'white', flex: 1 }}>
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
                    onChangeText={handleSearchChange}
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
                  <Text className='text-gray-600 text-center mb-4'>
                    Digite o nome ou categoria do lugar que você quer adicionar
                  </Text>
                  
                  {/* Toggle to manual form */}
                  <TouchableOpacity
                    onPress={() => setShowManualForm(true)}
                    className='flex-row items-center bg-gray-100 rounded-full px-4 py-2'
                  >
                    <Ionicons name='add' size={16} color='#6b7280' />
                    <Text className='text-gray-600 ml-2 font-medium'>
                      Ou adicione manualmente
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Autocomplete Results */}
              {showAutocomplete && (
                <View className='flex-1 bg-white'>
                  <AutocompleteList
                    results={autocompleteResults}
                    onResultPress={handleAutocompleteSelect}
                    loading={autocompleteLoading}
                    error={autocompleteError}
                    emptyMessage={
                      searchQuery.length < 3 
                        ? 'Digite pelo menos 3 caracteres para buscar...'
                        : !isApiAvailable
                        ? 'Busca indisponível no momento'
                        : 'Nenhum lugar encontrado para sua busca'
                    }
                  />
                </View>
              )}

              {/* Manual Add Form */}
              {showManualForm && (
                <BottomSheetScrollView className='flex-1 bg-white'>
                  <View className='px-4 py-6'>
                    <View className='flex-row items-center justify-between mb-4'>
                      <Text className='text-lg font-semibold text-gray-900'>
                        Adicionar manualmente
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowManualForm(false)}
                        className='w-8 h-8 items-center justify-center bg-gray-100 rounded-full'
                      >
                        <Ionicons name='close' size={16} color='#6b7280' />
                      </TouchableOpacity>
                    </View>

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
                </BottomSheetScrollView>
              )}

              {/* Bottom Actions */}
              {showManualForm && (
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
              )}
            </View>
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
