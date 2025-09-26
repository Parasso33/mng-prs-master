import React from 'react';
import { useApp } from '@/contexts/AppContext';
import MangaCard from '@/components/MangaCard';

const Latest: React.FC = () => {
  const { translation } = useApp();
  const [mangas, setMangas] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchLatest = async () => {
      setLoading(true);
      try {
        // 1) Get recently updated manga with covers
        const res = await fetch(
          'https://api.mangadex.org/manga?limit=20&order[updatedAt]=desc&includes[]=cover_art'
        );
        const data = await res.json();

        const baseMangas = data.data.map((m: any) => {
          const title = m.attributes.title?.en || Object.values(m.attributes.title || {})[0] || 'Untitled';
          const rating = m.attributes.rating?.bayesian || '0';
          const statusAttr = (m.attributes.status || '').toLowerCase();
          const status = statusAttr === 'completed' ? 'Completed' : statusAttr === 'ongoing' ? 'Ongoing' : 'متوقف';
          const coverRel = m.relationships?.find((r: any) => r.type === 'cover_art');
          const coverUrl = coverRel ? `https://uploads.mangadex.org/covers/${m.id}/${coverRel.attributes.fileName}.256.jpg` : '';

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
            // Temporary empty, will fill with the latest chapter below
            chapters: [],
            url: `https://mangadex.org/title/${m.id}`,
            type: 'manga',
          };
        });

        // 2) For each manga, fetch the latest chapter (best-effort)
        const withLatestChapters = await Promise.all(
          baseMangas.map(async (bm) => {
            try {
              const chapRes = await fetch(
                `https://api.mangadex.org/chapter?limit=1&order[publishAt]=desc&translatedLanguage[]=en&manga=${bm.id}`
              );
              const chapData = await chapRes.json();
              const ch = chapData?.data?.[0];
              if (ch) {
                const chNum = parseFloat(ch.attributes.chapter || '0') || 0;
                const chapter = {
                  number: chNum,
                  title: ch.attributes.title || '',
                  pages: ch.attributes.pages || 0,
                  releaseDate: ch.attributes.publishAt || ch.attributes.readableAt || undefined,
                  images: [],
                  url: `https://mangadex.org/chapter/${ch.id}`,
                  next: 0,
                  prev: 0,
                };
                return { ...bm, chapters: [chapter] };
              }
            } catch {}
            return bm;
          })
        );

        // Sort by latest chapter number if available, else keep order from API (recently updated)
        const sorted = [...withLatestChapters].sort((a, b) => {
          const aN = a.chapters?.[0]?.number || 0;
          const bN = b.chapters?.[0]?.number || 0;
          return bN - aN;
        });

        setMangas(sorted);
      } catch (err) {
        console.error('Error fetching latest mangas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-primary border-b-2 border-primary pb-2 inline-block">
        {translation.latest}
      </h1>

      {loading ? (
        <p>{translation.loading || 'Loading...'}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-slide-up">
          {mangas.map((manga: any) => (
            <MangaCard key={manga.id} manga={manga} showLatestChapter />
          ))}
        </div>
      )}
    </div>
  );
};

export default Latest;