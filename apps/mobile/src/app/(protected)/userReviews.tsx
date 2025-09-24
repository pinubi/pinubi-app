import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { UserReviewCard, UserReviewsFilters, UserReviewsStats } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { reviewService } from '@/services/reviewService';
import type {
  GetUserReviewsRequest,
  GroupedByCategory,
  GroupedByPlace,
  ReviewType,
  ReviewWithPlace,
  UserReviewsStatistics,
} from '@/types/reviews';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Filters {
  reviewType?: ReviewType;
  minRating?: number;
  maxRating?: number;
  startDate?: string;
  endDate?: string;
  groupBy?: 'place' | 'category';
}

export default function UserReviews() {
  const [reviews, setReviews] = useState<ReviewWithPlace[]>([]);
  const [statistics, setStatistics] = useState<UserReviewsStatistics | null>(null);
  const [groupedData, setGroupedData] = useState<GroupedByPlace[] | GroupedByCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'stats' | 'grouped'>('list');
  const params = useLocalSearchParams();

  const shouldReopenBottomSheet = params.onBack === 'reopenProfileBottomSheet';

  // Always call hooks in the same order
  const { user } = useAuth();

  const limit = 20;

  const handleGoBack = useCallback(async () => {
    try {
      if (router.canGoBack()) {
        if (shouldReopenBottomSheet) {
          try {
            await AsyncStorage.setItem('shouldReopenProfileBottomSheet', 'true');
          } catch (error) {
            console.error('Error setting reopen flag:', error);
          }
        }

        router.back();
      } else {
        router.replace('/(protected)/(tabs)/discover');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      router.replace('/(protected)/(tabs)/discover');
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadReviews(true);
    }
  }, [user?.id, filters]);

  const loadReviews = useCallback(
    async (reset = false) => {
      if (!user?.id) return;

      if (reset) {
        setLoading(true);
        setOffset(0);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const params: GetUserReviewsRequest = {
          userId: user.id,
          limit,
          offset: reset ? 0 : offset,
          includePlaceData: true,
          includeStats: true,
          ...filters,
        };

        console.log('🔍 getUserReviews - Making request with params:', params);
        const response = await reviewService.getUserReviews(params);
        console.log('📥 getUserReviews - Received response:', response);

        if (response.success) {
          const newReviews = response.data?.reviews || [];
          const newStatistics = response.data?.statistics || null;
          const newGroupedData = response.data?.groupedData || null;

          console.log('✅ getUserReviews - Success data:', {
            reviewsCount: newReviews.length,
            statisticsExists: !!newStatistics,
            groupedDataExists: !!newGroupedData,
            hasMore: response.data?.pagination?.hasMore,
          });

          if (reset) {
            setReviews(newReviews);
            setStatistics(newStatistics);
            setGroupedData(newGroupedData);
          } else {
            setReviews((prev) => [...prev, ...newReviews]);
          }

          setHasMore(response.data?.pagination?.hasMore || false);
          setOffset((prev) => (reset ? limit : prev + limit));
        } else {
          console.error('❌ getUserReviews - Error response:', response.error);
          setError(response.error || 'Erro ao carregar avaliações');
        }
      } catch (err: any) {
        console.error('💥 getUserReviews - Exception:', err);
        setError(err.message || 'Erro ao carregar avaliações');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [user?.id, filters, offset]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadReviews(true);
  }, [loadReviews]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && viewMode === 'list') {
      loadReviews(false);
    }
  }, [loadingMore, hasMore, loadReviews, viewMode]);

  const handleApplyFilters = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setShowFilters(false);
  }, []);

  const handleViewModeChange = useCallback((mode: 'list' | 'stats' | 'grouped') => {
    setViewMode(mode);
  }, []);

  const handleEditReview = useCallback((reviewId: string) => {
    // TODO: Navigate to edit review screen
    Alert.alert('Editar Avaliação', 'Funcionalidade em desenvolvimento.', [{ text: 'OK' }]);
  }, []);

  const handleDeleteReview = useCallback(
    async (reviewId: string) => {
      Alert.alert(
        'Deletar Avaliação',
        'Tem certeza que deseja deletar esta avaliação? Esta ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Deletar',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                const response = await reviewService.deleteReview(reviewId);

                if (response.success) {
                  Alert.alert('Sucesso', 'Avaliação deletada com sucesso.', [{ text: 'OK' }]);
                  loadReviews(true);
                } else {
                  Alert.alert('Erro', response.error || 'Erro ao deletar avaliação.', [{ text: 'OK' }]);
                }
              } catch (error: any) {
                Alert.alert('Erro', error.message || 'Erro ao deletar avaliação.', [{ text: 'OK' }]);
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    },
    [loadReviews]
  );

  const renderReviewItem = ({ item }: { item: ReviewWithPlace }) => (
    <UserReviewCard
      review={item}
      onEdit={() => handleEditReview(item.id)}
      onDelete={() => handleDeleteReview(item.id)}
    />
  );

  const renderGroupedItem = ({ item }: { item: GroupedByPlace | GroupedByCategory }) => {
    const isPlaceGroup = 'placeId' in item;

    return (
      <View className='bg-white rounded-3xl p-4 mb-3 mx-4 shadow-sm border border-gray-100'>
        <View className='flex-row items-center justify-between mb-3'>
          <View className='flex-1'>
            <Text className='text-lg font-bold text-gray-900 mb-1'>
              {isPlaceGroup
                ? (item as GroupedByPlace).place?.name || 'Local sem nome'
                : reviewService.getReviewTypeDisplayName((item as GroupedByCategory).category)}
            </Text>
            <Text className='text-gray-600 text-sm'>
              {item.reviewsCount} {item.reviewsCount === 1 ? 'avaliação' : 'avaliações'} • Média:{' '}
              {reviewService.formatRating(item.averageRating)}
            </Text>
          </View>
          <View className='bg-primary-50 px-3 py-1 rounded-full'>
            <Text className='text-primary-600 font-semibold'>{reviewService.formatRating(item.averageRating)}</Text>
          </View>
        </View>

        <View className='space-y-2'>
          {item.reviews.slice(0, 2).map((review) => (
            <UserReviewCard
              key={review.id}
              review={review}
              compact
              onEdit={() => handleEditReview(review.id)}
              onDelete={() => handleDeleteReview(review.id)}
            />
          ))}
        </View>

        {item.reviews.length > 2 && (
          <TouchableOpacity className='mt-3 py-2 border-t border-gray-100'>
            <Text className='text-primary-500 text-center font-medium'>
              Ver todas as {item.reviews.length} avaliações
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View className='bg-white'>
      {/* Stats Overview */}
      {statistics && (
        <View className='px-4 pt-4 pb-2'>
          <View className='flex-row justify-between mb-4'>
            <View className='flex-1 items-center'>
              <Text className='text-2xl font-bold text-gray-900'>{statistics.totalReviews}</Text>
              <Text className='text-gray-600 text-sm'>Avaliações</Text>
            </View>
            <View className='flex-1 items-center'>
              <Text className='text-2xl font-bold text-gray-900'>
                {reviewService.formatRating(statistics.averageRating)}
              </Text>
              <Text className='text-gray-600 text-sm'>Média Geral</Text>
            </View>
            <View className='flex-1 items-center'>
              <Text className='text-2xl font-bold text-gray-900'>{statistics.placesVisited}</Text>
              <Text className='text-gray-600 text-sm'>Lugares</Text>
            </View>
          </View>
        </View>
      )}

      {/* View Mode Selector */}
      {/* <View className='px-4 pb-4'>
        <View className='flex-row bg-gray-100 rounded-2xl p-1'>
          <TouchableOpacity
            onPress={() => handleViewModeChange('list')}
            className={`flex-1 py-2 px-3 rounded-xl items-center ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-medium ${viewMode === 'list' ? 'text-gray-900' : 'text-gray-600'}`}>Lista</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleViewModeChange('stats')}
            className={`flex-1 py-2 px-3 rounded-xl items-center ${viewMode === 'stats' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-medium ${viewMode === 'stats' ? 'text-gray-900' : 'text-gray-600'}`}>
              Estatísticas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleViewModeChange('grouped')}
            className={`flex-1 py-2 px-3 rounded-xl items-center ${viewMode === 'grouped' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-medium ${viewMode === 'grouped' ? 'text-gray-900' : 'text-gray-600'}`}>
              Agrupado
            </Text>
          </TouchableOpacity>
        </View>
      </View> */}

      {/* Filters Bar */}
      <View className='px-4 pb-4 flex-row items-center justify-between'>
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          className='flex-row items-center bg-gray-50 px-4 py-2 rounded-xl'
        >
          <Ionicons name='filter-outline' size={20} color='#6b7280' />
          <Text className='text-gray-700 ml-2'>Filtros</Text>
          {Object.keys(filters).length > 0 && <View className='bg-primary-500 w-2 h-2 rounded-full ml-1' />}
        </TouchableOpacity>

        {Object.keys(filters).length > 0 && (
          <TouchableOpacity onPress={handleClearFilters} className='px-3 py-2'>
            <Text className='text-primary-500 font-medium'>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size='large' color='#9333ea' />
          <Text className='text-gray-600 mt-4'>Carregando suas avaliações...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className='flex-1 justify-center items-center px-4'>
          <Ionicons name='alert-circle-outline' size={48} color='#ef4444' />
          <Text className='text-gray-900 font-semibold text-lg mt-4 text-center'>Erro ao carregar</Text>
          <Text className='text-gray-600 text-center mt-2 mb-6'>{error}</Text>
          <TouchableOpacity onPress={() => loadReviews(true)} className='bg-primary-500 px-6 py-3 rounded-xl'>
            <Text className='text-white font-semibold'>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (viewMode === 'stats' && statistics) {
      return (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
          <UserReviewsStats statistics={statistics} />
        </ScrollView>
      );
    }

    if (viewMode === 'grouped' && groupedData) {
      return (
        <FlatList
          data={groupedData}
          renderItem={renderGroupedItem}
          keyExtractor={(item) => ('placeId' in item ? item.placeId : (item as GroupedByCategory).category)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      );
    }

    if (reviews.length === 0) {
      return (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <Ionicons name='star-outline' size={64} color='#d1d5db' />
          <Text className='text-gray-900 font-semibold text-xl mt-4 text-center'>Nenhuma avaliação encontrada</Text>
          <Text className='text-gray-600 text-center mt-2'>
            {Object.keys(filters).length > 0
              ? 'Tente ajustar seus filtros ou fazer seu primeiro check-in!'
              : 'Comece fazendo check-ins nos lugares que visitar!'}
          </Text>
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListFooterComponent={() =>
          loadingMore ? (
            <View className='py-4 items-center'>
              <ActivityIndicator size='small' color='#9333ea' />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    );
  };

  return (
    <View className='flex-1 bg-gray-50'>
      {/* Header */}
      <View className='bg-white pt-16 pb-4 border-b border-gray-100'>
        <View className='flex-row items-center px-4'>
          <TouchableOpacity onPress={handleGoBack} className='mr-4'>
            <Ionicons name='arrow-back' size={24} color='#1f2937' />
          </TouchableOpacity>
          <View className='flex-1'>
            <Text className='text-gray-900 font-bold text-xl'>Suas Avaliações</Text>
            <Text className='text-gray-600 text-sm'>Seus check-ins e avaliações</Text>
          </View>
        </View>
      </View>

      {/* Show loading if no user yet */}
      {!user ? (
        <View className='flex-1 justify-center items-center'>
          <ActivityIndicator size='large' color='#9333ea' />
          <Text className='text-gray-600 mt-2'>Carregando...</Text>
        </View>
      ) : (
        <>
          {/* Content */}
          {renderHeader()}
          {renderContent()}

          {/* Filters Modal */}
          {showFilters && (
            <UserReviewsFilters
              isVisible={showFilters}
              currentFilters={filters}
              onApply={handleApplyFilters}
              onClose={() => setShowFilters(false)}
            />
          )}
        </>
      )}
    </View>
  );
}
