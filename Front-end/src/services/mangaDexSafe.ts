import axios from "axios";

export type MDTag = { id: string; attributes: { name: Record<string, string> } };
export type MDManga = {
  id: string;
  attributes: {
    title: Record<string, string>;
    contentRating?: "safe" | "suggestive" | "erotica" | "pornographic";
    tags?: Array<{ attributes: { name: Record<string, string> } }>;
  };
  relationships?: Array<{ type: string; attributes?: { fileName?: string } }>;
};

async function getTagIds() {
  const res = await axios.get("https://api.mangadex.org/manga/tag");
  const tags: MDTag[] = res.data?.data ?? [];
  const find = (name: string) =>
    tags.find(t => (t.attributes?.name?.en || "").toLowerCase() === name.toLowerCase())?.id;

  const ecchiId = find("Ecchi");
  const hentaiId = find("Hentai");
  if (!ecchiId || !hentaiId) throw new Error("Failed to resolve Ecchi/Hentai tag IDs");
  return { ecchiId, hentaiId };
}

function coverUrl256(m: MDManga) {
  const rel = m.relationships?.find(r => r.type === "cover_art");
  const file = rel?.attributes?.fileName;
  return file ? `https://uploads.mangadex.org/covers/${m.id}/${file}.256.jpg` : "";
}

function pickTitle(m: MDManga) {
  const t = m.attributes?.title || {};
  return (t as any).en || Object.values(t)[0] || "Untitled";
}

export async function fetchMangaNoEcchiHentai(limit = 24, offset = 0) {
  const { ecchiId, hentaiId } = await getTagIds();

  const res = await axios.get("https://api.mangadex.org/manga", {
    params: {
      limit,
      offset,
      "order[latestUploadedChapter]": "desc",
      "excludedTags[]": [ecchiId, hentaiId],
      excludedTagsMode: "OR",
      "contentRating[]": ["safe", "suggestive"],
      "includes[]": ["cover_art"],
    },
    paramsSerializer: (p) => {
      const usp = new URLSearchParams();
      usp.set("limit", String(p.limit));
      usp.set("offset", String(p.offset));
      usp.set("order[latestUploadedChapter]", p["order[latestUploadedChapter]"]);
      (p["excludedTags[]"] as string[]).forEach(v => usp.append("excludedTags[]", v));
      usp.set("excludedTagsMode", p.excludedTagsMode);
      (p["contentRating[]"] as string[]).forEach(v => usp.append("contentRating[]", v));
      (p["includes[]"] as string[]).forEach(v => usp.append("includes[]", v));
      return usp.toString();
    },
  });

  const data: MDManga[] = res.data?.data ?? [];
  const filtered = data.filter(m => {
    const tagNames = m.attributes?.tags?.map(t => t.attributes?.name?.en) || [];
    const hasEcchi = tagNames.includes("Ecchi");
    const hasHentai = tagNames.includes("Hentai");
    const isPorn = m.attributes?.contentRating === "pornographic";
    return !hasEcchi && !hasHentai && !isPorn;
  });

  return filtered.map(m => ({
    id: m.id,
    title: pickTitle(m),
    cover: coverUrl256(m),
  }));
}