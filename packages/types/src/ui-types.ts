// UI-related types

export type Theme = 'light' | 'dark' | 'auto';

export interface Dimensions {
  width: number;
  height: number;
}

export interface Color {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface NavigationState {
  index: number;
  routes: Array<{
    key: string;
    name: string;
    params?: object;
  }>;
}