'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, register } from '@/lib/api';
import { useRouter } from 'next/navigation';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Akira',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Hina',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Kaito',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Mika',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Sora',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Yuki',
];

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = isLogin 
        ? await login(email, password)
        : await register(username, email, password, avatarUrl);

      if (res.success) {
        onClose();
        router.refresh();
      } else {
        setError(res.message || 'Authentication failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isLogin ? 'Login to Anihost' : 'Create an Account'}</DialogTitle>
          <DialogDescription>
            {isLogin 
              ? 'Enter your credentials to access your watch history and personalized recommendations.' 
              : 'Sign up to start tracking your anime progress.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="johndoe"
                  required={!isLogin}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Avatar (optional)</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setAvatarUrl(preset)}
                      className={`overflow-hidden rounded-full border-2 ${
                        avatarUrl === preset ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={preset}
                        alt="avatar preset"
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="john@example.com"
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </Button>
        </form>
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
