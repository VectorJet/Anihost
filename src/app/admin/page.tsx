'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ActiveUsers } from '@/components/active-users';
import { UserManagement } from '@/components/admin/user-management';
import { getUserSettings, updateUserSettings, getUserStats, getMe } from '@/lib/api';
import { 
  Shield, 
  Settings, 
  Users, 
  Lock,
  Eye,
  EyeOff,
  Bell,
  Palette,
  Monitor,
  Moon,
  Sun,
  Languages,
  Video,
  Volume2,
  Download,
  Clock,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    currentActive: 0,
    peakToday: 0,
    avgSessionMinutes: 0
  });

  // All Settings State
  const [settings, setSettings] = useState({
    // Parental Controls (read-only for non-admins)
    safeMode: false,
    ageRestriction: false,
    explicitContent: true,
    autoSkipIntro: true,
    // General Settings
    notifications: true,
    autoPlay: true,
    watchHistory: true,
    qualityPreference: 'auto',
    downloadQuality: 'high',
    language: 'en',
    theme: 'system',
    defaultVolume: 70,
  });

  // Load settings and stats on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [currentUser, userSettings, userStats] = await Promise.all([
        getMe(),
        getUserSettings(),
        getUserStats()
      ]);

      if (currentUser) {
        setUser(currentUser);
        setIsAdmin(currentUser.role === 'admin');
      }

      if (userSettings) {
        setSettings({
          safeMode: userSettings.safeMode || false,
          ageRestriction: userSettings.ageRestriction || false,
          explicitContent: userSettings.explicitContent !== false,
          autoSkipIntro: userSettings.autoSkipIntro !== false,
          notifications: userSettings.notifications !== false,
          autoPlay: userSettings.autoPlay !== false,
          watchHistory: userSettings.watchHistory !== false,
          qualityPreference: userSettings.qualityPreference || 'auto',
          downloadQuality: userSettings.downloadQuality || 'high',
          language: userSettings.language || 'en',
          theme: userSettings.theme || 'system',
          defaultVolume: userSettings.defaultVolume || 70,
        });
      }

      if (userStats) {
        setStats(userStats);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const result = await updateUserSettings(settings);
      if (result.success) {
        // Show success message (you can add a toast here)
        console.log('Settings saved successfully');
      } else {
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
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
    });
  };

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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Control Panel</h1>
            <p className="text-muted-foreground">
              Manage users, parental controls, and application settings
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={isAdmin ? "user-management" : "users"} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[450px]">
              <TabsTrigger value={isAdmin ? "user-management" : "users"} className="gap-2">
                {isAdmin ? <Shield className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                <span className="hidden sm:inline">{isAdmin ? "User Management" : "Active Users"}</span>
                <span className="sm:hidden">{isAdmin ? "Manage" : "Users"}</span>
              </TabsTrigger>
              {!isAdmin && (
                <TabsTrigger value="parental" className="gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">My Settings</span>
                  <span className="sm:hidden">Settings</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Preferences</span>
                <span className="sm:hidden">Prefs</span>
              </TabsTrigger>
            </TabsList>

            {/* Admin: User Management Tab */}
            {isAdmin && (
              <TabsContent value="user-management" className="space-y-4">
                <UserManagement />
              </TabsContent>
            )}

            {/* Non-Admin: Active Users Tab */}
            {!isAdmin && (
              <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Active Users Monitor
                  </CardTitle>
                  <CardDescription>
                    Real-time view of currently active users on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ActiveUsers />
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">User Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">Total Active</p>
                        <p className="text-2xl font-bold">{stats.currentActive}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">Peak Today</p>
                        <p className="text-2xl font-bold">{stats.peakToday}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">Avg. Session</p>
                        <p className="text-2xl font-bold">{stats.avgSessionMinutes}m</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {/* Parental Controls Tab (Read-only for non-admins) */}
            {!isAdmin && (
              <TabsContent value="parental" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      My Parental Controls
                    </CardTitle>
                    <CardDescription>
                      Your content restrictions are managed by the administrator
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Safe Mode */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="safe-mode" className="text-base flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Safe Mode
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Filter out mature and explicit content across the platform
                        </p>
                      </div>
                      <Switch 
                        id="safe-mode" 
                        checked={settings.safeMode} 
                        disabled
                      />
                    </div>

                    <Separator />

                    {/* Age Restriction */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="age-restriction" className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Age Restriction (13+)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Only show content appropriate for ages 13 and above
                        </p>
                      </div>
                      <Switch 
                        id="age-restriction" 
                        checked={settings.ageRestriction} 
                        disabled
                      />
                    </div>

                    <Separator />

                    {/* Explicit Content */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="explicit-content" className="text-base flex items-center gap-2">
                          {settings.explicitContent ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          Allow Explicit Content
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Show anime with mature themes, violence, or strong language
                        </p>
                      </div>
                      <Switch 
                        id="explicit-content" 
                        checked={settings.explicitContent} 
                        disabled
                      />
                    </div>

                    <Separator />

                    {/* Auto Skip Intro */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-skip" className="text-base flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Auto Skip Intro
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically skip opening sequences in episodes
                        </p>
                      </div>
                      <Switch 
                        id="auto-skip" 
                        checked={settings.autoSkipIntro} 
                        onCheckedChange={(checked) => setSettings({ ...settings, autoSkipIntro: checked })}
                      />
                    </div>

                    <div className="pt-4">
                      <Button 
                        className="w-full" 
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Settings'
                        )}
                      </Button>
                    </div>

                    <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                      <p className="font-medium mb-1">Note:</p>
                      <p>Parental controls (Safe Mode, Age Restriction, Explicit Content) can only be changed by an administrator.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    General Settings
                  </CardTitle>
                  <CardDescription>
                    Customize your viewing experience and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications" className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about new episodes and releases
                      </p>
                    </div>
                    <Switch 
                      id="notifications" 
                      checked={settings.notifications} 
                      onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
                    />
                  </div>

                  <Separator />

                  {/* Auto Play */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoplay" className="text-base flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Auto Play Next Episode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically play the next episode when one finishes
                      </p>
                    </div>
                    <Switch 
                      id="autoplay" 
                      checked={settings.autoPlay} 
                      onCheckedChange={(checked) => setSettings({ ...settings, autoPlay: checked })}
                    />
                  </div>

                  <Separator />

                  {/* Watch History */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="watch-history" className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Track Watch History
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Save your viewing progress and history
                      </p>
                    </div>
                    <Switch 
                      id="watch-history" 
                      checked={settings.watchHistory} 
                      onCheckedChange={(checked) => setSettings({ ...settings, watchHistory: checked })}
                    />
                  </div>

                  <Separator />

                  {/* Quality Preference */}
                  <div className="space-y-3">
                    <Label className="text-base flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Video Quality Preference
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {['auto', '480p', '720p', '1080p'].map((quality) => (
                        <Button
                          key={quality}
                          variant={settings.qualityPreference === quality ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSettings({ ...settings, qualityPreference: quality })}
                        >
                          {quality.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Download Quality */}
                  <div className="space-y-3">
                    <Label className="text-base flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download Quality
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['low', 'medium', 'high'].map((quality) => (
                        <Button
                          key={quality}
                          variant={settings.downloadQuality === quality ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSettings({ ...settings, downloadQuality: quality })}
                        >
                          {quality.charAt(0).toUpperCase() + quality.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Language */}
                  <div className="space-y-3">
                    <Label className="text-base flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Preferred Language
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'en', label: 'English' },
                        { value: 'jp', label: 'Japanese' },
                        { value: 'es', label: 'Spanish' },
                        { value: 'fr', label: 'French' }
                      ].map((lang) => (
                        <Button
                          key={lang.value}
                          variant={settings.language === lang.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSettings({ ...settings, language: lang.value })}
                        >
                          {lang.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button 
                      className="flex-1"
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Settings'
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleResetSettings}
                    >
                      Reset to Default
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Personalization Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Personalization
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of your experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Theme Selection */}
                  <div className="space-y-3">
                    <Label className="text-base">Theme Preference</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button 
                        variant={settings.theme === 'light' ? 'default' : 'outline'} 
                        size="sm" 
                        className="flex flex-col h-auto py-4"
                        onClick={() => setSettings({ ...settings, theme: 'light' })}
                      >
                        <Sun className="h-5 w-5 mb-2" />
                        <span className="text-xs">Light</span>
                      </Button>
                      <Button 
                        variant={settings.theme === 'dark' ? 'default' : 'outline'} 
                        size="sm" 
                        className="flex flex-col h-auto py-4"
                        onClick={() => setSettings({ ...settings, theme: 'dark' })}
                      >
                        <Moon className="h-5 w-5 mb-2" />
                        <span className="text-xs">Dark</span>
                      </Button>
                      <Button 
                        variant={settings.theme === 'system' ? 'default' : 'outline'} 
                        size="sm" 
                        className="flex flex-col h-auto py-4"
                        onClick={() => setSettings({ ...settings, theme: 'system' })}
                      >
                        <Monitor className="h-5 w-5 mb-2" />
                        <span className="text-xs">System</span>
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Volume Preference */}
                  <div className="space-y-3">
                    <Label htmlFor="volume" className="text-base flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Default Volume: {settings.defaultVolume}%
                    </Label>
                    <input 
                      type="range" 
                      id="volume"
                      min="0" 
                      max="100" 
                      value={settings.defaultVolume}
                      onChange={(e) => setSettings({ ...settings, defaultVolume: parseInt(e.target.value) })}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="pt-4">
                    <Button 
                      className="w-full"
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Personalization'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
