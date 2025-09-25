import type { PhotoData, RawPhoto } from '@pinubi/types';
import { convertPhotosToPhotoData } from '../components/checkin/PhotoUploadSection';

/**
 * Utility function to process photos when finalizing a checkin/review
 * Call this function when the user clicks "Finalizar"
 */
export const processPhotosForSubmission = async (
  rawPhotos: RawPhoto[],
  onProgress?: (current: number, total: number) => void
): Promise<PhotoData[]> => {
  try {
    if (rawPhotos.length === 0) {
      return [];
    }

    // Optional: Show progress to user
    if (onProgress) {
      onProgress(0, rawPhotos.length);
    }

    // Convert all raw photos to PhotoData format
    const processedPhotos = await convertPhotosToPhotoData(rawPhotos);

    // Optional: Show completion
    if (onProgress) {
      onProgress(rawPhotos.length, rawPhotos.length);
    }

    return processedPhotos;
  } catch (error) {
    console.error('Error processing photos for submission:', error);
    throw new Error('Não foi possível processar as fotos. Tente novamente.');
  }
};

/**
 * Example usage in a checkin/review submission function
 */
export const submitCheckinWithPhotos = async (
  checkinData: any,
  rawPhotos: RawPhoto[],
  onProgress?: (current: number, total: number) => void
) => {
  try {
    // Process photos only when submitting
    const processedPhotos = await processPhotosForSubmission(rawPhotos, onProgress);
    
    // Include processed photos in the submission data
    const submissionData = {
      ...checkinData,
      photos: processedPhotos
    };

    // Submit to your API/Firebase
    // await submitToAPI(submissionData);
    
    return submissionData;
  } catch (error) {
    console.error('Error submitting checkin:', error);
    throw error;
  }
};
