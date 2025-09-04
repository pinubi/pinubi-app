import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import type { ListFormData } from '@/types/lists';
import { MultilineTextInput } from './MultilineTextInput';

export type BottomSheetRef = BottomSheet;

interface CreateEditListBottomSheetPortalProps {
  mode: 'create' | 'edit';
  listId?: string;
  initialData?: Partial<ListFormData>;
  onSave?: (data: ListFormData) => void;
  onClose?: () => void;
}

// Emoji options for quick selection
const EMOJI_OPTIONS = [
  '🍽️',
  '🍕',
  '🍔',
  '🍜',
  '🍣',
  '🍰',
  '☕',
  '🍷',
  '🎭',
  '🏛️',
  '🏖️',
  '🏔️',
  '🎨',
  '🛍️',
  '💕',
  '🎵',
  '🏋️',
  '📚',
  '🎮',
  '✈️',
  '🌮',
  '🍦',
  '🥘',
  '🍳',
  '🧁',
  '🥗',
  '🍲',
  '🍱',
  '🥙',
  '🌯',
];

const CreateEditListBottomSheetPortal = forwardRef<BottomSheetRef, CreateEditListBottomSheetPortalProps>(
  ({ mode, listId, initialData, onSave, onClose }, ref) => {
    const { user } = useAuth();
    const bottomSheetRef = useRef<BottomSheetRef>(null);

    const snapPoints = useMemo(() => ['85%'], []);
    const [isVisible, setIsVisible] = useState(false);

    // Form state
    const [formData, setFormData] = useState<ListFormData>({
      title: '',
      emoji: '🍽️',
      description: '',
      visibility: 'public',
      tags: [],
    });

    const [isSaving, setIsSaving] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(true);
    const [tagInput, setTagInput] = useState('');

    // Form validation
    const isFormValid = useMemo(() => {
      return formData.title.trim().length >= 2 && formData.title.trim().length <= 50;
    }, [formData.title]);

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
        console.log('CreateEditListBottomSheet index changed to:', index);
        if (index === -1) {
          hideBottomSheet();
          onClose?.();
        }
      },
      [onClose]
    );

    const showBottomSheet = useCallback(() => {
      setIsVisible(true);
      
      // If in edit mode and we have initial data, populate the form
      if (mode === 'edit' && initialData) {
        setFormData({
          title: initialData.title || '',
          emoji: initialData.emoji || '🍽️',
          description: initialData.description || '',
          visibility: initialData.visibility || 'public',
          tags: initialData.tags || [],
        });
      }
    }, [mode, initialData]);

    const resetFormState = useCallback(() => {
      setFormData({
        title: '',
        emoji: '🍽️',
        description: '',
        visibility: 'public',
        tags: [],
      });
      setShowEmojiPicker(true);
      setTagInput('');
      setIsSaving(false);
    }, []);

    const hideBottomSheet = useCallback(() => {
      setIsVisible(false);
      // Reset form state when closing
      resetFormState();
    }, [resetFormState]);

    const handleAddTag = useCallback(() => {
      const tag = tagInput.trim().toLowerCase();
      if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, tag],
        }));
        setTagInput('');
      }
    }, [tagInput, formData.tags]);

    const handleRemoveTag = useCallback((index: number) => {
      setFormData((prev) => ({
        ...prev,
        tags: prev.tags.filter((_, i) => i !== index),
      }));
    }, []);

    const handleSave = useCallback(async () => {
      if (!isFormValid || isSaving) return;

      try {
        setIsSaving(true);

        const trimmedTitle = formData.title.trim();
        if (trimmedTitle.length < 2) {
          Alert.alert('Erro', 'O título deve ter pelo menos 2 caracteres.');
          return;
        }

        const listData: ListFormData = {
          ...formData,
          title: trimmedTitle,
          description: formData.description.trim(),
        };

        onSave?.(listData);
        
        // Close bottom sheet (this will automatically reset the form)
        hideBottomSheet();
      } catch (error) {
        console.error('Error saving list:', error);
        Alert.alert('Erro', 'Não foi possível salvar a lista. Tente novamente.');
      } finally {
        setIsSaving(false);
      }
    }, [isFormValid, isSaving, formData, onSave, hideBottomSheet]);

    // Reset form when mode changes
    // useEffect(() => {
    //   if (initialData) {
    //     setFormData({
    //       title: initialData.title || '',
    //       emoji: initialData.emoji || '🍽️',
    //       description: initialData.description || '',
    //       visibility: initialData.visibility || 'public',
    //       tags: initialData.tags || [],
    //     });
    //   }
    // }, [initialData, mode]);

    // Render content when visible - no portal needed, direct rendering
    if (!isVisible) {
      return null;
    }

    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1001,
          elevation: 1001,
        }}
        pointerEvents='box-none'
      >
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
          <BottomSheetScrollView style={{ backgroundColor: 'white', marginBottom: 100 }}>
            {/* Header */}
            <View className='px-4 py-4 border-b border-gray-100'>
              <View className='flex-row items-center justify-between'>
                <Text className='text-gray-900 font-bold text-xl'>
                  {mode === 'create' ? 'Nova Lista' : 'Editar Lista'}
                </Text>
                <TouchableOpacity onPress={hideBottomSheet}>
                  <Ionicons name='close' size={24} color='#6b7280' />
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Content */}
            <View className='px-4 pt-6'>
              {/* Emoji and Title Row */}
              <View className='flex-row items-center mb-6'>
                <TouchableOpacity
                  onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                  className='w-16 h-16 bg-gray-100 rounded-2xl items-center justify-center mr-4'
                >
                  <Text className='text-2xl'>{formData.emoji}</Text>
                </TouchableOpacity>

                <View className='flex-1'>
                  <TextInput
                    value={formData.title}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
                    placeholder='Nome da lista'
                    className='text-xl font-semibold text-gray-900 bg-gray-50 rounded-xl px-4 py-3'
                    maxLength={50}
                    autoFocus={mode === 'create'}
                  />
                  <Text className='text-xs text-gray-500 mt-1'>{String(formData.title.length)}/50 caracteres</Text>
                </View>
              </View>

              {/* Emoji Options */}
              {showEmojiPicker && (
                <View className='mb-6'>
                  <Text className='text-sm font-medium text-gray-700 mb-3'>Escolha um emoji</Text>
                  <View className='flex-row flex-wrap gap-2'>
                    {EMOJI_OPTIONS.map((emoji, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setFormData((prev) => ({ ...prev, emoji }));
                        }}
                        className={`w-12 h-12 rounded-xl items-center justify-center ${
                          formData.emoji === emoji ? 'bg-primary-100' : 'bg-gray-100'
                        }`}
                      >
                        <Text className='text-xl'>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Description */}
              <View className='mb-6'>
                <MultilineTextInput
                  label='Descrição'
                  placeholder='Descreva sua lista...'
                  value={formData.description}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                  maxLength={200}
                  numberOfLines={3}
                  minHeight={80}
                />
              </View>

              {/* Visibility */}
              <View className='mb-6'>
                <Text className='text-sm font-medium text-gray-700 mb-3'>Visibilidade</Text>
                <View className='flex-row gap-2'>
                  <TouchableOpacity
                    onPress={() => setFormData((prev) => ({ ...prev, visibility: 'public' }))}
                    className={`flex-1 flex-row items-center p-4 rounded-xl border ${
                      formData.visibility === 'public'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <Ionicons
                      name='globe-outline'
                      size={20}
                      color={formData.visibility === 'public' ? '#9333ea' : '#6b7280'}
                    />
                    <View className='ml-3'>
                      <Text
                        className={`font-medium ${
                          formData.visibility === 'public' ? 'text-primary-600' : 'text-gray-700'
                        }`}
                      >
                        Pública
                      </Text>
                      <Text className='text-xs text-gray-500'>Visível para todos</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setFormData((prev) => ({ ...prev, visibility: 'private' }))}
                    className={`flex-1 flex-row items-center p-4 rounded-xl border ${
                      formData.visibility === 'private'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <Ionicons
                      name='lock-closed-outline'
                      size={20}
                      color={formData.visibility === 'private' ? '#9333ea' : '#6b7280'}
                    />
                    <View className='ml-3'>
                      <Text
                        className={`font-medium ${
                          formData.visibility === 'private' ? 'text-primary-600' : 'text-gray-700'
                        }`}
                      >
                        Privada
                      </Text>
                      <Text className='text-xs text-gray-500'>Só você vê</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tags */}
              <View className='mb-8'>
                <Text className='text-sm font-medium text-gray-700 mb-2'>Tags (opcional)</Text>

                <View className='flex-row items-center mb-3'>
                  <TextInput
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder='Adicionar tag...'
                    className='flex-1 bg-gray-50 rounded-xl px-4 py-3 text-gray-900 mr-2'
                    maxLength={20}
                    onSubmitEditing={handleAddTag}
                  />
                  <TouchableOpacity
                    onPress={handleAddTag}
                    className='w-12 h-12 bg-primary-500 rounded-xl items-center justify-center'
                    disabled={!tagInput.trim()}
                  >
                    <Ionicons name='add' size={20} color='white' />
                  </TouchableOpacity>
                </View>

                {formData.tags.length > 0 && (
                  <View className='flex-row flex-wrap gap-2'>
                    {formData.tags.map((tag, index) => (
                      <View key={index} className='flex-row items-center bg-primary-100 rounded-full px-3 py-1'>
                        <Text className='text-primary-700 text-sm font-medium'>{tag}</Text>
                        <TouchableOpacity onPress={() => handleRemoveTag(index)} className='ml-2'>
                          <Ionicons name='close' size={14} color='#9333ea' />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
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
                    {isSaving ? 'Salvando...' : mode === 'create' ? 'Criar Lista' : 'Salvar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    );
  }
);

CreateEditListBottomSheetPortal.displayName = 'CreateEditListBottomSheetPortal';

export default CreateEditListBottomSheetPortal;
