import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import type { PhotoData } from '@/types/reviews';

export interface RawPhoto {
  uri: string;
  fileName?: string;
}

interface PhotoUploadSectionProps {
  photos: RawPhoto[];
  onPhotosChange: (photos: RawPhoto[]) => void;
  maxPhotos?: number;
}

// Export the conversion function to be used when finalizing
export const convertPhotosToPhotoData = async (rawPhotos: RawPhoto[]): Promise<PhotoData[]> => {
  const photoPromises = rawPhotos.map(async (rawPhoto, index) => {
    try {
      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(rawPhoto.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get image dimensions
      const getImageDimensions = (): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
          Image.getSize(
            rawPhoto.uri,
            (width, height) => resolve({ width, height }),
            (error) => reject(error)
          );
        });
      };

      const dimensions = await getImageDimensions();

      // Generate filename if not provided
      const generatedFileName = rawPhoto.fileName || `foto_${Date.now()}_${index}.jpg`;
      
      // Determine mime type from file extension or default to jpeg
      const extension = generatedFileName.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

      return {
        base64: `data:${mimeType};base64,${base64}`,
        fileName: generatedFileName,
        mimeType,
        width: dimensions.width,
        height: dimensions.height,
      };
    } catch (error) {
      console.error('Error converting image:', error);
      throw error;
    }
  });

  return Promise.all(photoPromises);
};

const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 5,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const selectPhotos = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de acesso à sua galeria para adicionar fotos.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsLoading(true);

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newPhotos: RawPhoto[] = result.assets.map((asset, index) => ({
          uri: asset.uri,
          fileName: asset.fileName || `galeria_${Date.now()}_${index}.jpg`
        }));
        
        const updatedPhotos = [...photos, ...newPhotos].slice(0, maxPhotos);
        onPhotosChange(updatedPhotos);
      }
    } catch (error) {
      console.error('Error selecting photos:', error);
      Alert.alert(
        'Erro',
        'Não foi possível selecionar as fotos. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de acesso à sua câmera para tirar fotos.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsLoading(true);

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        aspect: [4, 3],
        allowsEditing: true,
      });

      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        const newPhoto: RawPhoto = {
          uri: asset.uri,
          fileName: `camera_${Date.now()}.jpg`
        };
        const updatedPhotos = [...photos, newPhoto].slice(0, maxPhotos);
        onPhotosChange(updatedPhotos);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(
        'Erro',
        'Não foi possível tirar a foto. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(updatedPhotos);
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Adicionar Foto',
      'Como você gostaria de adicionar uma foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Câmera', onPress: takePhoto },
        { text: 'Galeria', onPress: selectPhotos },
      ]
    );
  };

  return (
    <View className='px-4 py-6'>
      <Text className='text-2xl font-bold text-gray-900 mb-2'>Adicionar Fotos</Text>
      <Text className='text-gray-600 mb-6'>
        Compartilhe como foi sua experiência (opcional)
      </Text>
      
      {/* Photo Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className='mb-4'>
        {/* Existing Photos */}
        {photos.map((photo, index) => (
          <View key={index} className='relative mr-3'>
            <Image 
              source={{ uri: photo.uri }} 
              className='w-24 h-24 rounded-xl' 
              resizeMode='cover'
            />
            <TouchableOpacity
              onPress={() => removePhoto(index)}
              className='absolute -top-0 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center'
            >
              <Ionicons name='close' size={16} color='white' />
            </TouchableOpacity>
          </View>
        ))}
        
        {/* Add Photo Button */}
        {photos.length < maxPhotos && (
          <TouchableOpacity 
            onPress={showPhotoOptions}
            className='w-24 h-24 bg-gray-100 rounded-xl items-center justify-center border-2 border-dashed border-gray-300'
            disabled={isLoading}
          >
            {isLoading ? (
              <View className='items-center'>
                <Ionicons name='hourglass' size={24} color='#9CA3AF' />
                <Text className='text-xs text-gray-500 mt-1'>Carregando...</Text>
              </View>
            ) : (
              <View className='items-center'>
                <Ionicons name='camera' size={32} color='#9CA3AF' />
                <Text className='text-xs text-gray-500 mt-1 text-center'>
                  Adicionar{'\n'}foto
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Photo Counter */}
      <View className='flex-row items-center justify-between'>
        <Text className='text-sm text-gray-500'>
          {photos.length} de {maxPhotos} fotos
        </Text>
        
        {photos.length > 0 && (
          <TouchableOpacity 
            onPress={() => onPhotosChange([])}
            className='px-3 py-1 bg-red-50 rounded-full'
          >
            <Text className='text-red-600 text-sm font-medium'>
              Remover todas
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tips */}
      {photos.length === 0 && (
        <View className='mt-4 p-3 bg-blue-50 rounded-xl'>
          <View className='flex-row items-start'>
            <Ionicons name='information-circle' size={20} color='#3B82F6' />
            <View className='ml-2 flex-1'>
              <Text className='text-blue-800 font-medium text-sm mb-1'>
                Dica para fotos incríveis
              </Text>
              <Text className='text-blue-700 text-sm'>
                Adicione fotos da comida, ambiente ou momentos especiais para compartilhar sua experiência! As fotos serão processadas apenas quando você finalizar.
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default PhotoUploadSection;
