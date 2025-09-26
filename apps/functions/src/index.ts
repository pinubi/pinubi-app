export * from './functions/user';
import * as adminFunctions from './functions/admin-functions';
import * as feedFunctions from './functions/feed-functions';
import * as listFunctions from './functions/list-functions';
import * as notificationFunctions from './functions/notification-functions';
import * as placeFunctions from './functions/place-functions';
import * as reviewFunctions from './functions/review-functions';


export const {
  // Functions callable
  sendNotificationToUser,
  sendBulkNotification,
  updateFCMToken,

  // Scheduled functions
  cleanupOldNotifications,
  backupUserData,
  weeklyUserReport
} = notificationFunctions;

export const {
  getSystemStats,
  getAdminActions,
  forceLogout,
  cleanupTestData
} = adminFunctions;

export const {
  // Functions de lugares com geolocalização
  findNearbyPlaces,
  addPlaceWithLocation,
  updatePlaceLocation,
  getPlaceDetails,
  getPlacesInMapView,
  searchPlacesAdvanced,
  updateUserLocation,
  getUserLocation,
  processAndSaveGooglePlace
} = placeFunctions;

export const {
  // Review functions
  createReview,
  updateReview,
  deleteReview,
  getPlaceReviews,
  getUserReviews,
  toggleReviewLike,

  // Review triggers
  onReviewCreated,
  onReviewUpdated,
  onReviewDeleted,

  // Scheduled functions
  updateSocialMetrics
} = reviewFunctions;

export const {
  // List functions
  addPlaceToList,
  removePlaceFromList,
  getPublicListData,
  toggleListVisibility,
  // List triggers
  onListCreated,
  onPurchaseCreated,
  onListUpdated
} = listFunctions;

export const {
  // Feed functions
  getUserFeed,
  getDiscoveryFeed,
  refreshUserFeed,

  // Feed triggers
  onActivityCreated
} = feedFunctions;