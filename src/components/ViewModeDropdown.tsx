import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export type ViewMode = 'map' | 'list' | 'guides';

interface ViewModeOption {
  id: ViewMode;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ViewModeDropdownProps {
  selectedMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  buttonClassName?: string;
}

const ViewModeDropdown: React.FC<ViewModeDropdownProps> = ({
  selectedMode,
  onModeChange,
  buttonClassName = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const viewModeOptions: ViewModeOption[] = [
    {
      id: 'map',
      title: 'Mapa',
      description: 'Visualização em mapa interativo',
      icon: 'map-outline',
    },
    {
      id: 'list',
      title: 'Lista',
      description: 'Visualização em lista detalhada',
      icon: 'list-outline',
    },
    {
      id: 'guides',
      title: 'Guias',
      description: 'Guias curatoriais e coleções',
      icon: 'book-outline',
    },
  ];

  const currentOption = viewModeOptions.find(option => option.id === selectedMode);

  const handleModeSelect = (mode: ViewMode) => {
    onModeChange(mode);
    setIsVisible(false);
  };

  const renderOption = (option: ViewModeOption) => (
    <TouchableOpacity
      key={option.id}
      onPress={() => handleModeSelect(option.id)}
      className="flex-row items-center p-4 border-b border-gray-100 last:border-b-0"
    >
      <View className="w-12 h-12 bg-primary-100 rounded-xl items-center justify-center mr-4">
        <Ionicons name={option.icon} size={20} color="#b13bff" />
      </View>
      
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-900 mb-1">
          {option.title}
        </Text>
        <Text className="text-sm text-gray-600">
          {option.description}
        </Text>
      </View>

      {selectedMode === option.id && (
        <Ionicons name="checkmark-circle-outline" size={24} color="#b13bff" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        className={`flex-row items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-xs border ${
          isVisible ? 'border-primary-500 bg-primary-500/5' : 'border-gray-100'
        } ${buttonClassName}`}
      >
        <Ionicons name={currentOption?.icon || 'map-outline'} size={16} color="#b13bff" />
        <Ionicons 
          name={isVisible ? "chevron-up-outline" : "chevron-down-outline"} 
          size={16} 
          color="#b13bff" 
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsVisible(false)}>
          <View className="flex-1 bg-black/50 justify-center items-center px-6">
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-lg">
                {/* Header */}
                <View className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                  <Text className="text-lg font-semibold text-gray-900 text-center">
                    Modo de Visualização
                  </Text>
                </View>

                {/* Options */}
                <View className="bg-white">
                  {viewModeOptions.map(renderOption)}
                </View>

                {/* Cancel button */}
                <View className="bg-gray-50 px-4 py-3">
                  <TouchableOpacity
                    onPress={() => setIsVisible(false)}
                    className="bg-gray-200 rounded-xl py-3"
                  >
                    <Text className="text-center text-gray-700 font-medium">
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default ViewModeDropdown;
