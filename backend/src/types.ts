export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Concert {
  id: number;
  artist: string;
  venue: string;
  city: string;
  date: string;
  poster?: string;
  created_at: string;
}

export interface Review {
  id: number;
  user_id: number;
  concert_id: number;
  sound_score: number;
  stage_score: number;
  atmosphere_score: number;
  value_score: number;
  overall_score: number;
  content: string;
  images: string;
  videos: string;
  status: 'pending' | 'approved' | 'rejected';
  parent_id?: number;
  created_at: string;
}

export interface Like {
  id: number;
  user_id: number;
  review_id: number;
  created_at: string;
}

export interface Favorite {
  id: number;
  user_id: number;
  review_id: number;
  created_at: string;
}

export interface Report {
  id: number;
  user_id: number;
  review_id: number;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface ReviewWithDetails extends Review {
  username: string;
  user_avatar?: string;
  artist: string;
  venue: string;
  concert_date: string;
  likes_count: number;
  favorites_count: number;
  is_liked: number;
  is_favorited: number;
}

export interface ConcertWithStats extends Concert {
  review_count: number;
  avg_overall: number;
  avg_sound: number;
  avg_stage: number;
  avg_atmosphere: number;
  avg_value: number;
  weekly_reviews: number;
}
