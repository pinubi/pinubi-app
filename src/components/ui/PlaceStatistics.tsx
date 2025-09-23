import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { reviewService } from '@/services/reviewService';
import { Review } from '@/types/reviews';

interface PlaceStatisticsData {
  reviews: Review[];
  statistics: {
    totalReviews: number;
    overallAverage: number;
    averagesByType: Record<string, number>;
    reviewCountByType: Record<string, number>;
  };
  pagination: {
    total: number;
    hasMore: boolean;
    limit: number;
    offset: number;
  };
}

interface PlaceStatisticsProps {
  placeId: string;
  onShowAllReviews?: () => void;
}

const PlaceStatistics: React.FC<PlaceStatisticsProps> = ({ placeId, onShowAllReviews }) => {
  const [data, setData] = useState<PlaceStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {    
    if (placeId && placeId.trim() !== '') {
      fetchPlaceStatistics();
    } else {
      console.warn('⚠️ Invalid placeId in PlaceStatistics:', placeId);
      setLoading(false);
      setError('ID do lugar inválido');
    }
  }, [placeId]);

  const fetchPlaceStatistics = async () => {
    if (!placeId) {
      console.warn('⚠️ No placeId provided for statistics');
      setLoading(false);
      setError('ID do lugar não fornecido');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await reviewService.getPlaceReviews({
        placeId,
        limit: 20,
      });

      if (response.success) {
        // Handle both possible response structures
        const responseData = (response as any).data || response;
        const reviews = Array.isArray(responseData.reviews) ? responseData.reviews : [];
        const responseStatistics = responseData.statistics || {};
        const responsePagination = responseData.pagination || {};
        
        // Use the statistics from the response if available, otherwise process reviews
        const statistics = responseStatistics.totalReviews > 0 
          ? responseStatistics 
          : processReviewsToStatistics(reviews);
        
        setData({
          reviews,
          statistics,
          pagination: {
            total: responsePagination.total || responseData.total || 0,
            hasMore: responsePagination.hasMore || responseData.hasMore || false,
            limit: 20,
            offset: 0,
          },
        });
      } else {
        setError(response.error || 'Erro ao carregar avaliações');
        console.error('❌ Failed to fetch reviews:', response.error);
      }
    } catch (err: any) {
      console.error('❌ Error fetching place statistics:', err);
      setError(err.message || 'Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  const processReviewsToStatistics = (reviews: Review[]) => {
    // Safety check for undefined or null reviews
    if (!reviews || !Array.isArray(reviews)) {
      return {
        totalReviews: 0,
        overallAverage: 0,
        averagesByType: {},
        reviewCountByType: {},
      };
    }

    const averagesByType: Record<string, number> = {};
    const reviewCountByType: Record<string, number> = {};
    const ratingsByType: Record<string, number[]> = {};

    // Group reviews by type and collect ratings
    reviews.forEach((review) => {
      const type = review.reviewType;
      
      if (!ratingsByType[type]) {
        ratingsByType[type] = [];
        reviewCountByType[type] = 0;
      }
      
      ratingsByType[type].push(review.rating);
      reviewCountByType[type]++;
    });

    // Calculate averages for each type
    Object.keys(ratingsByType).forEach((type) => {
      const ratings = ratingsByType[type];
      const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      averagesByType[type] = Math.round(average * 10) / 10; // Round to 1 decimal
    });

    // Calculate overall average
    const allRatings = reviews.map((review) => review.rating);
    const overallAverage = allRatings.length > 0 
      ? Math.round((allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length) * 10) / 10
      : 0;

    return {
      totalReviews: reviews.length,
      overallAverage,
      averagesByType,
      reviewCountByType,
    };
  };

  const getReviewTypeDisplayName = (type: string): string => {
    const displayNames: Record<string, string> = {
      food: 'Comida',
      drink: 'Bebida',
      dessert: 'Sobremesa',
      service: 'Atendimento',
      ambiance: 'Ambiente',
      overall: 'Geral',
    };
    return displayNames[type] || type;
  };

  const getReviewTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      food: 'restaurant-outline',
      drink: 'wine-outline',
      dessert: 'ice-cream-outline',
      service: 'people-outline',
      ambiance: 'home-outline',
      overall: 'star-outline',
    };
    return icons[type] || 'star-outline';
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 8) return '#10B981'; // green-500
    if (rating >= 6) return '#F59E0B'; // amber-500
    if (rating >= 4) return '#EF4444'; // red-500
    return '#6B7280'; // gray-500
  };

  const renderStatisticsHeader = () => (
    <View className="px-4 pb-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-xl font-bold text-gray-900">Avaliações da Comunidade</Text>
        {data && data.statistics.totalReviews > 0 && (
          <TouchableOpacity
            onPress={onShowAllReviews}
            className="px-3 py-1 bg-primary-50 rounded-full"
          >
            <Text className="text-primary-600 text-sm font-medium">Ver todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {data && data.statistics.totalReviews > 0 && (
        <View className="bg-gray-50 rounded-xl p-4">
          <View className="flex-row items-center justify-center mb-3">
            <Text className="text-3xl font-bold text-gray-900 mr-2">
              {data.statistics.overallAverage.toFixed(1)}
            </Text>
            <View>
              <View className="flex-row">
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name="star"
                    size={18}
                    color={i < Math.floor(data.statistics.overallAverage / 2) ? '#FBBF24' : '#E5E7EB'}
                  />
                ))}
              </View>
              <Text className="text-gray-600 text-sm mt-1">
                {data.statistics.totalReviews} {data.statistics.totalReviews !== 1 ? 'avaliações' : 'avaliação'}
              </Text>
            </View>
          </View>
          <Text className="text-center text-gray-600 text-sm">
            Média baseada em avaliações da comunidade
          </Text>
        </View>
      )}
    </View>
  );

  const renderCategoryBreakdown = () => {
    if (!data || Object.keys(data.statistics.averagesByType).length === 0) {
      return null;
    }

    return (
      <View className="px-4 pb-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">Por Categoria</Text>
        <View className="flex-col gap-2 space-y-3">
          {Object.entries(data.statistics.averagesByType).map(([type, average]) => {
            const count = data.statistics.reviewCountByType[type] || 0;
            const color = getRatingColor(average);
            
            return (
              <View key={type} className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3">
                    <Ionicons
                      name={getReviewTypeIcon(type) as any}
                      size={16}
                      color="#6B7280"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">
                      {getReviewTypeDisplayName(type)}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {count} avaliação{count !== 1 ? 'ões' : ''}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Text
                    className="text-lg font-bold mr-1"
                    style={{ color }}
                  >
                    {average.toFixed(1)}
                  </Text>
                  <Ionicons name="star" size={16} color={color} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderRecentReviews = () => {
    if (!data || data.reviews.length === 0) {
      return null;
    }

    // Show the 3 most recent reviews
    const recentReviews = data.reviews
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    return (
      <View className="px-4 pb-4">
        <Text className="text-lg font-bold text-gray-900 mb-3">Check-Ins Recentes</Text>
        <View className="flex-col gap-2 space-y-3">
          {recentReviews.map((review) => (
            <View key={review.id} className="bg-gray-50 rounded-lg p-3">
              {/* User Header */}
              <View className="flex-row items-center mb-3">
                <View className="flex-row items-center flex-1">
                  {/* User Profile Image */}
                  {(review as any).user?.profileImage ? (
                    <Image
                      source={{ uri: (review as any).user.profileImage }}
                      className="w-8 h-8 rounded-full mr-3"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-8 h-8 bg-gray-300 rounded-full items-center justify-center mr-3">
                      <Ionicons name="person" size={16} color="#6B7280" />
                    </View>
                  )}
                  
                  {/* User Name and Review Type */}
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">
                      {(review as any).user?.name || 'Usuário Anônimo'}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <View className="w-4 h-4 bg-primary-100 rounded-full items-center justify-center mr-1">
                        <Ionicons
                          name={getReviewTypeIcon(review.reviewType) as any}
                          size={10}
                          color="#9333EA"
                        />
                      </View>
                      <Text className="text-xs text-gray-600">
                        {getReviewTypeDisplayName(review.reviewType)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Rating */}
                <View className="flex-row items-center">
                  <Text
                    className="text-sm font-bold mr-1"
                    style={{ color: getRatingColor(review.rating) }}
                  >
                    {review.rating.toFixed(1)}
                  </Text>
                  <Ionicons
                    name="star"
                    size={12}
                    color={getRatingColor(review.rating)}
                  />
                </View>
              </View>
              
              {/* Comment */}
              {review.comment && (
                <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
                  {review.comment}
                </Text>
              )}
              
              {/* Footer */}
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                </Text>
                {review.wouldReturn && (
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text className="text-xs text-green-600 ml-1">Voltaria</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="px-4 pb-6">
        <Text className="text-xl font-bold text-gray-900 mb-4">Avaliações da Comunidade</Text>
        <View className="bg-gray-50 rounded-xl p-6 items-center">
          <Ionicons name="hourglass-outline" size={32} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2">Carregando avaliações...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="px-4 pb-6">
        <Text className="text-xl font-bold text-gray-900 mb-4">Avaliações da Comunidade</Text>
        <View className="bg-red-50 rounded-xl p-4">
          <Text className="text-red-600 text-center">{error}</Text>
        </View>
      </View>
    );
  }

  if (!data || data.statistics.totalReviews === 0) {
    return (
      <View className="px-4 pb-6">
        <Text className="text-xl font-bold text-gray-900 mb-4">Avaliações da Comunidade</Text>
        <View className="bg-gray-50 rounded-xl p-6 items-center">
          <Ionicons name="chatbubble-outline" size={32} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2 text-center">
            Ainda não há avaliações para este lugar.{'\n'}
            Seja o primeiro a avaliar!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      {renderStatisticsHeader()}
      {renderCategoryBreakdown()}
      {renderRecentReviews()}
    </View>
  );
};

export default PlaceStatistics;
