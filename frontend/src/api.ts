import axios from 'axios';
import { User, ConcertWithStats, ReviewWithDetails, Report, ArtistStats } from './types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AuthResponse {
  token: string;
  user: User;
}

export const authAPI = {
  register: (username: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { username, email, password }),
  login: (username: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { username, password }),
  me: () => api.get<{ user: User }>('/auth/me')
};

export const concertAPI = {
  getList: (params?: { artist?: string; venue?: string; page?: number; limit?: number }) =>
    api.get<{ concerts: ConcertWithStats[]; total: number }>('/concerts', { params }),
  getHot: (limit?: number) =>
    api.get<{ concerts: ConcertWithStats[] }>('/concerts/hot', { params: { limit } }),
  getArtists: () => api.get<{ artists: string[] }>('/concerts/artists'),
  getVenues: () => api.get<{ venues: string[] }>('/concerts/venues'),
  getById: (id: number) => api.get<{ concert: ConcertWithStats }>(`/concerts/${id}`),
  create: (data: { artist: string; venue: string; city: string; date: string; poster?: string }) =>
    api.post<{ id: number }>('/concerts', data)
};

export const reviewAPI = {
  getList: (params?: { concert_id?: number; artist?: string; venue?: string; page?: number; limit?: number }) =>
    api.get<{ reviews: ReviewWithDetails[]; total: number }>('/reviews', { params }),
  getByConcert: (concertId: number, params?: { page?: number; limit?: number }) =>
    api.get<{ reviews: ReviewWithDetails[]; total: number }>(`/reviews/concert/${concertId}`, { params }),
  getByUser: (userId: number, params?: { page?: number; limit?: number }) =>
    api.get<{ reviews: ReviewWithDetails[]; total: number; likes_received: number; favorites_received: number }>(`/reviews/user/${userId}`, { params }),
  getById: (id: number) => api.get<{ review: ReviewWithDetails }>(`/reviews/${id}`),
  create: (data: {
    concert_id: number;
    sound_score: number;
    stage_score: number;
    atmosphere_score: number;
    value_score: number;
    content: string;
    images?: string[];
    videos?: string[];
  }) => api.post<{ id: number; overall_score: number }>('/reviews', data),
  update: (id: number, data: {
    sound_score: number;
    stage_score: number;
    atmosphere_score: number;
    value_score: number;
    content: string;
    images?: string[];
    videos?: string[];
  }) => api.put<{ id: number; overall_score: number; parent_id: number }>(`/reviews/${id}`, data),
  getPendingEdit: (id: number) =>
    api.get<{ pending_edit: ReviewWithDetails | null }>(`/reviews/${id}/edit-pending`),
  like: (id: number) => api.post<{ liked: boolean }>(`/reviews/${id}/like`),
  favorite: (id: number) => api.post<{ favorited: boolean }>(`/reviews/${id}/favorite`),
  report: (id: number, reason: string) => api.post<{ success: boolean }>(`/reviews/${id}/report`, { reason })
};

export const uploadAPI = {
  uploadImage: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post<{ files: { url: string; filename: string }[] }>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadVideo: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('videos', file));
    return api.post<{ files: { url: string; filename: string }[] }>('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const adminAPI = {
  getPendingReviews: (params?: { page?: number; limit?: number }) =>
    api.get<{ reviews: ReviewWithDetails[]; total: number }>('/admin/reviews/pending', { params }),
  approveReview: (id: number) => api.post<{ success: boolean }>(`/admin/reviews/${id}/approve`),
  rejectReview: (id: number) => api.post<{ success: boolean }>(`/admin/reviews/${id}/reject`),
  getReports: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<{ reports: Report[]; total: number }>('/admin/reports', { params }),
  resolveReport: (id: number, action?: string) =>
    api.post<{ success: boolean }>(`/admin/reports/${id}/resolve`, { action }),
  dismissReport: (id: number) => api.post<{ success: boolean }>(`/admin/reports/${id}/dismiss`),
  getArtistStats: () => api.get<{ stats: ArtistStats[] }>('/admin/stats/artists'),
  getOverviewStats: () =>
    api.get<{
      total_users: number;
      total_concerts: number;
      total_reviews: number;
      pending_reviews: number;
      pending_reports: number;
      recent_reviews: ReviewWithDetails[];
    }>('/admin/stats/overview')
};

export default api;
