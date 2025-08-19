import { serperService } from '@/services/serperService';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const SerperTestComponent: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testSerperAPI = async () => {
    setLoading(true);
    setTestResult('Testing Serper API...');

    try {
      // Test with São Paulo coordinates
      const places = await serperService.searchNearbyPlaces({
        query: 'restaurantes',
        latitude: -23.5505,
        longitude: -46.6333,
        zoom: 14,
        language: 'pt-br',
      });

      setTestResult(`✅ Success! Found ${places.length} places:\n\n${places.map(p => `• ${p.title} (${p.rating || 'No rating'})`).join('\n')}`);
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-xl font-bold mb-4">Serper API Test</Text>
      
      <TouchableOpacity
        onPress={testSerperAPI}
        disabled={loading}
        className="bg-primary-500 p-4 rounded-lg mb-4"
      >
        <Text className="text-white text-center font-semibold">
          {loading ? 'Testing...' : 'Test Serper API'}
        </Text>
      </TouchableOpacity>

      <ScrollView className="flex-1 bg-gray-100 p-4 rounded-lg">
        <Text className="text-sm font-mono">{testResult || 'Click the button to test the API'}</Text>
      </ScrollView>
    </View>
  );
};

export default SerperTestComponent;
