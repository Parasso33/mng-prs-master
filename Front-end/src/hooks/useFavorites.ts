// hooks/useFavorites.ts
import { useState, useEffect } from "react";
import { Manga } from "@/types/manga"; // عدّل المسار حسب المشروع ديالك

export function useFavorites() {
  const [favMangas, setFavMangas] = useState<Manga[]>([]);

  // جلب المفضلة من localStorage
  useEffect(() => {
    const stored = localStorage.getItem("favMangas");
    if (stored) {
      setFavMangas(JSON.parse(stored));
    }
  }, []);

  // تحديث localStorage كل مرة تتبدل favMangas
  useEffect(() => {
    localStorage.setItem("favMangas", JSON.stringify(favMangas));
  }, [favMangas]);

  // إضافة/إزالة المانجا
  const toggleFavorite = (manga: Manga) => {
    setFavMangas((prev) => {
      const exists = prev.find((m) => m.id === manga.id);
      if (exists) {
        return prev.filter((m) => m.id !== manga.id);
      } else {
        return [...prev, manga];
      }
    });
  };

  return { favMangas, toggleFavorite };
}
