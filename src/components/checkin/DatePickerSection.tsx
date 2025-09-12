import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

interface DatePickerSectionProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DatePickerSection: React.FC<DatePickerSectionProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    }

    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }

    // Return formatted date
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getQuickDateOptions = () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    const thisWeek = new Date();
    thisWeek.setDate(today.getDate() - 2);

    return [
      { label: 'Hoje', date: today },
      { label: 'Ontem', date: yesterday },
      { label: 'Anteontem', date: thisWeek },
    ];
  };

  const handleDatePickerChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (date) {
      onDateChange(date);
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const isDateSelected = (date: Date): boolean => {
    return selectedDate.toDateString() === date.toDateString();
  };

  return (
    <View className='px-4 py-6'>
      {/* <Text className='text-2xl font-bold text-gray-900 mb-2'>Data da Visita</Text>
      <Text className='text-gray-600 mb-6'>
        Confirme quando você esteve aqui
      </Text> */}
      
      {/* Selected Date Display */}
      <TouchableOpacity 
        onPress={openDatePicker}
        className='bg-gray-50 rounded-xl p-4 flex-row items-center justify-between mb-4'
      >
        <View className='flex-row items-center flex-1'>
          <View className='w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-3'>
            <Ionicons name='calendar' size={24} color='#9333EA' />
          </View>
          <View className='flex-1'>
            <Text className='text-gray-900 font-medium text-lg'>
              {formatDate(selectedDate)}
            </Text>
            <Text className='text-gray-500 text-sm'>
              {selectedDate.toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
        <View className='flex-row items-center'>
          <Text className='text-primary-500 font-medium mr-2'>Alterar</Text>
          <Ionicons name='chevron-forward' size={20} color='#9333EA' />
        </View>
      </TouchableOpacity>
      
      {/* Quick Date Options */}
      <View className='flex-row gap-2 mb-4'>
        {getQuickDateOptions().map((option) => (
          <TouchableOpacity
            key={option.label}
            onPress={() => onDateChange(option.date)}
            className={`px-4 py-2 rounded-full border ${
              isDateSelected(option.date)
                ? 'bg-primary-500 border-primary-500'
                : 'bg-gray-100 border-gray-200'
            }`}
          >
            <Text 
              className={`font-medium ${
                isDateSelected(option.date) 
                  ? 'text-white' 
                  : 'text-gray-700'
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Validation Info */}
      {selectedDate > new Date() && (
        <View className='p-3 bg-amber-50 rounded-xl flex-row items-start'>
          <Ionicons name='warning' size={20} color='#F59E0B' />
          <View className='ml-2 flex-1'>
            <Text className='text-amber-800 font-medium text-sm mb-1'>
              Data futura selecionada
            </Text>
            <Text className='text-amber-700 text-sm'>
              Você selecionou uma data no futuro. Tem certeza de que essa é a data correta da sua visita?
            </Text>
          </View>
        </View>
      )}

      {/* Tips */}
      <View className='mt-4 p-3 bg-blue-50 rounded-xl'>
        <View className='flex-row items-start'>
          <Ionicons name='information-circle' size={20} color='#3B82F6' />
          <View className='ml-2 flex-1'>
            <Text className='text-blue-800 font-medium text-sm mb-1'>
              Por que a data é importante?
            </Text>
            <Text className='text-blue-700 text-sm'>
              A data ajuda você e seus amigos a lembrarem quando visitaram um lugar e a criar um histórico das suas experiências.
            </Text>
          </View>
        </View>
      </View>

      {/* Native Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode='date'
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDatePickerChange}
          maximumDate={new Date()}
          minimumDate={new Date(2020, 0, 1)} // Allow dates from 2020 onwards
        />
      )}
    </View>
  );
};

export default DatePickerSection;
