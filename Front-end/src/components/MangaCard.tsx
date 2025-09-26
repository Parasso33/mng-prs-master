import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import type { Manga } from '@/types/manga';

interface MangaCardProps {
  manga: Manga;
  showLatestChapter?: boolean;
}

const SESSION_USER_KEY = 'mp_user';
const GLOBAL_FAV_KEY = 'mp_favorites';

const getFavKey = (): string => {
  try {
    const raw = sessionStorage.getItem(SESSION_USER_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.email) return `mp_favs_${u.email}`;
    }
  } catch {}
  return GLOBAL_FAV_KEY;
};

const readFavs = (): string[] => {
  try {
    const key = getFavKey();
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeFavs = (ids: string[]) => {
  try {
    const key = getFavKey();
    localStorage.setItem(key, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('mp:favs:changed'));
  } catch {}
};

const MangaCard: React.FC<MangaCardProps> = ({ manga, showLatestChapter = false }) => {
  const latestChapter = manga.chapters?.[0] ?? null;
  const [isFav, setIsFav] = useState<boolean>(false);
  const { toast } = useToast();
  const { isLoggedIn } = useApp();
  const userLoggedIn = Boolean(isLoggedIn || sessionStorage.getItem(SESSION_USER_KEY));

  useEffect(() => {
    const favs = readFavs();
    setIsFav(favs.includes(manga.id));
  }, [manga.id]);

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!manga.id) return;

    const favs = readFavs();
    const exists = favs.includes(manga.id);
    const next = exists ? favs.filter((id) => id !== manga.id) : [...favs, manga.id];
    writeFavs(next);
    setIsFav(!exists);

    toast?.({
      title: !exists ? 'تمت الإضافة إلى المفضلة!' : 'تمت الإزالة من المفضلة',
    });
  };

  return (
    <Link to={`/manga/${manga.id}`} className="block h-full">
  <div className="bg-card rounded-xl shadow hover:shadow-lg transition group overflow-hidden flex flex-col h-full">
    {/* صورة + زر المفضلة */}
    <div className="relative overflow-hidden">
      {userLoggedIn && (
        <button
          onClick={toggleFav}
          aria-pressed={isFav}
          aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          className="absolute right-3 top-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
        >
          {isFav ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21s-7.5-4.873-10-8.093C-1.333 8.333 4.2 4.5 7.5 7.125 9.042 8.47 12 11 12 11s2.958-2.53 4.5-3.875C19.8 4.5 25.333 8.333 22 12.907 19.5 16.127 12 21 12 21z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.172 7.172a4 4 0 015.656 0L12 10.343l3.172-3.171a4 4 0 015.656 5.656L12 21 3.172 12.828a4 4 0 010-5.656z" />
            </svg>
          )}
        </button>
      )}

      <img
        src={manga.cover}
        alt={manga.title}
        className="w-full h-64 object-cover transform group-hover:scale-105 transition duration-500"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-4">
        <div className="text-white">
          <h3 className="font-bold text-lg mb-1 line-clamp-2">{manga.title}</h3>
          <p className="text-sm opacity-90">{manga.status} • {manga.type}</p>
          {showLatestChapter && latestChapter && (
            <p className="text-xs opacity-80 mt-1">الفصل {latestChapter.number}</p>
          )}
        </div>
      </div>
    </div>

    {/* محتوى ثابت الطول */}
    <div className="p-4 flex flex-col flex-1">
      <h3 className="font-bold text-lg mb-2 text-card-foreground group-hover:text-primary transition line-clamp-2">
        {manga.title}
      </h3>

      <div className="mt-auto">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="truncate">{manga.authors}</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              manga.status === 'Ongoing'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : manga.status === 'Completed'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}
          >
            {manga.status}
          </span>
        </div>


        {showLatestChapter && latestChapter && (
          <div className="mt-2 text-sm text-muted-foreground line-clamp-1">
            الفصل {latestChapter.number}: {latestChapter.title}
          </div>
        )}

      </div>
    </div>
  </div>
</Link>

  );
};

export default MangaCard;
