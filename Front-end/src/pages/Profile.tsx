import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bookmark, Clock, Settings, User as UserIcon, Plus } from 'lucide-react';
import MangaCard from '@/components/MangaCard';
import { mangaData } from '@/data/manga';
import type { Manga } from '@/types/manga';
import type { HistoryItem } from '@/types/manga';
import FavButton from '@/components/ui/FavButton';


const STORAGE_KEY = 'mp_user';
const GLOBAL_FAV_KEY = 'mp_favorites';
const PROFILE_IMAGE_KEY = 'mp_profile_image';


const getFavKeyForUser = (): string => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.email) return `mp_favs_${u.email}`;
    }
  } catch { }
  return GLOBAL_FAV_KEY;
};



const readFavIds = (): string[] => {
  try {
    const raw = localStorage.getItem(getFavKeyForUser());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeFavIds = (ids: string[]) => {
  try {
    localStorage.setItem(getFavKeyForUser(), JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('mp:favs:changed'));
  } catch { }
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'fav' | 'history' | 'reader' | 'account'>('fav');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');

  const loadUser = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      setUser(parsed);
      if (parsed?.name) setNewName(parsed.name);
    } catch {
      setUser(null);
    }
  }, []);

  const loadFavs = useCallback(() => {
    setFavIds(readFavIds());
  }, []);

  useEffect(() => {
    const savedImage = localStorage.getItem(PROFILE_IMAGE_KEY);
    if (savedImage) setProfileImage(savedImage);
  }, []);

  useEffect(() => {
    loadUser();
    loadFavs();
    const handler = () => loadFavs();
    window.addEventListener('mp:favs:changed', handler as EventListener);
    return () => window.removeEventListener('mp:favs:changed', handler as EventListener);
  }, [loadFavs, loadUser]);

 const [allMangas, setAllMangas] = useState<Manga[]>([]);
const [favMangas, setFavMangas] = useState<Manga[]>([]);

useEffect(() => {
  // اجمع المانغا من static + Home API
  setAllMangas(Object.values(mangaData) as Manga[]);

  // إذا عندك fetch API سابق فـ Home، ممكن تمررها ل Profile
}, []);

useEffect(() => {
  const favs = readFavIds();
  const favsFound = favs
    .map((id) => allMangas.find((m) => m.id === id))
    .filter(Boolean) as Manga[];
  setFavMangas(favsFound);
}, [allMangas, favIds]);



  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => {
  try {
    return JSON.parse(localStorage.getItem('mp_history') || '[]');
  } catch {
    return [];
  }
});

const removeHistoryItem = (id: string, chapter: number) => {
  const next = historyItems.filter(h => !(h.id === id && h.chapter === chapter));
  localStorage.setItem('mp_history', JSON.stringify(next));
  setHistoryItems(next); // تحديث state باش React يعيد render
};

const clearHistory = () => {
  localStorage.removeItem('mp_history');
  setHistoryItems([]); // تحديث state مباشرة
};


  const initials = user
    ? user.name
      .split(' ')
      .map((s) => s[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('')
    : '';

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    navigate('/login', { replace: true });
  };

  const removeFavorite = (id: string) => {
    const next = favIds.filter((i) => i !== id);
    writeFavIds(next);
    setFavIds(next);
  };

  const clearFavorites = () => {
    writeFavIds([]);
    setFavIds([]);
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setProfileImage(result);
        localStorage.setItem(PROFILE_IMAGE_KEY, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (!user) return;
    const updatedUser = { ...user, name: newName };
    setUser(updatedUser);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-xl w-full text-center">
          <p className="mb-6 text-lg text-muted-foreground">يرجى تسجيل الدخول للوصول للملف الشخصي.</p>
          <Link to="/login" className="inline-block px-4 py-2 bg-primary text-white rounded">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'fav':
        return favMangas.length === 0 ? (
          <div className="p-6 bg-white/80 dark:bg-gray-800/75 rounded text-sm text-muted-foreground">
            لا توجد عناصر في المفضلة. اضغط على القلب في أي بطاقة لإضافتها.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
           {favMangas.map((m) => (
  <div key={m.id} className="relative">
    <MangaCard manga={m} />
    <div className="absolute top-3 right-3 z-20">
      <FavButton mangaId={m.id} />
    </div>
  </div>
))}
          </div>
        );
  case 'history':
  if (historyItems.length === 0) {
    return <p className="text-muted-foreground">سجل التصفح فارغ حالياً.</p>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={clearHistory}
          className="px-3 py-1 text-sm bg-[#ff6633] text-white rounded hover:bg-red-700"
          disabled={historyItems.length === 0}
        >
          مسح الكل
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {historyItems.map((item) => (
          <div key={`${item.id}-${item.chapter}`} className="relative flex flex-col bg-white/80 dark:bg-gray-800/75 rounded shadow p-2 hover:bg-primary/10 transition">
            <Link to={`/read/${item.id}/${item.chapter}`} className="flex-1">
              <img src={item.cover} alt={item.title} className="w-full h-40 object-cover rounded" />
              <div className="mt-2 flex flex-col">
                <span className="font-semibold">{item.title}</span>
                <span className="text-sm text-muted-foreground">الفصل: {item.chapter}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  تم القراءة آخر مرة: {new Date(item.lastRead).toLocaleString()}
                </span>
              </div>
            </Link>

            <button
              onClick={() => removeHistoryItem(item.id, item.chapter)}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-[#ff6633] text-white hover:bg-red-700 text-sm"
              title="حذف من السجل"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );

      case 'reader':
        return (
          <div className="space-y-6">
            {/* مخطط الموقع */}
            <div className="p-4 bg-white/80 dark:bg-gray-800/75 rounded shadow">
              <h3 className="font-semibold mb-3">مخطط الموقع</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#fb5922]" defaultChecked />
                  افتراضي
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#fb5922]" />
                  الوضع الليلي
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#fb5922]" />
                  المضيء
                </label>
              </div>
            </div>

            {/* ستايل القراءة */}
            <div className="p-4 bg-white/80 dark:bg-gray-800/75 rounded shadow">
              <h3 className="font-semibold mb-3">ستايل القراءة</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#fb5922]" defaultChecked />
                  افتراضي
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#fb5922]" />
                  Paged
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#fb5922]" />
                  List
                </label>
              </div>
            </div>

            {/* عدد الصور لكل صفحة */}
            <div className="p-4 bg-white/80 dark:bg-gray-800/75 rounded shadow">
              <h3 className="font-semibold mb-2">عدد الصور لكل صفحة</h3>
              <p className="text-sm text-muted-foreground mb-3">
                يعمل فقط لستايل الصفحات
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#fb5922]" defaultChecked />
                  افتراضي
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#fb5922]" />
                  تحميل عدد 1 صورة لكل صفحة
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#fb5922]" />
                  تحميل عدد 3 صور لكل صفحة
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#fb5922]" />
                  تحميل عدد 6 صور لكل صفحة
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-[#fb5922]" />
                  تحميل عدد 10 صور لكل صفحة
                </label>
              </div>
            </div>

            {/* زر التقديم */}
            <div className="flex justify-end">
              <button className="px-6 py-2 bg-[#fb5922] text-white rounded-full hover:bg-[#e04e1d]">
                تقديم
              </button>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-white/80 dark:bg-gray-800/75 rounded">
              <div className="text-sm text-muted-foreground">البريد الإلكتروني</div>
              <div className="font-medium break-all">{user.email}</div>
            </div>

            <div className="p-4 bg-white/80 dark:bg-gray-800/75 rounded">
              <div className="text-sm text-muted-foreground">الاسم</div>
              {isEditing ? (
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-2 py-1 rounded text-black focus:outline-none"
                  />
                  <button
                    onClick={handleSaveProfile}
                    className="px-3 py-1 bg-[#fb5922] text-white rounded hover:bg-muted"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setNewName(user.name); }}
                    className="px-3 py-1 bg-[#2A313C] text-white rounded hover:bg-muted"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <div className="font-medium flex items-center justify-between mt-1">
                  <span>{user.name}</span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-2 py-1 bg-[#1D2630] text-[#fb5922] rounded hover:bg-muted"
                  >
                    تعديل
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={handleLogout} className="px-4 py-2 bg-[#fb5922] text-white rounded hover:bg-muted">
                تسجيل الخروج
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 bg-white/80 dark:bg-gray-800/75 rounded-lg shadow p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative w-24 h-24">
              <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-2xl overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initials || 'U'
                )}
              </div>
              <label
                htmlFor="profile-upload"
                className="absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center bg-[#fb5922] text-white rounded-full shadow cursor-pointer hover:bg-[#e04e1d]"
              >
                <Plus size={18} />
              </label>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileUpload}
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#ff6633]">{user.name}</h2>
              <p className="text-sm text-muted-foreground break-all">{user.email}</p>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            <button
              onClick={() => setActiveTab('fav')}
              className={`w-full flex items-center gap-3 p-2 rounded-lg ${activeTab === 'fav' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
            >
              <Bookmark className="w-4 h-4" />
              المفضلة
              <span className="ml-auto text-sm text-muted-foreground">{favIds.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 p-2 rounded-lg ${activeTab === 'history' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
            >
              <Clock className="w-4 h-4" />
              سجل التصفح
            </button>

            <button
              onClick={() => setActiveTab('reader')}
              className={`w-full flex items-center gap-3 p-2 rounded-lg ${activeTab === 'reader' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
            >
              <Settings className="w-4 h-4" />
              إعدادات القارئ
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 p-2 rounded-lg ${activeTab === 'account' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
            >
              <UserIcon className="w-4 h-4" />
              إعدادات الحساب
            </button>
          </nav>
        </aside>

        <main className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-[#ff6633]">
              {activeTab === 'fav'
                ? 'المفضلة'
                : activeTab === 'history'
                  ? 'سجل التصفح'
                  : activeTab === 'reader'
                    ? 'إعدادات القارئ'
                    : 'إعدادات الحساب'}
            </h1>

            <div className="flex items-center gap-2">
              {activeTab === 'fav' && (
                <button
                  onClick={clearFavorites}
                  className="px-3 py-2 text-sm bg-[#fb5922] text-white rounded"
                  disabled={favIds.length === 0}
                >
                  مسح الكل
                </button>
              )}
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-[#ff6633]">نظرة عامة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 bg-white/70 dark:bg-gray-700/60 rounded shadow">
                <div className="text-sm text-muted-foreground">المفضلة</div>
                <div className="text-2xl font-bold">{favIds.length}</div>
              </div>
              <div className="p-4 bg-white/70 dark:bg-gray-700/60 rounded shadow">
                <div className="text-sm text-muted-foreground">قوائم القراءة</div>
                <div className="text-2xl font-bold">0</div>
              </div>
              <div className="p-4 bg-white/70 dark:bg-gray-700/60 rounded shadow">
                <div className="text-sm text-muted-foreground">الفصول المقروءة</div>
                <div className="text-2xl font-bold">—</div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4"></div>
            <div className="text-muted-foreground">{renderTabContent()}</div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Profile;
