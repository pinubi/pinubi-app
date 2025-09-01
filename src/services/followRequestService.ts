/**
 * 🚀 PINUBI FOLLOW REQUEST SERVICE - FIREBASE CLOUD FUNCTIONS INTEGRATION
 * 
 * This service provides integration with Firebase Cloud Functions for follow request operations:
 * 
 * ✅ IMPLEMENTED FUNCTIONS:
 * - getFollowRequests() - List pending follow requests received by current user
 * - acceptFollowRequest(requestId) - Accept a follow request
 * - rejectFollowRequest(requestId) - Reject a follow request
 * 
 * 🔧 FEATURES:
 * - Pure Firebase Cloud Functions integration
 * - Enhanced error handling with Portuguese messages
 * - Automatic data transformation from Firebase format to app format
 * - Detailed logging for debugging
 * 
 * 📋 USAGE:
 * import { followRequestService } from '@/services/followRequestService';
 * 
 * // Get follow requests
 * const result = await followRequestService.getFollowRequests();
 * 
 * // Accept request
 * await followRequestService.acceptFollowRequest('request123');
 * 
 * // Reject request
 * await followRequestService.rejectFollowRequest('request123');
 */

import { functions } from '@/config/firebase';
import type { FollowRequest } from '@/types/users';
import { httpsCallable } from 'firebase/functions';

interface FirebaseFollowRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterUsername: string;
  requesterPhotoURL?: string;
  requestedAt: any; // Firebase Timestamp
  message?: string;
}

interface GetFollowRequestsResponse {
  requests: FirebaseFollowRequest[];
  hasMore: boolean;
  lastDoc?: any;
}

interface AcceptFollowRequestResponse {
  success: boolean;
  message?: string;
}

interface RejectFollowRequestResponse {
  success: boolean;
  message?: string;
}

class FollowRequestService {
  /**
   * Get follow requests received by the current user
   */
  async getFollowRequests(limit = 20, startAfter: any = null): Promise<{
    success: boolean;
    requests: FollowRequest[];
    hasMore: boolean;
    lastDoc?: any;
    error?: string;
  }> {
    try {
      console.log('📨 Fetching follow requests with limit:', limit);
      
      const getFollowRequests = httpsCallable(functions, 'getFollowRequests');
      const response = await getFollowRequests({
        limit,
        startAfter: startAfter || null
      });
      
      const responseData = response.data as GetFollowRequestsResponse;
      
      // Transform Firebase format to our FollowRequest format
      const transformedRequests: FollowRequest[] = responseData.requests.map((req) => ({
        id: req.id,
        fromUserId: req.requesterId,
        toUserId: '', // Will be filled by the current user
        fromUser: {
          id: req.requesterId,
          displayName: req.requesterName,
          username: req.requesterUsername,
          photoURL: req.requesterPhotoURL,
          accountType: 'free' as const,
          listsCount: 0,
          placesCount: 0,
          followersCount: 0,
          followingCount: 0,
          isFollowing: false,
          hasFollowRequest: false,
          isFollowedBy: false,
          joinedAt: new Date().toISOString()
        },
        toUser: {
          id: '',
          displayName: '',
          username: '',
          accountType: 'free' as const,
          listsCount: 0,
          placesCount: 0,
          followersCount: 0,
          followingCount: 0,
          isFollowing: false,
          hasFollowRequest: false,
          isFollowedBy: false,
          joinedAt: new Date().toISOString()
        },
        status: 'pending' as const,
        createdAt: req.requestedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        message: req.message
      }));

      console.log(`✅ Successfully fetched ${transformedRequests.length} follow requests`);
      
      return {
        success: true,
        requests: transformedRequests,
        hasMore: responseData.hasMore,
        lastDoc: responseData.lastDoc
      };
    } catch (error: any) {
      console.error('💥 Exception in getFollowRequests:', error);
      
      let errorMessage = 'Erro ao carregar solicitações de seguir';
      
      if (error?.code === 'functions/not-found') {
        errorMessage = 'Função não encontrada. Verifique se as Cloud Functions estão implantadas.';
        console.error('🚨 CLOUD FUNCTION NOT FOUND: getFollowRequests');
      } else if (error?.code === 'functions/permission-denied') {
        errorMessage = 'Acesso negado. Faça login novamente.';
      } else if (error?.code === 'functions/unauthenticated') {
        errorMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        requests: [],
        hasMore: false,
        error: errorMessage
      };
    }
  }

  /**
   * Accept a follow request
   */
  async acceptFollowRequest(requestId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      console.log('✅ Accepting follow request:', requestId);
      
      const acceptFollowRequest = httpsCallable(functions, 'acceptFollowRequest');
      const response = await acceptFollowRequest({ requestId });
      const responseData = response.data as AcceptFollowRequestResponse;

      if (responseData.success) {
        console.log('✅ Successfully accepted follow request');
        return {
          success: true,
          message: responseData.message || 'Solicitação aceita com sucesso!'
        };
      } else {
        return {
          success: false,
          error: 'Erro desconhecido ao aceitar solicitação'
        };
      }
    } catch (error: any) {
      console.error('💥 Exception in acceptFollowRequest:', error);
      
      let errorMessage = 'Erro ao aceitar solicitação de seguir';
      
      if (error?.code === 'functions/not-found') {
        errorMessage = 'Função não encontrada. Verifique se as Cloud Functions estão implantadas.';
        console.error('🚨 CLOUD FUNCTION NOT FOUND: acceptFollowRequest');
      } else if (error?.code === 'functions/permission-denied') {
        errorMessage = 'Acesso negado. Faça login novamente.';
      } else if (error?.code === 'functions/unauthenticated') {
        errorMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Reject a follow request
   */
  async rejectFollowRequest(requestId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      console.log('❌ Rejecting follow request:', requestId);
      
      const rejectFollowRequest = httpsCallable(functions, 'rejectFollowRequest');
      const response = await rejectFollowRequest({ requestId });
      const responseData = response.data as RejectFollowRequestResponse;

      if (responseData.success) {
        console.log('✅ Successfully rejected follow request');
        return {
          success: true,
          message: responseData.message || 'Solicitação rejeitada'
        };
      } else {
        return {
          success: false,
          error: 'Erro desconhecido ao rejeitar solicitação'
        };
      }
    } catch (error: any) {
      console.error('💥 Exception in rejectFollowRequest:', error);
      
      let errorMessage = 'Erro ao rejeitar solicitação de seguir';
      
      if (error?.code === 'functions/not-found') {
        errorMessage = 'Função não encontrada. Verifique se as Cloud Functions estão implantadas.';
        console.error('🚨 CLOUD FUNCTION NOT FOUND: rejectFollowRequest');
      } else if (error?.code === 'functions/permission-denied') {
        errorMessage = 'Acesso negado. Faça login novamente.';
      } else if (error?.code === 'functions/unauthenticated') {
        errorMessage = 'Usuário não autenticado. Faça login novamente.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export const followRequestService = new FollowRequestService();
