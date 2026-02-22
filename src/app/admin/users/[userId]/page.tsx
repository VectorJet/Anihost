'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { getAdminUserById, getMe, updateAdminUserSettings, type AdminUser, type AdminUserSettings } from '@/lib/api';
import { ArrowLeft, Loader2, Save, Shield } from 'lucide-react';

const DEFAULT_SETTINGS: AdminUserSettings = {
  userId: '',
  safeMode: false,
  ageRestriction: false,
  explicitContent: true,
  autoSkipIntro: true,
  notifications: true,
  autoPlay: true,
  watchHistory: true,
  qualityPreference: 'auto',
  downloadQuality: 'high',
  language: 'en',
  theme: 'system',
  defaultVolume: 70,
};

export default function AdminUserSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId || '';

  const [targetUser, setTargetUser] = useState<AdminUser | null>(null);
  const [settings, setSettings] = useState<AdminUserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPage = useCallback(async () => {
    setIsLoading(true);
    try {
      const me = await getMe();
      if (!me || me.role !== 'admin') {
        router.replace('/admin');
        return;
      }

      const user = await getAdminUserById(userId);
      if (!user) {
        toast({
          title: 'Not found',
          description: 'User could not be loaded',
          variant: 'destructive',
        });
        router.replace('/admin');
        return;
      }

      setTargetUser(user);
      setSettings({
        ...DEFAULT_SETTINGS,
        ...user.settings,
      });
    } finally {
      setIsLoading(false);
    }
  }, [router, toast, userId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  async function handleSave() {
    if (!targetUser) return;

    setIsSaving(true);
    try {
      const result = await updateAdminUserSettings(targetUser.id, settings);
      if (result.success) {
        toast({
          title: 'Saved',
          description: 'User settings were updated.',
        });
      } else {
        toast({
          title: 'Save failed',
          description: result.message || 'Unable to save settings.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!targetUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-4xl px-4 space-y-4">
        <Button variant="outline" onClick={() => router.push('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{targetUser.username} - User Settings</CardTitle>
            <CardDescription>
              {targetUser.email} | Role: {targetUser.role}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Parental Controls
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="safeMode">Safe Mode</Label>
                <Switch
                  id="safeMode"
                  checked={settings.safeMode}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, safeMode: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ageRestriction">Age Restriction</Label>
                <Switch
                  id="ageRestriction"
                  checked={settings.ageRestriction}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, ageRestriction: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="explicitContent">Allow Explicit Content</Label>
                <Switch
                  id="explicitContent"
                  checked={settings.explicitContent}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, explicitContent: checked }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qualityPreference">Quality Preference</Label>
                <Input
                  id="qualityPreference"
                  value={settings.qualityPreference}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, qualityPreference: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="downloadQuality">Download Quality</Label>
                <Input
                  id="downloadQuality"
                  value={settings.downloadQuality}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, downloadQuality: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={settings.language}
                  onChange={(event) => setSettings((prev) => ({ ...prev, language: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Input
                  id="theme"
                  value={settings.theme}
                  onChange={(event) => setSettings((prev) => ({ ...prev, theme: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultVolume">Default Volume (0-100)</Label>
                <Input
                  id="defaultVolume"
                  type="number"
                  min={0}
                  max={100}
                  value={String(settings.defaultVolume)}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      defaultVolume: Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoSkipIntro">Auto Skip Intro</Label>
                <Switch
                  id="autoSkipIntro"
                  checked={settings.autoSkipIntro}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoSkipIntro: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Notifications</Label>
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, notifications: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="autoPlay">Auto Play</Label>
                <Switch
                  id="autoPlay"
                  checked={settings.autoPlay}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoPlay: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="watchHistory">Watch History</Label>
                <Switch
                  id="watchHistory"
                  checked={settings.watchHistory}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, watchHistory: checked }))}
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save User Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
