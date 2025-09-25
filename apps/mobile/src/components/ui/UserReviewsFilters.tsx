import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useState } from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import type { ReviewType } from '@pinubi/types';

interface Filters {
  reviewType?: ReviewType;
  minRating?: number;
  maxRating?: number;
  startDate?: string;
  endDate?: string;
  groupBy?: 'place' | 'category';
}

interface UserReviewsFiltersProps {
  isVisible: boolean;
  currentFilters: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
}

export const UserReviewsFilters: React.FC<UserReviewsFiltersProps> = ({
  isVisible,
  currentFilters,
  onApply,
  onClose,
}) => {
  const [filters, setFilters] = useState<Filters>(currentFilters);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const reviewTypes: { value: ReviewType; label: string }[] = [
    { value: 'food', label: 'Comida' },
    { value: 'drink', label: 'Bebida' },
    { value: 'dessert', label: 'Sobremesa' },
    { value: 'service', label: 'Atendimento' },
    { value: 'ambiance', label: 'Ambiente' },
    { value: 'overall', label: 'Geral' },
  ];

  const ratingOptions = [
    { value: 0, label: '0 - Péssimo' },
    { value: 2, label: '2 - Ruim' },
    { value: 4, label: '4 - Regular' },
    { value: 6, label: '6 - Bom' },
    { value: 8, label: '8 - Excelente' },
    { value: 10, label: '10 - Perfeito' },
  ];

  const groupByOptions = [
    { value: undefined, label: 'Sem agrupamento' },
    { value: 'place', label: 'Por lugar' },
    { value: 'category', label: 'Por categoria' },
  ];

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    setFilters({});
  };

  const handleReset = () => {
    setFilters(currentFilters);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFilters({ ...filters, startDate: selectedDate.toISOString() });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFilters({ ...filters, endDate: selectedDate.toISOString() });
    }
  };

  const renderFilterSection = (title: string, children: React.ReactNode) => (
    <View className='mb-6'>
      <Text className='text-lg font-bold text-gray-900 mb-3'>{title}</Text>
      {children}
    </View>
  );

  const renderOptionButton = (
    isSelected: boolean,
    onPress: () => void,
    label: string,
    icon?: keyof typeof Ionicons.glyphMap
  ) => (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center p-4 rounded-2xl border ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={isSelected ? '#9333ea' : '#6b7280'}
          style={{ marginRight: 12 }}
        />
      )}
      <Text
        className={`font-medium ${
          isSelected ? 'text-primary-600' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <View className='flex-1 bg-gray-50'>
        {/* Header */}
        <View className='bg-white pt-12 pb-4 border-b border-gray-100'>
          <View className='flex-row items-center justify-between px-4'>
            <TouchableOpacity onPress={onClose}>
              <Text className='text-primary-500 font-semibold text-lg'>Cancelar</Text>
            </TouchableOpacity>
            <Text className='text-gray-900 font-bold text-xl'>Filtros</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text className='text-gray-500 font-semibold text-lg'>Limpar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className='flex-1 px-4 py-6' showsVerticalScrollIndicator={false}>
          {/* Review Type */}
          {renderFilterSection(
            'Tipo de Avaliação',
            <View className='space-y-3'>
              {renderOptionButton(
                !filters.reviewType,
                () => setFilters({ ...filters, reviewType: undefined }),
                'Todos os tipos',
                'apps-outline'
              )}
              {reviewTypes.map((type) =>
                renderOptionButton(
                  filters.reviewType === type.value,
                  () => setFilters({ ...filters, reviewType: type.value }),
                  type.label,
                  'star-outline'
                )
              )}
            </View>
          )}

          {/* Rating Range */}
          {renderFilterSection(
            'Faixa de Nota',
            <View className='space-y-4'>
              <View>
                <Text className='text-gray-700 font-medium mb-2'>Nota mínima</Text>
                <View className='flex-row flex-wrap gap-2'>
                  {renderOptionButton(
                    !filters.minRating,
                    () => setFilters({ ...filters, minRating: undefined }),
                    'Qualquer nota'
                  )}
                  {ratingOptions.map((option) =>
                    renderOptionButton(
                      filters.minRating === option.value,
                      () => setFilters({ ...filters, minRating: option.value }),
                      option.label
                    )
                  )}
                </View>
              </View>

              <View>
                <Text className='text-gray-700 font-medium mb-2'>Nota máxima</Text>
                <View className='flex-row flex-wrap gap-2'>
                  {renderOptionButton(
                    !filters.maxRating,
                    () => setFilters({ ...filters, maxRating: undefined }),
                    'Qualquer nota'
                  )}
                  {ratingOptions.map((option) =>
                    renderOptionButton(
                      filters.maxRating === option.value,
                      () => setFilters({ ...filters, maxRating: option.value }),
                      option.label
                    )
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Date Range */}
          {renderFilterSection(
            'Período',
            <View className='space-y-3'>
              <View>
                <Text className='text-gray-700 font-medium mb-2'>Data inicial</Text>
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(true)}
                  className='flex-row items-center justify-between p-4 bg-white rounded-2xl border border-gray-200'
                >
                  <Text className={filters.startDate ? 'text-gray-900' : 'text-gray-500'}>
                    {filters.startDate ? formatDate(filters.startDate) : 'Selecionar data'}
                  </Text>
                  <Ionicons name='calendar-outline' size={20} color='#6b7280' />
                </TouchableOpacity>
                {filters.startDate && (
                  <TouchableOpacity
                    onPress={() => setFilters({ ...filters, startDate: undefined })}
                    className='mt-2'
                  >
                    <Text className='text-red-500 text-sm'>Remover data inicial</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View>
                <Text className='text-gray-700 font-medium mb-2'>Data final</Text>
                <TouchableOpacity
                  onPress={() => setShowEndDatePicker(true)}
                  className='flex-row items-center justify-between p-4 bg-white rounded-2xl border border-gray-200'
                >
                  <Text className={filters.endDate ? 'text-gray-900' : 'text-gray-500'}>
                    {filters.endDate ? formatDate(filters.endDate) : 'Selecionar data'}
                  </Text>
                  <Ionicons name='calendar-outline' size={20} color='#6b7280' />
                </TouchableOpacity>
                {filters.endDate && (
                  <TouchableOpacity
                    onPress={() => setFilters({ ...filters, endDate: undefined })}
                    className='mt-2'
                  >
                    <Text className='text-red-500 text-sm'>Remover data final</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Group By */}
          {renderFilterSection(
            'Agrupamento',
            <View className='space-y-3'>
              {groupByOptions.map((option) =>
                renderOptionButton(
                  filters.groupBy === option.value,
                  () => setFilters({ ...filters, groupBy: option.value as any }),
                  option.label,
                  option.value === 'place' ? 'location-outline' : 
                   option.value === 'category' ? 'grid-outline' : 'list-outline'
                )
              )}
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View className='bg-white pt-4 pb-8 px-4 border-t border-gray-100'>
          <View className='flex-row space-x-3'>
            <TouchableOpacity
              onPress={handleReset}
              className='flex-1 py-4 px-6 bg-gray-100 rounded-2xl items-center'
            >
              <Text className='text-gray-700 font-semibold'>Resetar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              className='flex-1 py-4 px-6 bg-primary-500 rounded-2xl items-center'
            >
              <Text className='text-white font-semibold'>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={filters.startDate ? new Date(filters.startDate) : new Date()}
            mode='date'
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
            maximumDate={filters.endDate ? new Date(filters.endDate) : new Date()}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={filters.endDate ? new Date(filters.endDate) : new Date()}
            mode='date'
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndDateChange}
            minimumDate={filters.startDate ? new Date(filters.startDate) : undefined}
            maximumDate={new Date()}
          />
        )}
      </View>
    </Modal>
  );
};
