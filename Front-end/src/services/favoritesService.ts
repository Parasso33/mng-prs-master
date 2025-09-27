import axios from 'axios';
import { authService } from './authService';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface FavoriteItem {
  _id?: string;
  userId?: string;
  mangaId: string;
  mangaTitle: string;
  mangaCover: string;
  addedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FavoritesResponse {
  favorites: FavoriteItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// localStorage keys
const GLOBAL_FAV_KEY = 'mp_favorites';
const getUserFavKey = (): string => {
  const user = authService.getStoredUser();
  return user?.email ? `mp_favs_${user.email}` : GLOBAL_FAV_KEY;
};

class FavoritesService {
  // Get favorites from localStorage
  private getFavoritesFromStorage(): string[] {
    try {
      const raw = localStorage.getItem(getUserFavKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Save favorites to localStorage
  private saveFavoritesToStorage(favoriteIds: string[]): void {
    try {
      localStorage.setItem(getUserFavKey(), JSON.stringify(favoriteIds));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('mp:favs:changed'));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }

  // Add favorite (both localStorage and backend if authenticated)
  async addFavorite(favoriteData: Omit<FavoriteItem, '_id' | 'userId' | 'addedAt' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      // Always save to localStorage first
      const currentFavs = this.getFavoritesFromStorage();
      if (!currentFavs.includes(favoriteData.mangaId)) {
        currentFavs.push(favoriteData.mangaId);
        this.saveFavoritesToStorage(currentFavs);
      }

      // If user is authenticated, also save to backend
      if (authService.isAuthenticated()) {
        try {
          await api.post('/favorites', favoriteData);
        } catch (error) {
          console.warn('Failed to sync favorite to backend:', error);
          // Don't throw error - localStorage save was successful
        }
      }
    } catch (error: any) {
      throw new Error('Failed to add favorite');
    }
  }

  // Remove favorite (both localStorage and backend if authenticated)
  async removeFavorite(mangaId: string): Promise<void> {
    try {
      // Always remove from localStorage first
      const currentFavs = this.getFavoritesFromStorage();
      const updatedFavs = currentFavs.filter(id => id !== mangaId);
      this.saveFavoritesToStorage(updatedFavs);

      // If user is authenticated, also remove from backend
      if (authService.isAuthenticated()) {
        try {
          await api.delete(`/favorites/${mangaId}`);
        } catch (error) {
          console.warn('Failed to sync favorite removal to backend:', error);
          // Don't throw error - localStorage removal was successful
        }
      }
    } catch (error: any) {
      throw new Error('Failed to remove favorite');
    }
  }

  // Get user's favorites (from backend if authenticated, localStorage otherwise)
  async getFavorites(page: number = 1, limit: number = 20): Promise<FavoritesResponse> {
    try {
      if (authService.isAuthenticated()) {
        // Try to get from backend first
        try {
          const response = await api.get('/favorites', {
            params: { page, limit }
          });
          
          // Sync backend favorites to localStorage
          const favoriteIds = response.data.favorites.map((fav: FavoriteItem) => fav.mangaId);
          this.saveFavoritesToStorage(favoriteIds);
          
          return response.data;
        } catch (error) {
          console.warn('Failed to fetch favorites from backend, using localStorage:', error);
        }
      }

      // Fallback to localStorage
      const favoriteIds = this.getFavoritesFromStorage();
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedIds = favoriteIds.slice(startIndex, endIndex);

      // Convert IDs to FavoriteItem format (minimal data)
      const favorites: FavoriteItem[] = paginatedIds.map(id => ({
        mangaId: id,
        mangaTitle: 'Unknown', // Will be fetched from MangaDex API
        mangaCover: '',
        addedAt: new Date().toISOString()
      }));

      return {
        favorites,
        pagination: {
          page,
          limit,
          total: favoriteIds.length,
          pages: Math.ceil(favoriteIds.length / limit)
        }
      };
    } catch (error: any) {
      throw new Error('Failed to fetch favorites');
    }
  }

  // Get favorite IDs (for quick access)
  getFavoriteIds(): string[] {
    return this.getFavoritesFromStorage();
  }

  // Check if manga is favorited
  isFavorite(mangaId: string): boolean {
    return this.getFavoritesFromStorage().includes(mangaId);
  }

  // Clear all favorites
  async clearFavorites(): Promise<void> {
    try {
      // Clear localStorage
      this.saveFavoritesToStorage([]);

      // If user is authenticated, also clear backend
      if (authService.isAuthenticated()) {
        try {
          await api.delete('/favorites');
        } catch (error) {
          console.warn('Failed to clear favorites from backend:', error);
        }
      }
    } catch (error: any) {
      throw new Error('Failed to clear favorites');
    }
  }

  // Sync favorites from backend to localStorage (call after login)
  async syncFromBackend(): Promise<void> {
    if (!authService.isAuthenticated()) return;

    try {
      const response = await api.get('/favorites', { params: { limit: 1000 } });
      const favoriteIds = response.data.favorites.map((fav: FavoriteItem) => fav.mangaId);
      this.saveFavoritesToStorage(favoriteIds);
    } catch (error) {
      console.warn('Failed to sync favorites from backend:', error);
    }
  }

  // Sync favorites from localStorage to backend (call after login)
  async syncToBackend(): Promise<void> {
    if (!authService.isAuthenticated()) return;

    const localFavorites = this.getFavoritesFromStorage();
    
    for (const mangaId of localFavorites) {
      try {
        await api.post('/favorites', {
          mangaId,
          mangaTitle: 'Synced from localStorage',
          mangaCover: ''
        });
      } catch (error) {
        console.warn(`Failed to sync favorite ${mangaId} to backend:`, error);
      }
    }
  }
}

export const favoritesService = new FavoritesService();
