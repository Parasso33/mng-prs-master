import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchMangaDetails, fetchChapters } from '@/api/fetchManga';
import { toast } from '@/components/ui/use-toast';
import type { Manga } from '@/types/manga';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/contexts/ProfileContext';

type Props = {
  initialChapters?: any[];
};

const MangaDetails: React.FC<Props> = ({ initialChapters }) => {
  const { id } = useParams<{ id: string }>();
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<any[]>(initialChapters || []);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const navigate = useNavigate();


  useEffect(() => {
    const loadManga = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const details = await fetchMangaDetails(id);
        setManga(details);

        if (!initialChapters) {
          const chaps = await fetchChapters(id);
          setChapters(chaps || []);
        } else {
          setChapters(initialChapters || []);
        }
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to load manga details', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadManga();
  }, [id, initialChapters]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <span className="text-primary font-semibold">Loading...</span>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Manga not found</h1>
        <Link to="/">
          <Button variant="outline">Go Home</Button>
        </Link>
      </div>
    );
  }

  const mapChapter = (c: any, idx: number) => {
    const number = c?.attributes?.chapter ?? c.chapter ?? c.number ?? idx + 1;
    const title = c?.attributes?.title ?? c.title ?? `Chapter ${number}`;
    const pages = c?.attributes?.pages ?? c.pages ?? c.pageCount ?? '-';
    const publishAt = c?.attributes?.publishAt ?? c.publishAt ?? c.publishedAt ?? null;
    const key = c.id ?? `${manga.id}-${number}`;
    return { number, title, pages, publishAt, key };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-1">
          <img
            src={manga.cover}
            alt={manga.title}
            className="w-full rounded-lg shadow-lg animate-fade-in"
          />
        </div>

        <div className="md:col-span-2 animate-slide-up">
          <h1 className="text-4xl font-bold text-primary mb-4">{manga.title}</h1>

          <div className="space-y-3 mb-6">
            <div className="flex">
              <span className="font-bold text-muted-foreground min-w-[100px]">Author(s)</span>
              <span>{Array.isArray(manga.authors) ? manga.authors.join(', ') : manga.authors ?? 'Unknown'}</span>
            </div>

            <div className="flex">
              <span className="font-bold text-muted-foreground min-w-[100px]">Artist(s)</span>
              <span>{Array.isArray(manga.artists) ? manga.artists.join(', ') : manga.artists ?? 'Unknown'}</span>
            </div>

            <div className="flex">
              <span className="font-bold text-muted-foreground min-w-[100px]">Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                manga.status === 'Ongoing'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : manga.status === 'Completed'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>{manga.status ?? 'Unknown'}</span>
            </div>

            <div className="flex">
              <span className="font-bold text-muted-foreground min-w-[100px]">Rating</span>
              <span className="text-primary font-bold">{manga.rating ?? '—'}</span>
            </div>

            <div className="flex flex-wrap items-start">
              <span className="font-bold text-muted-foreground min-w-[100px]">Genres / Tags</span>
              <div className="flex flex-wrap gap-2">
                {(manga.categories || []).map((g: string, i: number) => (
                  <span key={i} className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold mb-3">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{manga.description}</p>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-primary border-b-2 border-primary pb-2 inline-block">
          Chapters
        </h2>
        <div className="space-y-2">
          {(chapters.length ? chapters : manga.chapters || []).map((c, idx) => {
            const chap = mapChapter(c, idx);

            const handleOpenChapter = async () => {
              const chapterId = c?.id;
              if (chapterId) return navigate(`/reader/${manga.id}/${chapterId}`);
              try {
                setResolving(chap.key);
                const fetched = await fetchChapters(manga.id);
                const found = fetched?.find((f: any) => f.id === c?.id || String(f?.attributes?.chapter ?? f.chapter ?? f.number) === String(chap.number));
                if (found?.id) navigate(`/reader/${manga.id}/${found.id}`);
                else toast({ title: 'Error', description: `Chapter ${chap.number} not found`, variant: 'destructive' });
              } catch (err) {
                toast({ title: 'Error', description: 'Failed to fetch chapter', variant: 'destructive' });
              } finally {
                setResolving(null);
              }
            };

            return (
              <div key={chap.key}>
                <div
                  onClick={handleOpenChapter}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') handleOpenChapter(); }}
                  className="bg-card hover:bg-primary hover:text-primary-foreground p-4 rounded-lg border border-border hover:border-primary cursor-pointer flex justify-between items-center transition"
                >
                  <span className="font-medium">{`Chapter ${chap.number}: ${chap.title}`}</span>
                  <span className="text-sm opacity-75">{chap.pages} pages</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default MangaDetails;
