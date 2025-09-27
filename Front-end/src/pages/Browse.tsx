import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import MangaCard from '@/components/MangaCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Manga } from '@/types/manga';
import LoadingSpinner from '@/components/LoadingSpinner';

const Browse: React.FC = () => {
  const { translation } = useApp();
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'Ongoing' | 'Completed' | 'متوقف' | 'all'
  const [typeFilter, setTypeFilter] = useState<string>('all'); // 'manga' | 'manhwa' | 'manhua' | 'all'
  const [search, setSearch] = useState<string>('');
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch mangas from API
  useEffect(() => {
    const fetchMangas = async () => {
      try {
        // Fetch a list of popular mangas with covers, tags, and authors
        const res = await fetch(
          'https://api.mangadex.org/manga?limit=50&order[followedCount]=desc&includes[]=cover_art&includes[]=tag&includes[]=author'
        );
        const json = await res.json();

        const mapped: Manga[] = (json?.data || []).map((m: any) => {
          const title = m.attributes.title?.en || Object.values(m.attributes.title || {})[0] || 'Untitled';
          const rating = m.attributes.rating?.bayesian || '0';
          const statusAttr = (m.attributes.status || '').toLowerCase();
          const status: Manga['status'] = statusAttr === 'completed' ? 'Completed' : statusAttr === 'ongoing' ? 'Ongoing' : 'متوقف';

          const coverRel = m.relationships?.find((r: any) => r.type === 'cover_art');
          const coverUrl = coverRel ? `https://uploads.mangadex.org/covers/${m.id}/${coverRel.attributes.fileName}.256.jpg` : '';

          const authorRel = m.relationships?.find((r: any) => r.type === 'author');
          const authors = authorRel?.attributes?.name || 'Unknown';

          // Collect categories from tags (prefer genre group)
          const tags = (m.attributes.tags || []) as any[];
          const categories: string[] = tags.map(t => t.attributes?.name?.en || Object.values(t.attributes?.name || {})[0]).filter(Boolean);

          // Infer type from originalLanguage: ko -> manhwa, zh/zh-hk -> manhua, else manga
          const lang = (m.attributes.originalLanguage || '').toLowerCase();
          const type: Manga['type'] = lang === 'ko' ? 'manhwa' : (lang === 'zh' || lang === 'zh-hk' || lang === 'zh-hant' || lang === 'zh-hans') ? 'manhua' : 'manga';

          return {
            id: m.id,
            title,
            titleEn: title,
            authors,
            artists: [],
            status,
            categories,
            rating,
            description: m.attributes.description?.en || Object.values(m.attributes.description || {})[0] || '',
            cover: coverUrl,
            chapters: [],
            url: `https://mangadex.org/title/${m.id}`,
            type,
          };
        });

        setMangas(mapped);
      } catch (err) {
        console.error('Error fetching mangas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMangas();
  }, []);

  // Get unique genres
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    mangas.forEach(manga => {
      (manga.categories || []).forEach(genre => genres.add(genre));
    });
    return Array.from(genres).sort();
  }, [mangas]);

  // Filter mangas
  const filteredMangas = useMemo(() => {
    return mangas.filter(manga => {
      const matchesGenre = genreFilter === 'all' || manga.categories.includes(genreFilter);
      const matchesStatus = statusFilter === 'all' || manga.status === statusFilter;
      const matchesType = typeFilter === 'all' || manga.type === typeFilter;
      const matchesSearch = !search.trim() || manga.title.toLowerCase().includes(search.trim().toLowerCase());
      return matchesGenre && matchesStatus && matchesType && matchesSearch;
    });
  }, [mangas, genreFilter, statusFilter, typeFilter, search]);

  const clearFilters = () => {
    setGenreFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
    setSearch('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-primary">
        {translation.browseTitle}
      </h1>

      {/* Filters */}
      <div className="bg-card p-6 rounded-lg shadow-lg mb-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2">
              {translation.searchPlaceholder}
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={translation.searchPlaceholder}
              className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              {translation.genres}
            </label>
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger>
                <SelectValue placeholder={translation.allGenres} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translation.allGenres}</SelectItem>
                {allGenres.map(genre => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {translation.status}
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={translation.allStatuses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translation.allStatuses}</SelectItem>
                <SelectItem value="Ongoing">{translation.ongoing}</SelectItem>
                <SelectItem value="Completed">{translation.completed}</SelectItem>
                <SelectItem value="متوقف">{translation.hiatus}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder={translation.allTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translation.allTypes}</SelectItem>
                <SelectItem value="manga">{translation.manga}</SelectItem>
                <SelectItem value="manhwa">{translation.manhwa}</SelectItem>
                <SelectItem value="manhua">{translation.manhua}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Button variant="outline" onClick={clearFilters} className="w-full">
              مسح الفلاتر
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSpinner message={translation.loading} />
      ) : (
        <>
          <div className="mb-4">
            <p className="text-muted-foreground">
              تم العثور على {filteredMangas.length} مانجا
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 animate-slide-up">
            {filteredMangas.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>

          {filteredMangas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                لم يتم العثور على نتائج مطابقة للفلاتر المحددة
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Browse;
