import AsyncStorage from '@react-native-async-storage/async-storage';

const saveAsyncStorage = async (key: string, data: any) => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Error saving data to AsyncStorage:', e);
  }
};

const getAsyncStorage = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error reading data from AsyncStorage:', e);
  }
};

const removeAsyncStorage = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Error removing data from AsyncStorage:', e);
  }
};

export { getAsyncStorage, removeAsyncStorage, saveAsyncStorage };
