import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { mangaData } from '@/data/manga';
import type { Manga } from '@/types/manga';
import { FaGoogle, FaFacebookF } from "react-icons/fa";
import { authService, type User } from '@/services/authService';

const STORAGE_KEY = 'mp_user';
const SESSION_USER_KEY = 'mp_user';
const GLOBAL_FAV_KEY = 'mp_favorites';

const getNameFromEmail = (email: string) =>
  email ? email.split('@')[0].replace(/[.\-_]/g, ' ') : 'User';

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const getFavKeyForUser = () => {
  try {
    const user = authService.getStoredUser();
    if (user?.email) return `mp_favs_${user.email}`;
  } catch {
    /* ignore */
  }
  return GLOBAL_FAV_KEY;
};

const readFavsForUser = (): string[] => {
  try {
    const raw = localStorage.getItem(getFavKeyForUser());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const Login: React.FC = () => {
  const { translation, setIsLoggedIn } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteMangas, setFavoriteMangas] = useState<Manga[]>([]);

  // load from storage on mount
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const storedUser = authService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setIsLoggedIn?.(true);
      }
    }
  }, [setIsLoggedIn]);

  const loadFavorites = useCallback(() => {
    const ids = readFavsForUser();
    setFavoriteIds(ids);
    // map ids to manga objects (order preserved)
    const items = ids.map((id) => (mangaData as any)[id]).filter(Boolean) as Manga[];
    setFavoriteMangas(items);
  }, []);

  useEffect(() => {
    // initial favorites load when user changes
    loadFavorites();
    // listen to changes from MangaCard writes
    const handler = () => loadFavorites();
    window.addEventListener('mp:favs:changed', handler as EventListener);
    return () => window.removeEventListener('mp:favs:changed', handler as EventListener);
  }, [loadFavorites]);

  const persistUser = (u: User) => {
    // The auth service already handles storing user data
    setUser(u);
    setIsLoggedIn?.(true);
    // load user favorites after login
    setTimeout(loadFavorites, 0);
  };

  const clearUser = () => {
    // The auth service logout already clears storage
    setUser(null);
    setIsLoggedIn?.(false);
    setFavoriteIds([]);
    setFavoriteMangas([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!validateEmail(email)) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'المرجو إدخال بريد إلكتروني صحيح',
        });
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'كلمة السر يجب أن تكون 6 أحرف على الأقل',
        });
        setIsLoading(false);
        return;
      }

      // Call backend API for login
      const { user } = await authService.login({
        email: email.toLowerCase().trim(),
        password
      });

      persistUser(user);

      toast({
        title: 'تم تسجيل الدخول بنجاح!',
        description: `مرحباً ${user.name}`,
      });

      navigate('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في تسجيل الدخول',
        description: error.message || 'بيانات الدخول غير صحيحة',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      clearUser();
      toast({
        title: 'تم تسجيل الخروج',
      });
      navigate('/');
    } catch (error) {
      // Even if logout fails, clear local state
      clearUser();
      navigate('/');
    }
  };

  // If user in session — show profile instead of login form
  if (user) {
    const initials = user.name
      .split(' ')
      .map((s) => s[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');

    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-4">
          <div className="bg-card p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg">
                {initials}
              </div>
              <div>
                <div className="text-lg font-semibold">{user.name}</div>
                <div className="text-sm text-muted-foreground break-all">{user.email}</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button onClick={() => navigate('/profile')} className="w-full">
                {translation.profile || 'الملف الشخصي'}
              </Button>
              <Button variant="ghost" onClick={handleLogout} className="w-full">
                {translation.logout || 'تسجيل الخروج'}
              </Button>
            </div>

            {/* Favorites list in profile */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3">المفضلة ({favoriteIds.length})</h4>
              {favoriteMangas.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد عناصر في المفضلة</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {favoriteMangas.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <img src={m.cover} alt={m.title} className="w-12 h-16 object-cover rounded" loading="lazy" />
                      <div className="flex-1">
                        <div className="text-sm font-medium leading-tight line-clamp-2">{m.title}</div>
                        <div className="text-xs text-muted-foreground">{m.authors}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = (provider: "google" | "facebook") => {
    toast({
      title: `${provider === "google" ? "Google" : "Facebook"} Login`,
      description: "قريباً!",
    });
  };
  // Default: login form
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-4">
        <div className="bg-card p-8 rounded-lg shadow-lg animate-scale-in">
          <h1 className="text-2xl font-bold text-center mb-8 text-primary">
            {translation.loginTitle}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{translation.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full focus:ring-0"
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{translation.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full focus:ring-0"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري التحميل...
                </div>
              ) : (
                translation.loginBtn
              )}
            </Button>

            <div className="flex flex-col gap-4 mt-6">
              <Button
                variant="outline"
                className="w-full flex items-center gap-2 border"
                onClick={() => handleLogin("google")}
              >
                المتابعة عبر Google
                <FaGoogle className="text-red-500" />
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center gap-2 border"
                onClick={() => handleLogin("facebook")}
              >
                المتابعة عبر Facebook
                <FaFacebookF className="text-blue-600" />
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              ليس لديك حساب؟{' '}
              <Link 
                to="/register" 
                className="text-primary hover:underline font-medium"
              >
                إنشاء حساب جديد
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center text-muted-foreground text-sm">
            <p>للتجربة: استخدم أي بريد إلكتروني وكلمة مرور من 6 أحرف على الأقل</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;