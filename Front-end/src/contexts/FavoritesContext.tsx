import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "@/services/authService";

interface FavoritesContextType {
  favorites: string[]; // list of mangaIds
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean; // ⬅️ هادي لي ناقصاك
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Get user-specific storage key
  const getFavoritesKey = () => {
    const user = authService.getStoredUser();
    if (user && authService.isAuthenticated()) {
      return `mp_favorites_${user.id}`;
    }
    return "mp_favorites_guest"; // For non-authenticated users
  };

  // Load favorites from user-specific storage
  useEffect(() => {
    const key = getFavoritesKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      setFavorites(JSON.parse(stored));
    } else {
      setFavorites([]);
    }
  }, []);

  // Save favorites to user-specific storage
  useEffect(() => {
    const key = getFavoritesKey();
    localStorage.setItem(key, JSON.stringify(favorites));
    
    // Dispatch event so Profile page can listen for changes
    window.dispatchEvent(new CustomEvent('mp:user:favs:changed', {
      detail: { favorites, userId: authService.getStoredUser()?.id }
    }));
  }, [favorites]);

  // Listen for auth changes to reload favorites for new user
  useEffect(() => {
    const handleAuthChange = () => {
      const key = getFavoritesKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        setFavorites(JSON.parse(stored));
      } else {
        setFavorites([]);
      }
    };

    // Listen for login/logout events
    window.addEventListener('mp:auth:changed', handleAuthChange);
    return () => window.removeEventListener('mp:auth:changed', handleAuthChange);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
