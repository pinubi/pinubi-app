import { ReviewType } from './reviews';

export interface CheckIn {
  id: string;
  userId: string;
  placeId: string;
  
  // Check-in details
  visitDate: string; // ISO string
  rating: number; // 0-10 with decimals (e.g., 7.2)
  reviewType: ReviewType; // What type of review this is
  description?: string;
  wouldReturn: boolean;
  
  // Media
  photos: CheckInPhoto[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface CheckInPhoto {
  id: string;
  url: string;
  thumbnail?: string;
  order: number;
}

export interface CheckInFormData {
  visitDate: Date;
  rating: number;
  reviewType: ReviewType;
  description: string;
  wouldReturn: boolean | null;
  photos: string[];
}

export interface CheckInStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface CheckInState {
  currentStep: number;
  totalSteps: number;
  formData: Partial<CheckInFormData>;
  isValid: boolean;
}
