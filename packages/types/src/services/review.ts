export interface Reviews {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  rating: number;
  reviewType: string;
  comment?: string;
  wouldReturn: boolean;
  isVisited: boolean;
  photos: string[];
  tags: string[];
  visitDate: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
