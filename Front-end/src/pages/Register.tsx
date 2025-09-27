import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { authService } from '@/services/authService';

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const Register: React.FC = () => {
  const { translation, setIsLoggedIn } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!name.trim()) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'المرجو إدخال الاسم',
        });
        setIsLoading(false);
        return;
      }

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

      if (password !== confirmPassword) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: 'كلمات السر غير متطابقة',
        });
        setIsLoading(false);
        return;
      }

      // Call backend API for registration
      const { user } = await authService.register({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim()
      });

      setIsLoggedIn?.(true);

      toast({
        title: 'تم إنشاء الحساب بنجاح!',
        description: `مرحباً ${user.name}`,
      });

      navigate('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في إنشاء الحساب',
        description: error.message || 'حدث خطأ غير متوقع',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-4">
        <div className="bg-card p-8 rounded-lg shadow-lg animate-scale-in">
          <h1 className="text-2xl font-bold text-center mb-8 text-primary">
            إنشاء حساب جديد
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full focus:ring-0"
                placeholder="اسمك الكامل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{translation.email || 'البريد الإلكتروني'}</Label>
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
              <Label htmlFor="password">{translation.password || 'كلمة السر'}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة السر</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  جاري إنشاء الحساب...
                </div>
              ) : (
                'إنشاء حساب'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              لديك حساب بالفعل؟{' '}
              <Link 
                to="/login" 
                className="text-primary hover:underline font-medium"
              >
                تسجيل الدخول
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center text-muted-foreground text-sm">
            <p>للتجربة: استخدم أي بيانات صحيحة</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
