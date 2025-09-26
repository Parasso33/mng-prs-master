import React, { useEffect, useState } from 'react';
import MangaCard from '@/components/MangaCard';
import axios from 'axios';
import { useApp } from '@/contexts/AppContext';
import type { Manga } from '@/types/manga';

const carouselImages = [
  '/images/bleachi.jpg',
  '/images/dmsl.jpg',
  '/images/op.jpg',
  '/images/saka.jpg',
  '/images/bl.jpg'
];

const Home: React.FC = () => {
  const [mangaList, setMangaList] = useState<Manga[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { translation } = useApp();

  // Carousel autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((p) => (p + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch mangas + covers
  useEffect(() => {
    const fetchMangasWithCovers = async () => {
      try {
        const res = await axios.get('https://api.mangadex.org/manga', {
          params: { limit: 20, 'availableTranslatedLanguage[]': ['ar'] },
        });

        const mangas: Manga[] = await Promise.all(
          res.data.data.map(async (manga: any) => {
            // Cover
            const coverRel = manga.relationships.find((r: any) => r.type === "cover_art");
            let cover = "/images/placeholder.jpg";
            if (coverRel) {
              const coverRes = await axios.get(`https://api.mangadex.org/cover/${coverRel.id}`);
              const fileName = coverRes.data.data.attributes.fileName;
              cover = `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.512.jpg`;
            }

            // Chapters
            const chaptersRes = await axios.get(`https://api.mangadex.org/chapter`, {
              params: { manga: manga.id, translatedLanguage: ["ar"], limit: 1, order: { chapter: "desc" } },
            });
            const chapters = chaptersRes.data.data.map((c: any) => ({
              number: c.attributes.chapter,
              title: c.attributes.title || '',
              pages: c.attributes.pages || 0,
            }));

            // تحويل object لـ Manga كامل
            return {
              id: manga.id,
              title: manga.attributes.title['ar'] || manga.attributes.title['en'] || 'No Title',
              titleEn: manga.attributes.title['en'] || '',
              status: manga.attributes?.status === 'ongoing' ? 'مستمر' : manga.attributes?.status === 'completed' ? 'مكتمل' : 'متوقف',
              categories: manga.attributes?.tags?.map((t: any) => t.attributes.name['ar'] || t.attributes.name['en']) || [],
              rating: manga.attributes?.rating || 'N/A',
              description: manga.attributes?.description?.['ar'] || manga.attributes?.description?.['en'] || '',
              cover,
              chapters,
              url: `/manga/${manga.id}`,
              type: manga.attributes?.publicationDemographic || 'manga',
            } as Manga;
          })
        );

        setMangaList(mangas);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMangasWithCovers();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Carousel */}
      <div className="w-full max-w-full mt-0" style={{ backgroundColor: '#171A1C' }}>
        <div className="relative w-full h-56 md:h-80 rounded-none overflow-hidden">
          {carouselImages.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`slide-${i}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-600 ${
                i === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              loading="lazy"
            />
          ))}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-2">
            {carouselImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full ${i === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Manga sections */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="container mx-auto px-4 pt-8 pb-0">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: '#FF6633' }}>
              {translation.latestChapters || 'Latest'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {mangaList.map((m) => (
                <MangaCard key={m.id} manga={m} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Home;
