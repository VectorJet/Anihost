'use client';

import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { ActiveUsers } from '@/components/active-users';
import { MediaSourcesManagement } from '@/components/admin/media-sources-management';
import { ServerHealthPanel } from '@/components/admin/server-health-panel';
import { UserManagement } from '@/components/admin/user-management';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMe, getUserSettings, getUserStats, updateUserSettings } from '@/lib/api';
import { Activity, Loader2, Settings, Shield, Tv, Users } from 'lucide-react';

interface UserSettingsState {
  safeMode: boolean;
  ageRestriction: boolean;
  explicitContent: boolean;
  autoSkipIntro: boolean;
  notifications: boolean;
  autoPlay: boolean;
  watchHistory: boolean;
  qualityPreference: string;
  downloadQuality: string;
  language: string;
  theme: string;
  defaultVolume: number;
}

const DEFAULT_SETTINGS: UserSettingsState = {
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

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [stats, setStats] = useState({
    currentActive: 0,
    peakToday: 0,
    avgSessionMinutes: 0,
  });

  const [settings, setSettings] = useState<UserSettingsState>(DEFAULT_SETTINGS);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [currentUser, userSettings, userStats] = await Promise.all([
        getMe(),
        getUserSettings(),
        getUserStats(),
      ]);

      setIsAdmin(currentUser?.role === 'admin');

      if (userSettings) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...userSettings,
        });
      }

      if (userStats) {
        setStats(userStats);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveSettings() {
    setIsSaving(true);
    try {
      await updateUserSettings(settings);
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

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Admin Control Panel</h1>
            <p className="text-muted-foreground">
              User management, media source configuration, and server monitoring
            </p>
          </div>

          {isAdmin ? (
            <Tabs defaultValue="users" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 lg:w-[720px]">
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="sources" className="gap-2">
                  <Tv className="h-4 w-4" />
                  <span className="hidden sm:inline">Media Sources</span>
                </TabsTrigger>
                <TabsTrigger value="health" className="gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Server Health</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">My Settings</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <UserManagement />
              </TabsContent>

              <TabsContent value="sources">
                <MediaSourcesManagement />
              </TabsContent>

              <TabsContent value="health">
                <ServerHealthPanel />
              </TabsContent>

              <TabsContent value="settings">
                <SettingsCard
                  settings={settings}
                  setSettings={setSettings}
                  isSaving={isSaving}
                  onSave={handleSaveSettings}
                  readonlyParental={false}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue="active-users" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                <TabsTrigger value="active-users" className="gap-2">
                  <Users className="h-4 w-4" />
                  Active Users
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  My Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active-users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Users Monitor</CardTitle>
                    <CardDescription>
                      Current platform activity and usage snapshots
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ActiveUsers />
                    <Separator />
                    <div className="grid gap-3 md:grid-cols-3">
                      <Stat title="Current Active" value={stats.currentActive} />
                      <Stat title="Peak Today" value={stats.peakToday} />
                      <Stat title="Avg Session" value={`${stats.avgSessionMinutes}m`} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <SettingsCard
                  settings={settings}
                  setSettings={setSettings}
                  isSaving={isSaving}
                  onSave={handleSaveSettings}
                  readonlyParental
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsCard({
  settings,
  setSettings,
  isSaving,
  onSave,
  readonlyParental,
}: {
  settings: UserSettingsState;
  setSettings: Dispatch<SetStateAction<UserSettingsState>>;
  isSaving: boolean;
  onSave: () => Promise<void>;
  readonlyParental: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Settings
        </CardTitle>
        <CardDescription>
          {readonlyParental
            ? 'Parental controls are managed by administrators'
            : 'Manage your platform and content preferences'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <SettingToggle
            id="safe-mode"
            label="Safe Mode"
            checked={settings.safeMode}
            disabled={readonlyParental}
            onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, safeMode: checked }))}
          />
          <SettingToggle
            id="age-restriction"
            label="Age Restriction"
            checked={settings.ageRestriction}
            disabled={readonlyParental}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, ageRestriction: checked }))
            }
          />
          <SettingToggle
            id="explicit-content"
            label="Allow Explicit Content"
            checked={settings.explicitContent}
            disabled={readonlyParental}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, explicitContent: checked }))
            }
          />
          <SettingToggle
            id="auto-skip-intro"
            label="Auto Skip Intro"
            checked={settings.autoSkipIntro}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, autoSkipIntro: checked }))
            }
          />
          <SettingToggle
            id="notifications"
            label="Notifications"
            checked={settings.notifications}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, notifications: checked }))
            }
          />
          <SettingToggle
            id="auto-play"
            label="Auto Play"
            checked={settings.autoPlay}
            onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoPlay: checked }))}
          />
          <SettingToggle
            id="watch-history"
            label="Track Watch History"
            checked={settings.watchHistory}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, watchHistory: checked }))
            }
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <SelectField
            label="Quality"
            value={settings.qualityPreference}
            options={['auto', '480p', '720p', '1080p']}
            onChange={(value) => setSettings((prev) => ({ ...prev, qualityPreference: value }))}
          />
          <SelectField
            label="Download"
            value={settings.downloadQuality}
            options={['low', 'medium', 'high']}
            onChange={(value) => setSettings((prev) => ({ ...prev, downloadQuality: value }))}
          />
          <SelectField
            label="Language"
            value={settings.language}
            options={['en', 'jp', 'es', 'fr']}
            onChange={(value) => setSettings((prev) => ({ ...prev, language: value }))}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <SelectField
            label="Theme"
            value={settings.theme}
            options={['light', 'dark', 'system']}
            onChange={(value) => setSettings((prev) => ({ ...prev, theme: value }))}
          />

          <div className="space-y-2">
            <Label htmlFor="default-volume">Default Volume: {settings.defaultVolume}%</Label>
            <input
              id="default-volume"
              type="range"
              min="0"
              max="100"
              value={settings.defaultVolume}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, defaultVolume: Number(event.target.value) }))
              }
              className="w-full"
            />
          </div>
        </div>

        <Button onClick={() => void onSave()} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}

function SettingToggle({
  id,
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label htmlFor={id}>{label}</Label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
