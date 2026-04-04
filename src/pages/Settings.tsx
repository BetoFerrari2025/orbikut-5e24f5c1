import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Moon, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
];

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setBio(profile.bio ?? '');
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      toast.success(t('settings.photoUpdated'));
    } catch (error: any) {
      toast.error(error.message || t('settings.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({ full_name: fullName, bio });
      toast.success(t('settings.profileUpdated'));
      navigate(`/profile/${profile?.username}`);
    } catch (error: any) {
      toast.error(error.message || t('settings.updateError'));
    }
  };

  if (!user || !profile) {
    return (
      <main className="max-w-lg mx-auto px-4 py-6 text-center">
        <p>{t('settings.loadingText')}</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-foreground">{t('settings.editProfile')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">
                {profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-brand flex items-center justify-center"
              disabled={uploading}
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-semibold text-foreground">{profile.username}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-primary font-semibold"
              disabled={uploading}
            >
              {uploading ? t('settings.uploading') : t('settings.changePhoto')}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">{t('settings.name')}</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t('settings.namePlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">{t('settings.bio')}</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t('settings.bioPlaceholder')}
            rows={4}
          />
        </div>

        <Button
          type="submit"
          disabled={updateProfile.isPending}
          className="w-full gradient-brand hover:opacity-90 glow-primary"
        >
          {updateProfile.isPending ? t('settings.saving') : t('settings.save')}
        </Button>
      </form>

      <div className="mt-8 border-t border-border pt-6 space-y-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('settings.appearance')}</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-foreground" />
            <Label htmlFor="dark-mode" className="cursor-pointer">{t('settings.darkMode')}</Label>
          </div>
          <Switch
            id="dark-mode"
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-foreground" />
            <div>
              <Label className="cursor-pointer">{t('settings.language')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.languageDesc')}</p>
            </div>
          </div>
          <Select
            value={i18n.language?.substring(0, 2)}
            onValueChange={(value) => i18n.changeLanguage(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </main>
  );
}
