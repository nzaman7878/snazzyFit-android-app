export interface Review {
  _id: string;
  userId: string;
  productId: string;
  userName: string;
  rating: number; // 1 to 5
  reviewText: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}
