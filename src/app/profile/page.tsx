'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  getActiveUsers,
  getMe,
  getPinnedFavorites,
  getProfileStats,
  getWatchHistory,
  pinFavorite,
  unpinFavorite,
  updateMyAvatar,
  updateProfileStatus,
  type PinnedFavorite,
  type ProfileStats,
} from '@/lib/api';
import type { AnimeBasic } from '@/types/anime';
import { Activity, Clock3, Loader2, Pin, PinOff, Sparkles, Star, TrendingUp, Users } from 'lucide-react';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Akira',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Hina',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Kaito',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Mika',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Sora',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Yuki',
];

interface HistoryItem extends AnimeBasic {
  progress: number;
  duration: number;
  episodeNumber: number;
  episodeId: string;
  updatedAt?: number;
}

interface ActiveUser {
  id: string;
  username: string;
  lastActiveAt: string | Date | null;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isMutatingPin, setIsMutatingPin] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const [user, setUser] = useState<{
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    statusMessage?: string;
  } | null>(null);

  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [statusInput, setStatusInput] = useState('');

  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [watchHistory, setWatchHistory] = useState<HistoryItem[]>([]);
  const [pinnedFavorites, setPinnedFavorites] = useState<PinnedFavorite[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<ActiveUser[]>([]);

  const pinnedSet = useMemo(
    () => new Set(pinnedFavorites.map((item) => item.animeId)),
    [pinnedFavorites]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [currentUser, stats, history, pinned, active] = await Promise.all([
        getMe(),
        getProfileStats(),
        getWatchHistory(),
        getPinnedFavorites(),
        getActiveUsers(),
      ]);

      if (currentUser) {
        setUser({
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          avatarUrl: currentUser.avatarUrl,
          statusMessage: currentUser.statusMessage,
        });
        setSelectedAvatar(currentUser.avatarUrl || AVATAR_PRESETS[0]);
        setStatusInput(currentUser.statusMessage || '');
      }

      setProfileStats(stats);
      setWatchHistory(history as HistoryItem[]);
      setPinnedFavorites(pinned);
      setOnlineUsers((active || []) as ActiveUser[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handlePin(item: { id: string; name: string; poster: string; type?: string }) {
    setIsMutatingPin(item.id);
    try {
      if (pinnedSet.has(item.id)) {
        const result = await unpinFavorite(item.id);
        if (!result.success) {
          toast({
            title: 'Failed',
            description: result.message || 'Could not unpin favorite.',
            variant: 'destructive',
          });
          return;
        }
      } else {
        const result = await pinFavorite({
          animeId: item.id,
          animeName: item.name,
          animePoster: item.poster,
          animeType: item.type || 'TV',
        });
        if (!result.success) {
          toast({
            title: 'Failed',
            description: result.message || 'Could not pin favorite.',
            variant: 'destructive',
          });
          return;
        }
      }

      setPinnedFavorites(await getPinnedFavorites());
    } finally {
      setIsMutatingPin(null);
    }
  }

  async function handleSaveAvatar() {
    setIsSavingAvatar(true);
    try {
      const result = await updateMyAvatar(selectedAvatar);
      if (!result.success) {
        toast({
          title: 'Avatar update failed',
          description: result.message || 'Could not update avatar.',
          variant: 'destructive',
        });
        return;
      }

      setUser((prev) => (prev ? { ...prev, avatarUrl: selectedAvatar } : prev));
      router.refresh();
    } finally {
      setIsSavingAvatar(false);
    }
  }

  async function handleSaveStatus() {
    setIsSavingStatus(true);
    try {
      const result = await updateProfileStatus(statusInput);
      if (!result.success) {
        toast({
          title: 'Status update failed',
          description: result.message || 'Could not update status.',
          variant: 'destructive',
        });
        return;
      }

      setUser((prev) => (prev ? { ...prev, statusMessage: statusInput.trim() } : prev));
      router.refresh();
      toast({ title: 'Status updated' });
    } finally {
      setIsSavingStatus(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Sign in to view your profile.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const friends = onlineUsers.filter((activeUser) => activeUser.id !== user.id).slice(0, 8);

  return (
    <div className="min-h-screen bg-background pb-12 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-6xl min-w-0 px-3 py-6 space-y-4 sm:px-4 sm:py-8 sm:space-y-6">
        <Card className="w-full max-w-full overflow-hidden border-primary/20">
          <div className="bg-gradient-to-r from-primary/15 via-background to-primary/5 px-4 py-6 sm:px-6 sm:py-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:gap-5">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/40 bg-muted sm:h-28 sm:w-28">
                  <Image
                    src={user.avatarUrl || AVATAR_PRESETS[0]}
                    alt={user.username}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 max-w-full flex-1 space-y-3">
                  <div>
                    <h1 className="break-all text-2xl font-bold tracking-tight sm:text-3xl">{user.username}</h1>
                    <p className="break-all text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                    <Input
                      value={statusInput}
                      onChange={(event) => setStatusInput(event.target.value.slice(0, 120))}
                      placeholder="Set your status..."
                      className="min-w-0 bg-background"
                    />
                    <Button onClick={() => void handleSaveStatus()} disabled={isSavingStatus}>
                      {isSavingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save
                    </Button>
                  </div>
                  <p className="break-words text-sm text-muted-foreground">
                    {user.statusMessage?.trim() || 'No status set yet.'}
                  </p>
                </div>
              </div>

              <div className="w-full max-w-full space-y-3 rounded-xl border bg-background/70 p-4">
                <p className="text-sm font-semibold">Avatar Presets</p>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(2rem,1fr))] gap-2">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setSelectedAvatar(preset)}
                      className={`overflow-hidden rounded-full border-2 ${
                        selectedAvatar === preset ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={preset}
                        alt="avatar preset"
                        width={48}
                        height={48}
                        unoptimized
                        className="h-9 w-9"
                      />
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => void handleSaveAvatar()}
                  disabled={isSavingAvatar || selectedAvatar === (user.avatarUrl || AVATAR_PRESETS[0])}
                >
                  {isSavingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Apply Avatar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={<Clock3 className="h-4 w-4 text-sky-500" />} label="Hours Watched" value={profileStats?.hoursWatched ?? 0} className="border-sky-500/40" />
          <MetricCard icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} label="Completion Rate" value={`${profileStats?.completionRate ?? 0}%`} className="border-emerald-500/40" />
          <MetricCard icon={<Star className="h-4 w-4 text-amber-500" />} label="Titles Watched" value={profileStats?.titlesWatched ?? 0} className="border-amber-500/40" />
          <MetricCard icon={<Sparkles className="h-4 w-4 text-violet-500" />} label="Favorite Genres" value={(profileStats?.favoriteGenres || []).length} className="border-violet-500/40" />
        </div>

        <Card className="w-full max-w-full overflow-hidden">
          <CardHeader>
            <CardTitle>Top 5 Favorites</CardTitle>
            <CardDescription>A showcase shelf of your pinned anime</CardDescription>
          </CardHeader>
          <CardContent>
            {pinnedFavorites.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pin anime from your activity lists below.</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-3">
                {pinnedFavorites.map((fav) => (
                  <div key={fav.animeId} className="min-w-0 space-y-2">
                    <Link href={`/anime/${fav.animeId}`}>
                      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border">
                        <Image src={fav.animePoster || '/next.svg'} alt={fav.animeName} fill className="object-cover" />
                      </div>
                    </Link>
                    <p className="line-clamp-2 text-xs font-medium" title={fav.animeName}>
                      {summarizeText(fav.animeName, 34)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card className="w-full max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest watch updates on your profile</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3">
              {watchHistory.slice(0, 12).map((item) => (
                <ActivityRow
                  key={`${item.id}-${item.episodeId}`}
                  item={item}
                  isPinned={pinnedSet.has(item.id)}
                  isLoading={isMutatingPin === item.id}
                  onTogglePin={() =>
                    void handlePin({
                      id: item.id,
                      name: item.name,
                      poster: item.poster,
                      type: item.type,
                    })
                  }
                />
              ))}
              {watchHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="w-full max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Friends Online
                </CardTitle>
              <CardDescription>Quick view of who is active</CardDescription>
              </CardHeader>
              <CardContent>
                {friends.length > 0 ? (
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(3.25rem,1fr))] gap-3">
                    {friends.map((friend) => (
                      <Link
                        key={friend.id}
                        href={`/u/${encodeURIComponent(friend.username)}`}
                        className="min-w-0 text-center"
                      >
                        <div className="relative mx-auto h-12 w-12 overflow-hidden rounded-full border">
                          <Image
                            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(friend.username)}`}
                            alt={friend.username}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                        </div>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground" title={friend.username}>
                          {summarizeText(friend.username, 10)}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No friends online right now.</p>
                )}
              </CardContent>
            </Card>

            <Card className="w-full max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle>Favorite Genres</CardTitle>
                <CardDescription>Taste profile from your watch behavior</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-2">
                {(profileStats?.favoriteGenres || []).length > 0 ? (
                  profileStats?.favoriteGenres.map((genre) => (
                    <span
                      key={genre}
                      title={genre}
                      className="truncate rounded-md border px-2 py-1 text-xs text-muted-foreground"
                    >
                      {summarizeText(genre, 14)}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Keep watching to build preferences.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border p-4 ${className || ''}`}>
      <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ActivityRow({
  item,
  isPinned,
  isLoading,
  onTogglePin,
}: {
  item: HistoryItem;
  isPinned: boolean;
  isLoading: boolean;
  onTogglePin: () => void;
}) {
  const progress = item.duration > 0 ? Math.round((item.progress / item.duration) * 100) : 0;
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <Link href={`/watch/${item.id}?ep=${item.episodeId}`} className="relative h-16 w-12 shrink-0 overflow-hidden rounded border">
        <Image src={item.poster || '/next.svg'} alt={item.name} fill className="object-cover" />
      </Link>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={item.name}>
          {summarizeText(item.name, 30)}
        </p>
        <p className="text-xs text-muted-foreground">
          Watched episode {item.episodeNumber} · {relativeTime(item.updatedAt)}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-muted">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Button size="sm" variant={isPinned ? 'secondary' : 'outline'} onClick={onTogglePin} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPinned ? (
          <PinOff className="h-4 w-4" />
        ) : (
          <Pin className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

function relativeTime(timestamp?: number) {
  if (!timestamp || timestamp <= 0) return 'recently';
  const diffMs = Date.now() - timestamp;
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function summarizeText(text: string | undefined, max = 36) {
  const value = (text || '').trim();
  if (value.length <= max) return value || '-';
  return `${value.slice(0, Math.max(1, max - 3)).trim()}...`;
}
