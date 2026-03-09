import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [uploading, setUploading] = useState(false);

  // Update form when profile loads
  useState(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setBio(profile.bio ?? '');
    }
  });

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
      toast.success('Foto atualizada!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({ full_name: fullName, bio });
      toast.success('Perfil atualizado!');
      navigate(`/profile/${profile?.username}`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil');
    }
  };

  if (!user || !profile) {
    return (
      <main className="max-w-lg mx-auto px-4 py-6 text-center">
        <p>Carregando...</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Editar perfil</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
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
              {uploading ? 'Enviando...' : 'Alterar foto'}
            </button>
          </div>
        </div>

        {/* Full name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome"
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Biografia</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre você..."
            rows={4}
          />
        </div>

        <Button
          type="submit"
          disabled={updateProfile.isPending}
          className="w-full gradient-brand hover:opacity-90 glow-primary"
        >
          {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </main>
  );
}
