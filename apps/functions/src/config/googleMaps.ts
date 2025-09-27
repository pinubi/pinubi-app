export const getGoogleMapsConfig = () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY não configurada nas variáveis de ambiente');
  }

  return {
    apiKey,
    defaultLanguage: process.env.GOOGLE_MAPS_DEFAULT_LANGUAGE || 'pt-BR',
    defaultRegion: process.env.GOOGLE_MAPS_DEFAULT_REGION || 'BR'
  };
};
