import React, { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import MangaCard from '@/components/MangaCard';

const Popular: React.FC = () => {
  const { translation } = useApp();
  const [mangas, setMangas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await fetch(
          'https://api.mangadex.org/manga?limit=20&order[followedCount]=desc&includes[]=cover_art'
        );
        const data = await res.json();

        const mappedManga = data.data.map((m: any) => {
          const title = m.attributes.title?.en || Object.values(m.attributes.title || {})[0] || 'Untitled';
          const rating = m.attributes.rating?.bayesian || '0';
          const cover = m.relationships.find((r: any) => r.type === 'cover_art');
          const coverUrl = cover
            ? `https://uploads.mangadex.org/covers/${m.id}/${cover.attributes.fileName}.256.jpg`
            : '';
          const statusAttr = (m.attributes.status || '').toLowerCase();
          const status = statusAttr === 'completed' ? 'Completed' : statusAttr === 'ongoing' ? 'Ongoing' : 'متوقف';

          // Provide minimal fields used by MangaCard
          return {
            id: m.id,
            title,
            titleEn: title,
            authors: 'Unknown',
            artists: [],
            status,
            categories: [],
            rating,
            description: m.attributes.description?.en || Object.values(m.attributes.description || {})[0] || '',
            cover: coverUrl,
            chapters: [],
            url: `https://mangadex.org/title/${m.id}`,
            type: 'manga',
          };
        });

        setMangas(mappedManga);
      } catch (err) {
        console.error('Error fetching popular mangas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopular();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-8 text-primary border-b-4 border-primary/60 pb-2 inline-block">
        {translation.popular}
      </h1>
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {mangas.map((manga, index) => (
            <div key={manga.id} className="relative">
              {/* Manga Card */}
              <MangaCard manga={manga} />

              {/* Rank Badge (ensure on top) */}
              <div
                className="absolute -top-3 -left-3 bg-primary text-white rounded-full w-8 h-8 
                           flex items-center justify-center text-sm font-bold z-30 pointer-events-none"
              >
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Popular;
