import React, { createContext, useContext, useState, useEffect } from "react";

interface FavoritesContextType {
  favorites: string[]; // list of mangaIds
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean; // ⬅️ هادي لي ناقصاك
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);

  const GLOBAL_FAV_KEY = 'mp_favorites';

  // Load favorites from global storage
  useEffect(() => {
    const stored = localStorage.getItem(GLOBAL_FAV_KEY);
    if (stored) {
      setFavorites(JSON.parse(stored));
    } else {
      setFavorites([]);
    }
  }, []);

  // Save favorites to global storage
  useEffect(() => {
    localStorage.setItem(GLOBAL_FAV_KEY, JSON.stringify(favorites));
    
    // Dispatch event so Profile page can listen for changes
    window.dispatchEvent(new CustomEvent('mp:user:favs:changed', {
      detail: { favorites }
    }));
  }, [favorites]);

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
