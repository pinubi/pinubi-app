import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { reviewService } from '@/services/reviewService';
import type { UserReviewsStatistics } from '@/types/reviews';

interface UserReviewsStatsProps {
  statistics: UserReviewsStatistics;
}

export const UserReviewsStats: React.FC<UserReviewsStatsProps> = ({ statistics }) => {
  const getDistributionPercentage = (count: number) => {
    return statistics.totalReviews > 0 ? (count / statistics.totalReviews) * 100 : 0;
  };

  const getRatingDistributionColor = (type: 'excellent' | 'good' | 'average' | 'poor') => {
    const colorMap = {
      excellent: 'bg-green-500',
      good: 'bg-yellow-500',
      average: 'bg-orange-500',
      poor: 'bg-red-500',
    };
    return colorMap[type];
  };

  const getRatingDistributionLabel = (type: 'excellent' | 'good' | 'average' | 'poor') => {
    const labelMap = {
      excellent: 'Excelente (8-10)',
      good: 'Bom (6-7.9)',
      average: 'Regular (4-5.9)',
      poor: 'Ruim (0-3.9)',
    };
    return labelMap[type];
  };

  const renderStatCard = (
    title: string,
    value: string | number,
    subtitle?: string,
    icon?: keyof typeof Ionicons.glyphMap,
    color: 'primary' | 'green' | 'blue' | 'orange' | 'purple' = 'primary'
  ) => {
    const colorClasses = {
      primary: 'bg-primary-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500',
    };

    return (
      <View className='bg-white rounded-3xl p-4 flex-1 shadow-sm border border-gray-100'>
        <View className='flex-row items-center justify-between mb-2'>
          <Text className='text-gray-600 text-sm font-medium'>{title}</Text>
          {icon && (
            <View className={`p-2 rounded-2xl ${colorClasses[color]}`}>
              <Ionicons name={icon} size={20} color='white' />
            </View>
          )}
        </View>
        <Text className='text-2xl font-bold text-gray-900 mb-1'>{value}</Text>
        {subtitle && <Text className='text-gray-500 text-sm'>{subtitle}</Text>}
      </View>
    );
  };

  const renderReviewTypeStats = () => {
    const types = Object.entries(statistics.reviewCountByType).filter(([_, count]) => count > 0);

    if (types.length === 0) return null;

    return (
      <View className='mb-6'>
        <Text className='text-xl font-bold text-gray-900 mb-4 px-4'>Por Categoria</Text>
        <View className='px-4 space-y-3'>
          {types.map(([type, count]) => {
            const average = statistics.averagesByType[type as keyof typeof statistics.averagesByType] || 0;
            const percentage = (count / statistics.totalReviews) * 100;

            return (
              <View key={type} className='bg-white rounded-2xl p-4 shadow-sm border border-gray-100'>
                <View className='flex-row items-center justify-between mb-2'>
                  <Text className='text-gray-900 font-semibold'>
                    {reviewService.getReviewTypeDisplayName(type)}
                  </Text>
                  <View className='bg-primary-50 px-3 py-1 rounded-full'>
                    <Text className='text-primary-600 font-semibold text-sm'>
                      {reviewService.formatRating(average)}
                    </Text>
                  </View>
                </View>

                <View className='flex-row items-center justify-between mb-2'>
                  <Text className='text-gray-600 text-sm'>
                    {count} {count === 1 ? 'avaliação' : 'avaliações'} ({percentage.toFixed(1)}%)
                  </Text>
                </View>

                {/* Progress bar */}
                <View className='h-2 bg-gray-100 rounded-full overflow-hidden'>
                  <View
                    className='h-full bg-primary-500 rounded-full'
                    style={{ width: `${percentage}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDistributionChart = () => {
    const { excellent, good, average, poor } = statistics.distribution.byRating;
    const total = excellent + good + average + poor;

    if (total === 0) return null;

    const distributions = [
      { type: 'excellent' as const, count: excellent },
      { type: 'good' as const, count: good },
      { type: 'average' as const, count: average },
      { type: 'poor' as const, count: poor },
    ].filter(item => item.count > 0);

    return (
      <View className='mb-6'>
        <Text className='text-xl font-bold text-gray-900 mb-4 px-4'>Distribuição de Notas</Text>
        <View className='px-4'>
          <View className='bg-white rounded-3xl p-4 shadow-sm border border-gray-100'>
            {/* Horizontal bar chart */}
            <View className='h-6 bg-gray-100 rounded-full flex-row overflow-hidden mb-4'>
              {distributions.map(({ type, count }) => {
                const percentage = getDistributionPercentage(count);
                if (percentage === 0) return null;

                return (
                  <View
                    key={type}
                    className={getRatingDistributionColor(type)}
                    style={{ width: `${percentage}%` }}
                  />
                );
              })}
            </View>

            {/* Legend */}
            <View className='space-y-2'>
              {distributions.map(({ type, count }) => {
                const percentage = getDistributionPercentage(count);

                return (
                  <View key={type} className='flex-row items-center justify-between'>
                    <View className='flex-row items-center flex-1'>
                      <View className={`w-3 h-3 rounded-full mr-3 ${getRatingDistributionColor(type)}`} />
                      <Text className='text-gray-700 text-sm'>
                        {getRatingDistributionLabel(type)}
                      </Text>
                    </View>
                    <Text className='text-gray-900 font-semibold text-sm'>
                      {count} ({percentage.toFixed(1)}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
      {/* Main Stats Grid */}
      <View className='px-4 py-6'>
        <Text className='text-xl font-bold text-gray-900 mb-4'>Visão Geral</Text>
        <View className='flex-row space-x-3 mb-3'>
          {renderStatCard(
            'Total de Avaliações',
            statistics.totalReviews,
            'Todas as categorias',
            'star-outline',
            'primary'
          )}
          {renderStatCard(
            'Média Geral',
            reviewService.formatRating(statistics.averageRating),
            'De 0 a 10',
            'analytics-outline',
            'green'
          )}
        </View>

        <View className='flex-row space-x-3 mb-3'>
          {renderStatCard(
            'Lugares Visitados',
            statistics.placesVisited,
            'Locais únicos',
            'location-outline',
            'blue'
          )}
          {renderStatCard(
            'Últimos 30 dias',
            statistics.recentActivity.last30Days,
            `Média: ${reviewService.formatRating(statistics.recentActivity.averageRatingLast30Days)}`,
            'time-outline',
            'orange'
          )}
        </View>
      </View>

      {/* Review Types Breakdown */}
      {renderReviewTypeStats()}

      {/* Rating Distribution */}
      {renderDistributionChart()}

      {/* Recent Activity */}
      <View className='px-4 mb-6'>
        <Text className='text-xl font-bold text-gray-900 mb-4'>Atividade Recente</Text>
        <View className='bg-white rounded-3xl p-4 shadow-sm border border-gray-100'>
          <View className='flex-row items-center justify-between mb-3'>
            <View className='flex-row items-center'>
              <Ionicons name='trending-up-outline' size={24} color='#10b981' />
              <Text className='text-gray-900 font-semibold ml-3'>Últimos 30 dias</Text>
            </View>
            <Text className='text-2xl font-bold text-gray-900'>
              {statistics.recentActivity.last30Days}
            </Text>
          </View>

          <Text className='text-gray-600 mb-2'>
            Você fez {statistics.recentActivity.last30Days} 
            {statistics.recentActivity.last30Days === 1 ? ' avaliação' : ' avaliações'} no último mês
          </Text>

          <View className='flex-row items-center'>
            <Text className='text-gray-600'>Média do período: </Text>
            <Text className='text-gray-900 font-semibold'>
              {reviewService.formatRating(statistics.recentActivity.averageRatingLast30Days)}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom spacing */}
      <View className='h-20' />
    </ScrollView>
  );
};
