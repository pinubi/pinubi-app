/**
 * 🌐 EXPO REACT NATIVE + HTTP REQUESTS
 * 
 * Este exemplo mostra como fazer requisições HTTP diretas
 * para as Cloud Functions do Pinubi sem usar o Firebase SDK
 * 
 * ✅ Vantagens:
 * - Não precisa instalar o Firebase SDK
 * - Maior controle sobre as requisições
 * - Funciona com qualquer biblioteca HTTP
 * 
 * ⚠️ Desvantagens:
 * - Precisa gerenciar autenticação manualmente
 * - Mais código para escrever
 * - Sem integração automática com Auth
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===========================
// CONFIGURAÇÃO DAS URLs
// ===========================

// Para DESENVOLVIMENTO (emuladores)
const FUNCTIONS_BASE_URL_DEV = 'http://127.0.0.1:5001/demo-pinubi-functions/us-central1';
const AUTH_BASE_URL_DEV = 'http://127.0.0.1:9099';

// Para PRODUÇÃO (substitua pelo seu projeto)
const FUNCTIONS_BASE_URL_PROD = 'https://us-central1-seu-projeto-id.cloudfunctions.net';
const AUTH_BASE_URL_PROD = 'https://identitytoolkit.googleapis.com/v1';

// Escolha o ambiente
const isDevelopment = __DEV__;
const FUNCTIONS_BASE_URL = isDevelopment ? FUNCTIONS_BASE_URL_DEV : FUNCTIONS_BASE_URL_PROD;
const AUTH_BASE_URL = isDevelopment ? AUTH_BASE_URL_DEV : AUTH_BASE_URL_PROD;

// ===========================
// SERVIÇO DE AUTENTICAÇÃO HTTP
// ===========================

class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
  }

  // Fazer login e obter token
  async login(email, password) {
    try {
      let response;
      
      if (isDevelopment) {
        // Auth Emulator endpoint
        response = await fetch(`${AUTH_BASE_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        });
      } else {
        // Produção - use sua API key real
        response = await fetch(`${AUTH_BASE_URL}/accounts:signInWithPassword?key=SUA_API_KEY`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro no login');
      }

      this.token = data.idToken;
      this.user = {
        uid: data.localId,
        email: data.email,
        displayName: data.displayName,
      };

      // Salvar token localmente
      await AsyncStorage.setItem('auth_token', this.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(this.user));

      return { success: true, user: this.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Fazer logout
  async logout() {
    this.token = null;
    this.user = null;
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    return { success: true };
  }

  // Carregar token salvo
  async loadSavedAuth() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        this.token = token;
        this.user = JSON.parse(userData);
        return { success: true, user: this.user };
      }
      
      return { success: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Obter token atual
  getToken() {
    return this.token;
  }

  // Verificar se está autenticado
  isAuthenticated() {
    return !!this.token;
  }
}

// ===========================
// SERVIÇO DE CLOUD FUNCTIONS HTTP
// ===========================

export class PinubiFunctionsHTTP {
  constructor(authService) {
    this.authService = authService;
  }

  // Método auxiliar para fazer requisições autenticadas
  async makeRequest(functionName, data = {}) {
    try {
      const token = this.authService.getToken();
      
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${FUNCTIONS_BASE_URL}/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || `Erro na função ${functionName}`);
      }

      return { success: true, data: result.result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ===========================
  // FUNÇÕES DE LOCALIZAÇÃO
  // ===========================

  async getUserLocation() {
    return this.makeRequest('getUserLocation');
  }

  async updateUserLocation(location, address) {
    return this.makeRequest('updateUserLocation', { location, address });
  }

  async findNearbyPlaces(latitude, longitude, radius = 5) {
    return this.makeRequest('findNearbyPlaces', { latitude, longitude, radius });
  }

  async getPlacesInMapView(center, radius, filters = {}, pagination = {}) {
    return this.makeRequest('getPlacesInMapView', { 
      center, 
      radius, 
      filters, 
      pagination: { limit: 20, offset: 0, ...pagination }
    });
  }

  // ===========================
  // FUNÇÕES DE USUÁRIO
  // ===========================

  async getUserData(userId) {
    return this.makeRequest('getUserData', { userId });
  }

  async updateUserProfile(profileData) {
    return this.makeRequest('updateUserProfile', profileData);
  }

  // ===========================
  // FUNÇÕES DE NOTIFICAÇÃO
  // ===========================

  async updateFCMToken(fcmToken) {
    return this.makeRequest('updateFCMToken', { fcmToken });
  }

  // ===========================
  // FUNÇÕES DE REVIEWS
  // ===========================

  async createReview(placeId, reviewData) {
    return this.makeRequest('createReview', { placeId, ...reviewData });
  }

  async getPlaceReviews(placeId, options = {}) {
    return this.makeRequest('getPlaceReviews', { placeId, ...options });
  }

  async getUserReviews(userId, options = {}) {
    return this.makeRequest('getUserReviews', { userId, ...options });
  }
}

// ===========================
// HOOK PARA AUTENTICAÇÃO HTTP
// ===========================

export const useAuthHTTP = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authService] = useState(() => new AuthService());

  useEffect(() => {
    // Carregar autenticação salva ao iniciar
    loadSavedAuth();
  }, []);

  const loadSavedAuth = async () => {
    setLoading(true);
    const result = await authService.loadSavedAuth();
    if (result.success) {
      setUser(result.user);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    const result = await authService.logout();
    if (result.success) {
      setUser(null);
    }
    return result;
  };

  return { 
    user, 
    loading, 
    login, 
    logout, 
    authService 
  };
};

// ===========================
// HOOK PARA LOCALIZAÇÃO HTTP
// ===========================

export const useLocationHTTP = (authService) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [functionsService] = useState(() => new PinubiFunctionsHTTP(authService));

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const result = await functionsService.getUserLocation();
      if (result.success && result.data.hasLocation) {
        setLocation(result.data.location);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (lat, lng, address, accuracy = 15) => {
    setLoading(true);
    try {
      const result = await functionsService.updateUserLocation(
        { lat, lng, accuracy },
        address
      );
      
      if (result.success) {
        await getCurrentLocation();
      }
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  const findNearbyPlaces = async (radius = 5) => {
    if (!location) {
      return { success: false, error: 'Localização não definida' };
    }

    return functionsService.findNearbyPlaces(
      location.lat,
      location.lng,
      radius
    );
  };

  return {
    location,
    loading,
    getCurrentLocation,
    updateLocation,
    findNearbyPlaces,
    functionsService
  };
};

// ===========================
// EXEMPLO DE COMPONENTE REACT
// ===========================

import React from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';

export const LocationHTTPExample = () => {
  const { user, login, logout, authService } = useAuthHTTP();
  const { location, loading, getCurrentLocation, updateLocation, findNearbyPlaces } = useLocationHTTP(authService);

  const handleLogin = async () => {
    // Usar usuários do seed
    const result = await login('user1@test.com', 'password123');
    if (result.success) {
      Alert.alert('Sucesso', 'Login realizado!');
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  const handleGetLocation = async () => {
    const result = await getCurrentLocation();
    if (result.success) {
      Alert.alert('Sucesso', 'Localização obtida!');
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  const handleUpdateLocation = async () => {
    const result = await updateLocation(
      -23.5505, 
      -46.6333, 
      'Centro, São Paulo, SP, Brasil'
    );
    
    if (result.success) {
      Alert.alert('Sucesso', 'Localização atualizada!');
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  const handleFindPlaces = async () => {
    const result = await findNearbyPlaces(5);
    if (result.success) {
      Alert.alert(
        'Lugares Próximos', 
        `Encontrados ${result.data.total} lugares!`
      );
    } else {
      Alert.alert('Erro', result.error);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login Required</Text>
        <Button title="Login (user1@test.com)" onPress={handleLogin} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pinubi HTTP Example</Text>
      
      <Text>Usuário: {user.email}</Text>
      
      {location && (
        <Text>
          Localização: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </Text>
      )}
      
      <Button 
        title="Obter Localização" 
        onPress={handleGetLocation}
        disabled={loading}
      />
      
      <Button 
        title="Atualizar Localização (SP)" 
        onPress={handleUpdateLocation}
        disabled={loading}
      />
      
      <Button 
        title="Buscar Lugares Próximos" 
        onPress={handleFindPlaces}
        disabled={loading || !location}
      />
      
      <Button 
        title="Logout" 
        onPress={logout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});

// ===========================
// EXEMPLO DE USO FETCH SIMPLES
// ===========================

export const simpleHTTPExample = async () => {
  try {
    // 1. Fazer login primeiro para obter token
    const loginResponse = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user1@test.com',
        password: 'password123',
        returnSecureToken: true,
      }),
    });

    const loginData = await loginResponse.json();
    const token = loginData.idToken;

    // 2. Usar o token para chamar uma Cloud Function
    const functionResponse = await fetch('http://127.0.0.1:5001/demo-pinubi-functions/us-central1/getUserLocation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ data: {} }),
    });

    const functionData = await functionResponse.json();
    console.log('Resultado:', functionData);

  } catch (error) {
    console.error('Erro:', error);
  }
};

export default {
  PinubiFunctionsHTTP,
  useAuthHTTP,
  useLocationHTTP,
  LocationHTTPExample,
  simpleHTTPExample
};
