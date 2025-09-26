import React from "react";
import { useFavorites } from "@/contexts/FavoritesContext";

interface FavButtonProps {
  mangaId: string;
}

const FavButton: React.FC<FavButtonProps> = ({ mangaId }) => {
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <button
      onClick={() => toggleFavorite(mangaId)}
      className="text-red-500 hover:scale-110 transition"
    >
      {isFavorite(mangaId) ? "❤️" : "🤍"}
    </button>
  );
};

export default FavButton;
