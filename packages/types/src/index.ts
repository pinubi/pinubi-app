// Core types that can be shared across applications

export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface CheckIn {
  id: string;
  userId: string;
  location: Location;
  timestamp: Date;
  description?: string;
  images?: string[];
}

// Add more shared types as needed
export * from './api-types';
export * from './services';
export * from './ui-types';

