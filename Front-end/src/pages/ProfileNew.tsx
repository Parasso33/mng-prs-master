import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bookmark, Clock, Settings, User as UserIcon, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { authService, type User } from '@/services/authService';
import { historyService, type HistoryItem } from '@/services/historyService';
import { favoritesService, type FavoriteItem } from '@/services/favoritesService';

const PROFILE_IMAGE_KEY = 'mp_profile_image';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'fav' | 'history' | 'reader' | 'account'>('fav');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');

  // Load user profile
  const loadUser = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
          if (userData?.name) setNewName(userData.name);
        } catch (error) {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            if (storedUser?.name) setNewName(storedUser.name);
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Load favorites from backend
  const loadFavorites = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    
    try {
      setIsLoadingFavorites(true);
      const response = await favoritesService.getFavorites(1, 50);
      setFavorites(response.favorites);
    } catch (error: any) {
      console.error('Failed to load favorites:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في تحميل المفضلة',
      });
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [toast]);

  // Load history from backend
  const loadHistory = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    
    try {
      setIsLoadingHistory(true);
      const response = await historyService.getHistory(1, 50);
      setHistoryItems(response.history);
    } catch (error: any) {
      console.error('Failed to load history:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في تحميل السجل',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [toast]);

  // Initialize data on mount
  useEffect(() => {
    const savedImage = localStorage.getItem(PROFILE_IMAGE_KEY);
    if (savedImage) setProfileImage(savedImage);
    
    loadUser();
  }, [loadUser]);

  // Load favorites and history when user is loaded
  useEffect(() => {
    if (user) {
      loadFavorites();
      loadHistory();
    }
  }, [user, loadFavorites, loadHistory]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (error) {
      navigate('/login', { replace: true });
    }
  };

  // Remove favorite
  const removeFavorite = async (mangaId: string) => {
    try {
      await favoritesService.removeFavorite(mangaId);
      setFavorites(prev => prev.filter(fav => fav.mangaId !== mangaId));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المانجا من المفضلة',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في حذف المانجا من المفضلة',
      });
    }
  };

  // Clear all favorites
  const clearFavorites = async () => {
    try {
      await favoritesService.clearFavorites();
      setFavorites([]);
      toast({
        title: 'تم المسح',
        description: 'تم مسح جميع المفضلة',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في مسح المفضلة',
      });
    }
  };

  // Remove history item
  const removeHistoryItem = async (mangaId: string, chapter: number) => {
    try {
      await historyService.deleteHistoryItem(mangaId, chapter);
      setHistoryItems(prev => prev.filter(item => !(item.mangaId === mangaId && item.chapter === chapter)));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف العنصر من السجل',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في حذف العنصر من السجل',
      });
    }
  };

  // Clear all history
  const clearHistory = async () => {
    try {
      await historyService.clearHistory();
      setHistoryItems([]);
      toast({
        title: 'تم المسح',
        description: 'تم مسح جميع السجل',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في مسح السجل',
      });
    }
  };

  // Handle profile image upload
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

  // Save profile changes
  const handleSaveProfile = () => {
    if (!user) return;
    const updatedUser = { ...user, name: newName };
    setUser(updatedUser);
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
    setIsEditing(false);
    toast({
      title: 'تم الحفظ',
      description: 'تم حفظ التغييرات',
    });
  };

  // Get user initials
  const initials = user
    ? user.name
      .split(' ')
      .map((s) => s[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('')
    : '';

  if (isLoadingProfile) {
    return <LoadingSpinner message="جاري تحميل الملف الشخصي..." />;
  }

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
        if (isLoadingFavorites) {
          return <LoadingSpinner message="جاري تحميل المفضلة..." />;
        }
        return favorites.length === 0 ? (
          <div className="p-6 bg-white/80 dark:bg-gray-800/75 rounded text-sm text-muted-foreground">
            لا توجد عناصر في المفضلة.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => (
              <div key={fav.mangaId} className="relative bg-white/80 dark:bg-gray-800/75 rounded-lg shadow p-4">
                <img 
                  src={fav.mangaCover} 
                  alt={fav.mangaTitle} 
                  className="w-full h-48 object-cover rounded mb-3" 
                />
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">{fav.mangaTitle}</h3>
                <p className="text-xs text-muted-foreground mb-2">{fav.mangaAuthors}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  تم الإضافة: {new Date(fav.addedAt).toLocaleDateString('ar')}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeFavorite(fav.mangaId)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  حذف من المفضلة
                </Button>
              </div>
            ))}
          </div>
        );

      case 'history':
        if (isLoadingHistory) {
          return <LoadingSpinner message="جاري تحميل السجل..." />;
        }
        return historyItems.length === 0 ? (
          <div className="p-6 bg-white/80 dark:bg-gray-800/75 rounded text-sm text-muted-foreground">
            سجل التصفح فارغ حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {historyItems.map((item) => (
              <div key={`${item.mangaId}-${item.chapter}`} className="relative bg-white/80 dark:bg-gray-800/75 rounded-lg shadow p-4">
                <img 
                  src={item.mangaCover} 
                  alt={item.mangaTitle} 
                  className="w-full h-40 object-cover rounded mb-3" 
                />
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.mangaTitle}</h3>
                <p className="text-sm text-muted-foreground mb-1">الفصل: {item.chapter}</p>
                {item.chapterTitle && (
                  <p className="text-xs text-muted-foreground mb-2">{item.chapterTitle}</p>
                )}
                <p className="text-xs text-muted-foreground mb-3">
                  آخر قراءة: {new Date(item.lastRead).toLocaleString('ar')}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeHistoryItem(item.mangaId, item.chapter)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  حذف من السجل
                </Button>
              </div>
            ))}
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
                  <Button onClick={handleSaveProfile} size="sm">
                    حفظ
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setIsEditing(false); setNewName(user.name); }}
                    size="sm"
                  >
                    إلغاء
                  </Button>
                </div>
              ) : (
                <div className="font-medium flex items-center justify-between mt-1">
                  <span>{user.name}</span>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    size="sm"
                  >
                    تعديل
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleLogout} variant="destructive">
                تسجيل الخروج
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6 bg-white/80 dark:bg-gray-800/75 rounded text-sm text-muted-foreground">
            إعدادات القارئ قيد التطوير...
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
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
              <span className="ml-auto text-sm text-muted-foreground">{favorites.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 p-2 rounded-lg ${activeTab === 'history' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
            >
              <Clock className="w-4 h-4" />
              سجل التصفح
              <span className="ml-auto text-sm text-muted-foreground">{historyItems.length}</span>
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

        {/* Main Content */}
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
                <Button
                  onClick={clearFavorites}
                  variant="destructive"
                  size="sm"
                  disabled={favorites.length === 0}
                >
                  مسح الكل
                </Button>
              )}
              {activeTab === 'history' && (
                <Button
                  onClick={clearHistory}
                  variant="destructive"
                  size="sm"
                  disabled={historyItems.length === 0}
                >
                  مسح الكل
                </Button>
              )}
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-[#ff6633]">نظرة عامة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 bg-white/70 dark:bg-gray-700/60 rounded shadow">
                <div className="text-sm text-muted-foreground">المفضلة</div>
                <div className="text-2xl font-bold">{favorites.length}</div>
              </div>
              <div className="p-4 bg-white/70 dark:bg-gray-700/60 rounded shadow">
                <div className="text-sm text-muted-foreground">سجل التصفح</div>
                <div className="text-2xl font-bold">{historyItems.length}</div>
              </div>
              <div className="p-4 bg-white/70 dark:bg-gray-700/60 rounded shadow">
                <div className="text-sm text-muted-foreground">الفصول المقروءة</div>
                <div className="text-2xl font-bold">{historyItems.length}</div>
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
