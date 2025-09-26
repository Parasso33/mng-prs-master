export interface Manga {
  id: string;
  title: string;
  titleEn: string;
  authors: string;
  artists: string[];
  status: 'Ongoing' | 'Completed' | 'متوقف';
  categories: string[];
  rating: string;
  description: string;
  cover: string;
  chapters: Chapter[];
  url: string;
  type: 'manga' | 'manhwa' | 'manhua';
}

export interface HistoryItem {
  id: string;
  title: string;
  chapter: number;
  cover: string;
  lastRead: number;
}


export interface Chapter {
  number: number;
  title: string;
  pages: number;
  releaseDate?: string;
  images: string[];
  url: string;
  next: number;
  prev: number;
}

export interface Language {
  code: 'ar' | 'fr';
  name: string;
  direction: 'rtl' | 'ltr';
}

export interface Translation {
  siteName: string;
  home: string;
  browse: string;
  login: string;
  logout: string;
  profile: string;
  popular: string;
  latest: string;
  welcome: string;
  discover: string;
  searchPlaceholder: string;
  searchBtn: string;
  latestChapters: string;
  popularManga: string;
  browseTitle: string;
  loginTitle: string;
  email: string;
  password: string;
  loginBtn: string;
  author: string;
  status: string;
  genres: string;
  rating: string;
  description: string;
  chapterList: string;
  previousChapter: string;
  nextChapter: string;
  backToManga: string;
  chapter: string;
  allGenres: string;
  allStatuses: string;
  allTypes: string;
  ongoing: string;
  completed: string;
  hiatus: string;
  manga: string;
  manhwa: string;
  manhua: string;
  loading: string;
}