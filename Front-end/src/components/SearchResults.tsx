import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

interface ResultItem {
  id: string;
  title: string;
  cover: string;
}

interface SearchResultsProps {
  query: string;
  onSelect?: () => void;
  embed?: boolean; // when true, render list only without absolute panel container
}

const SearchResults: React.FC<SearchResultsProps> = ({ query, onSelect, embed = false }) => {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const run = async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setResults([]);
        setLoading(false);
        setError(null);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const url = new URL('https://api.mangadex.org/manga');
        url.searchParams.set('limit', '10');
        url.searchParams.set('title', debouncedQuery.trim());
        url.searchParams.append('includes[]', 'cover_art');
        const res = await fetch(url.toString());
        const json = await res.json();
        const mapped: ResultItem[] = (json?.data || []).map((m: any) => {
          const title = m.attributes.title?.en || Object.values(m.attributes.title || {})[0] || 'Untitled';
          const coverRel = m.relationships?.find((r: any) => r.type === 'cover_art');
          const cover = coverRel ? `https://uploads.mangadex.org/covers/${m.id}/${coverRel.attributes.fileName}.256.jpg` : '';
          return { id: m.id, title, cover };
        });
        setResults(mapped);
      } catch (e) {
        setError('Failed to search');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [debouncedQuery]);

  if (!query || query.trim().length < 2) return null;

  const content = (
    <>
      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">Searching...</div>
      ) : error ? (
        <div className="p-4 text-sm text-destructive">{error}</div>
      ) : results.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">No results</div>
      ) : (
        <ul className="divide-y divide-border">
          {results.map((r) => (
            <li key={r.id}>
              <Link
                to={`/manga/${r.id}`}
                className="flex items-center gap-3 p-3 hover:bg-muted transition"
                onClick={onSelect}
              >
                <img src={r.cover} alt={r.title} className="w-12 h-16 object-cover rounded" />
                <span className="text-sm font-medium line-clamp-2">{r.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (embed) {
    return <div className="max-h-[60vh] overflow-auto">{content}</div>;
  }

  return (
    <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-auto bg-card rounded-lg shadow-xl border border-border z-[60]">
      {content}
    </div>
  );
};

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default SearchResults;
