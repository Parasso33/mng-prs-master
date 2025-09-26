const token = "personal-client-08685863-b7bd-413a-8d5d-8d50fe3629eb-241e4a7b";

// Jib details dyal manga par ID
export async function fetchMangaDetails(mangaId) {
  const res = await fetch(`https://api.mangadex.org/manga/${mangaId}`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    }
  });
  const data = await res.json();
  console.log(data);

  // Cover
  const coverRel = data.data.relationships.find((r) => r.type === "cover_art");
  let cover = "/images/placeholder.jpg";
  if (coverRel) {
    const coverRes = await fetch(`https://api.mangadex.org/cover/${coverRel.id}`);
    const coverJson = await coverRes.json();
    const fileName = coverJson.data.attributes.fileName;
    cover = `https://uploads.mangadex.org/covers/${data.data.id}/${fileName}.512.jpg`;
  }

  // collect tag names
  const tags = (data.data.attributes.tags || []).map((t) => {
    return t.attributes?.name?.en || Object.values(t.attributes?.name || {})[0] || t.id;
  });

  // fetch authors & artists names from relationships (when available)
  const authorRels = (data.data.relationships || []).filter((r) => r.type === 'author');
  const artistRels = (data.data.relationships || []).filter((r) => r.type === 'artist');

  const fetchNames = async (rels) => {
    return Promise.all(rels.map(async (r) => {
      try {
        const res = await fetch(`https://api.mangadex.org/author/${r.id}`);
        const json = await res.json();
        return json?.data?.attributes?.name || r.id;
      } catch (e) {
        return r.id;
      }
    }));
  };

  const authors = await fetchNames(authorRels);
  const artists = await fetchNames(artistRels);

  return {
    id: data.data.id,
    title: data.data.attributes.title?.en || "No title",
    altTitles: data.data.attributes.altTitles || [],
    description: data.data.attributes.description?.en || "",
    cover,
    status: data.data.attributes.status || null,
    year: data.data.attributes.year || null,
    contentRating: data.data.attributes.contentRating || null,
    publicationDemographic: data.data.attributes.publicationDemographic || null,
    tags,
    authors,
    artists,
    updatedAt: data.data.attributes?.updatedAt || null,
    chapters: [] // chapters are populated by fetchChapters in the component
  };
}

// Jib chapters dyal manga
export async function fetchChapters(mangaId, limit = 100) {
  const res = await fetch(`https://api.mangadex.org/chapter?manga=${mangaId}&limit=${limit}`, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    }
  });
  const data = await res.json();
  return data.data; // array dyal chapters
}
