import { ActivityPost, FeedItem } from '@/types/feed';

/**
 * Converte um FeedItem do backend para ActivityPost usado no UI
 */
export const mapFeedItemToActivityPost = (feedItem: FeedItem): ActivityPost => {
  const { data, type, authorName, authorUsername, authorAvatar, createdAt } = feedItem;
  
  // Debug logging to track the issue
  console.log('🔍 Mapping feed item:', { 
    id: feedItem.id, 
    type, 
    createdAt: typeof createdAt, 
    createdAtValue: createdAt 
  });
  
  // Calcular timestamp relativo - ensure createdAt is a string
  let timestamp: string;
  try {
    if (typeof createdAt === 'string') {
      timestamp = formatRelativeTime(createdAt);
    } else if (createdAt && typeof createdAt === 'object' && (createdAt as any).formatted) {
      console.warn('⚠️ Found object with formatted property in createdAt:', createdAt);
      timestamp = formatRelativeTime((createdAt as any).formatted);
    } else {
      console.warn('⚠️ Invalid createdAt format:', createdAt);
      timestamp = 'agora';
    }
  } catch (error) {
    console.error('❌ Error processing timestamp:', error);
    timestamp = 'agora';
  }
  
  // Mapear dados baseado no tipo da atividade
  let content: ActivityPost['content'] = {
    title: '',
    description: data.comment
  };
  
  let activityType: ActivityPost['type'] = 'place_added';
  
  switch (type) {
    case 'place_added':
      activityType = 'place_added';
      content = {
        title: `Adicionou ${data.placeName || 'um lugar'} a uma lista`,
        description: data.comment,
        placeName: data.placeName,
        placeAddress: data.placeAddress,
        category: data.placeCategories?.[0] || 'Local',
        photos: data.photos
      };
      break;
      
    case 'place_visited':
      activityType = 'place_visited';
      content = {
        title: `Visitou ${data.placeName || 'um lugar'}`,
        description: data.comment,
        placeName: data.placeName,
        placeAddress: data.placeAddress,
        category: data.placeCategories?.[0] || 'Local',
        photos: data.photos
      };
      break;
      
    case 'place_reviewed':
      activityType = 'review';
      content = {
        title: `Avaliou ${data.placeName || 'um lugar'}`,
        description: data.reviewComment || data.comment,
        placeName: data.placeName,
        placeAddress: data.placeAddress,
        category: data.placeCategories?.[0] || 'Local',
        rating: data.rating,
        photos: data.reviewPhotos || data.photos
      };
      break;
      
    case 'list_created':
      activityType = 'list_created';
      content = {
        title: `${data.listEmoji || '📋'} ${data.listTitle || 'Criou uma lista'}`,
        description: data.listDescription,
        category: data.listCategory || 'Lista',
        photos: data.photos
      };
      break;
      
    case 'list_purchased':
      activityType = 'list_created'; // Usar mesmo tipo visual
      content = {
        title: `Comprou a lista ${data.listEmoji || '📋'} ${data.listTitle || 'uma lista'}`,
        description: data.listDescription,
        category: 'Lista Premium',
        photos: data.photos
      };
      break;
      
    case 'user_followed':
      activityType = 'place_added'; // Usar tipo genérico
      content = {
        title: `Começou a seguir ${data.followedUserName || 'alguém'}`,
        description: 'Agora você verá as atividades desta pessoa no seu feed',
        category: 'Social'
      };
      break;
  }

  return {
    id: feedItem.id,
    user: {
      name: authorName,
      username: authorUsername || `@${authorName.toLowerCase().replace(/\s+/g, '')}`,
      avatar: authorAvatar || 'https://i.pravatar.cc/100?u=' + feedItem.authorId
    },
    type: activityType,
    timestamp,
    content,
    interactions: {
      likes: 0, // TODO: Implementar quando backend fornecer dados de interação
      comments: 0,
      hasLiked: false
    }
  };
};

/**
 * Formatar tempo relativo (ex: "2h", "1d", "3sem")
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    // Handle different input formats
    if (!dateString || typeof dateString !== 'string') {
      console.warn('Invalid date string provided to formatRelativeTime:', dateString);
      return 'agora';
    }

    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date created from:', dateString);
      return 'agora';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // If date is in the future, show "agora"
    if (diffMs < 0) {
      return 'agora';
    }
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    
    if (diffMinutes < 1) {
      return 'agora';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}min`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return `${diffWeeks}sem`;
    }
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Input:', dateString);
    return 'agora';
  }
};

/**
 * Obter ícone baseado no tipo de atividade
 */
export const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'place_added':
      return '📍';
    case 'place_visited':
      return '✅';
    case 'place_reviewed':
      return '⭐';
    case 'list_created':
      return '📋';
    case 'list_purchased':
      return '💰';
    case 'user_followed':
      return '👥';
    default:
      return '📍';
  }
};

/**
 * Obter cor do badge baseado no tipo de atividade
 */
export const getActivityBadgeColor = (type: string): { bg: string; text: string } => {
  switch (type) {
    case 'place_added':
      return { bg: 'bg-blue-100', text: 'text-blue-600' };
    case 'place_visited':
      return { bg: 'bg-green-100', text: 'text-green-600' };
    case 'place_reviewed':
      return { bg: 'bg-yellow-100', text: 'text-yellow-600' };
    case 'list_created':
      return { bg: 'bg-purple-100', text: 'text-purple-600' };
    case 'list_purchased':
      return { bg: 'bg-orange-100', text: 'text-orange-600' };
    case 'user_followed':
      return { bg: 'bg-pink-100', text: 'text-pink-600' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600' };
  }
};

/**
 * Obter texto da ação baseado no tipo
 */
export const getActivityActionText = (type: string): string => {
  switch (type) {
    case 'place_added':
      return 'adicionou um lugar';
    case 'place_visited':
      return 'visitou um lugar';
    case 'place_reviewed':
      return 'avaliou um lugar';
    case 'list_created':
      return 'criou uma lista';
    case 'list_purchased':
      return 'comprou uma lista';
    case 'user_followed':
      return 'seguiu alguém';
    default:
      return 'fez uma atividade';
  }
};
