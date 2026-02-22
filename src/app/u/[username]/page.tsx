'use client';

import { type ReactNode, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getProfileByUsername, type ProfileByUsernameResponse } from '@/lib/api';
import { Activity, Clock3, Loader2, Sparkles, Star, TrendingUp, UserPlus } from 'lucide-react';

export default function PublicProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const username = params?.username || '';

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ProfileByUsernameResponse | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const profile = await getProfileByUsername(username);
      setData(profile);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>That username does not exist or is unavailable.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/profile')}>Go To My Profile</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, stats, pinnedFavorites, recentActivity, isOwnProfile } = data;

  return (
    <div className="min-h-screen bg-background pb-12 overflow-x-hidden">
      <div className="container mx-auto w-full max-w-6xl min-w-0 px-3 py-6 space-y-4 sm:px-4 sm:py-8 sm:space-y-6">
        <Card className="w-full max-w-full overflow-hidden border-primary/20">
          <div className="bg-gradient-to-r from-primary/15 via-background to-primary/5 px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex min-w-0 max-w-full items-center gap-4 sm:gap-5">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/40 bg-muted sm:h-28 sm:w-28">
                  <Image
                    src={profile.avatarUrl || '/next.svg'}
                    alt={profile.username}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 max-w-full space-y-1">
                  <h1 className="break-all text-2xl font-bold tracking-tight sm:text-3xl">{profile.username}</h1>
                  <p className="break-all text-sm text-muted-foreground">{profile.email}</p>
                  <p className="break-words text-sm text-muted-foreground">
                    {profile.statusMessage?.trim() || 'No status message.'}
                  </p>
                </div>
              </div>

              {isOwnProfile ? (
                <Button onClick={() => router.push('/profile')}>Edit My Profile</Button>
              ) : (
                <Button
                  onClick={() =>
                    toast({
                      title: 'Friends coming next',
                      description: 'Friend requests will be enabled once social model is added.',
                    })
                  }
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Friend
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={<Clock3 className="h-4 w-4 text-sky-500" />} label="Hours Watched" value={stats.hoursWatched} className="border-sky-500/40" />
          <MetricCard icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} label="Completion Rate" value={`${stats.completionRate}%`} className="border-emerald-500/40" />
          <MetricCard icon={<Star className="h-4 w-4 text-amber-500" />} label="Titles Watched" value={stats.titlesWatched} className="border-amber-500/40" />
          <MetricCard icon={<Sparkles className="h-4 w-4 text-violet-500" />} label="Favorite Genres" value={stats.favoriteGenres.length} className="border-violet-500/40" />
        </div>

        <Card className="w-full max-w-full overflow-hidden">
          <CardHeader>
            <CardTitle>Top 5 Favorites</CardTitle>
            <CardDescription>Showcase shelf</CardDescription>
          </CardHeader>
          <CardContent>
            {pinnedFavorites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pinned favorites yet.</p>
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
              <CardDescription>Latest watch updates</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 15).map((item) => (
                  <div key={`${item.animeId}-${item.episodeId}`} className="flex items-start gap-3 rounded-lg border p-3">
                    <Link href={`/watch/${item.animeId}?ep=${item.episodeId}`} className="relative h-16 w-12 shrink-0 overflow-hidden rounded border">
                      <Image src={item.animePoster || '/next.svg'} alt={item.animeName} fill className="object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={item.animeName}>
                        {summarizeText(item.animeName, 30)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Watched episode {item.episodeNumber} · {relativeTime(new Date(item.lastWatchedAt).getTime())}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              )}
            </CardContent>
          </Card>

          <Card className="w-full max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle>Favorite Genres</CardTitle>
              <CardDescription>Taste profile</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-2">
              {stats.favoriteGenres.length > 0 ? (
                stats.favoriteGenres.map((genre) => (
                  <span
                    key={genre}
                    title={genre}
                    className="truncate rounded-md border px-2 py-1 text-xs text-muted-foreground"
                  >
                    {summarizeText(genre, 14)}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No genre data yet.</p>
              )}
            </CardContent>
          </Card>
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

function relativeTime(timestamp: number) {
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
