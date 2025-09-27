import { authService } from './authService';
import type { HistoryItem } from '@/types/manga';

/**
 * User-specific storage service that manages favorites and history data
 * linked to the authenticated user's token
 */
class UserStorageService {
  private readonly FAVORITES_PREFIX = 'mp_user_favorites_';
  private readonly HISTORY_PREFIX = 'mp_user_history_';
  private readonly PROFILE_IMAGE_PREFIX = 'mp_user_profile_image_';

  /**
   * Get the current user's unique identifier for storage keys
   * Uses a combination of user ID and token hash for security
   */
  private getUserStorageKey(): string | null {
    const user = authService.getStoredUser();
    const token = authService.getToken();
    
    if (!user || !token) {
      return null;
    }

    // Create a simple hash of the token for additional security
    const tokenHash = this.simpleHash(token);
    return `${user.id}_${tokenHash}`;
  }

  /**
   * Simple hash function for token
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get user-specific storage key for favorites
   */
  private getFavoritesKey(): string | null {
    const userKey = this.getUserStorageKey();
    return userKey ? `${this.FAVORITES_PREFIX}${userKey}` : null;
  }

  /**
   * Get user-specific storage key for history
   */
  private getHistoryKey(): string | null {
    const userKey = this.getUserStorageKey();
    return userKey ? `${this.HISTORY_PREFIX}${userKey}` : null;
  }

  /**
   * Get user-specific storage key for profile image
   */
  private getProfileImageKey(): string | null {
    const userKey = this.getUserStorageKey();
    return userKey ? `${this.PROFILE_IMAGE_PREFIX}${userKey}` : null;
  }

  // ==================== FAVORITES MANAGEMENT ====================

  /**
   * Get user's favorite manga IDs
   */
  getFavorites(): string[] {
    try {
      const key = this.getFavoritesKey();
      if (!key) return [];
      
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  /**
   * Set user's favorite manga IDs
   */
  setFavorites(favoriteIds: string[]): void {
    try {
      const key = this.getFavoritesKey();
      if (!key) {
        console.warn('Cannot save favorites: user not authenticated');
        return;
      }

      localStorage.setItem(key, JSON.stringify(favoriteIds));
      
      // Dispatch event for components to listen to changes
      window.dispatchEvent(new CustomEvent('mp:user:favs:changed', {
        detail: { favoriteIds }
      }));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }

  /**
   * Add a manga to favorites
   */
  addToFavorites(mangaId: string): void {
    const favorites = this.getFavorites();
    if (!favorites.includes(mangaId)) {
      this.setFavorites([...favorites, mangaId]);
    }
  }

  /**
   * Remove a manga from favorites
   */
  removeFromFavorites(mangaId: string): void {
    const favorites = this.getFavorites();
    this.setFavorites(favorites.filter(id => id !== mangaId));
  }

  /**
   * Clear all favorites
   */
  clearFavorites(): void {
    this.setFavorites([]);
  }

  // ==================== HISTORY MANAGEMENT ====================

  /**
   * Get user's reading history
   */
  getHistory(): HistoryItem[] {
    try {
      const key = this.getHistoryKey();
      if (!key) return [];
      
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  /**
   * Set user's reading history
   */
  setHistory(historyItems: HistoryItem[]): void {
    try {
      const key = this.getHistoryKey();
      if (!key) {
        console.warn('Cannot save history: user not authenticated');
        return;
      }

      localStorage.setItem(key, JSON.stringify(historyItems));
      
      // Dispatch event for components to listen to changes
      window.dispatchEvent(new CustomEvent('mp:user:history:changed', {
        detail: { historyItems }
      }));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }

  /**
   * Add or update a history item
   */
  addToHistory(item: HistoryItem): void {
    const history = this.getHistory();
    
    // Remove existing entry for the same manga and chapter
    const filteredHistory = history.filter(
      h => !(h.mangaId === item.mangaId && h.chapter === item.chapter)
    );
    
    // Add new entry at the beginning (most recent first)
    const updatedHistory = [item, ...filteredHistory];
    
    // Keep only the last 100 items to prevent storage bloat
    const limitedHistory = updatedHistory.slice(0, 100);
    
    this.setHistory(limitedHistory);
  }

  /**
   * Remove a specific history item
   */
  removeFromHistory(mangaId: string, chapter: number): void {
    const history = this.getHistory();
    const filteredHistory = history.filter(
      h => !(h.mangaId === mangaId && h.chapter === chapter)
    );
    this.setHistory(filteredHistory);
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.setHistory([]);
  }

  // ==================== PROFILE IMAGE MANAGEMENT ====================

  /**
   * Get user's profile image
   */
  getProfileImage(): string | null {
    try {
      const key = this.getProfileImageKey();
      if (!key) return null;
      
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting profile image:', error);
      return null;
    }
  }

  /**
   * Set user's profile image
   */
  setProfileImage(imageData: string | null): void {
    try {
      const key = this.getProfileImageKey();
      if (!key) {
        console.warn('Cannot save profile image: user not authenticated');
        return;
      }

      if (imageData) {
        localStorage.setItem(key, imageData);
      } else {
        localStorage.removeItem(key);
      }
      
      // Dispatch event for components to listen to changes
      window.dispatchEvent(new CustomEvent('mp:user:profile:changed', {
        detail: { imageData }
      }));
    } catch (error) {
      console.error('Error saving profile image:', error);
    }
  }

  // ==================== USER SESSION MANAGEMENT ====================

  /**
   * Clear all user-specific data (called on logout)
   */
  clearUserData(): void {
    try {
      const userKey = this.getUserStorageKey();
      if (!userKey) return;

      // Get all localStorage keys
      const keys = Object.keys(localStorage);
      
      // Remove all keys that belong to this user
      keys.forEach(key => {
        if (key.includes(userKey)) {
          localStorage.removeItem(key);
        }
      });

      console.log('User-specific data cleared for user:', userKey);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  /**
   * Migrate existing global data to user-specific storage (one-time migration)
   */
  migrateGlobalData(): void {
    try {
      if (!authService.isAuthenticated()) return;

      // Migrate favorites
      const globalFavs = localStorage.getItem('mp_favorites');
      if (globalFavs && this.getFavorites().length === 0) {
        const favIds = JSON.parse(globalFavs);
        this.setFavorites(favIds);
        localStorage.removeItem('mp_favorites'); // Remove global data
      }

      // Migrate history
      const globalHistory = localStorage.getItem('mp_history');
      if (globalHistory && this.getHistory().length === 0) {
        const historyItems = JSON.parse(globalHistory);
        this.setHistory(historyItems);
        localStorage.removeItem('mp_history'); // Remove global data
      }

      // Migrate profile image
      const globalProfileImage = localStorage.getItem('mp_profile_image');
      if (globalProfileImage && !this.getProfileImage()) {
        this.setProfileImage(globalProfileImage);
        localStorage.removeItem('mp_profile_image'); // Remove global data
      }

      console.log('Global data migration completed');
    } catch (error) {
      console.error('Error during data migration:', error);
    }
  }

  /**
   * Check if user is authenticated and storage is available
   */
  isAvailable(): boolean {
    return authService.isAuthenticated() && this.getUserStorageKey() !== null;
  }
}

export const userStorageService = new UserStorageService();
