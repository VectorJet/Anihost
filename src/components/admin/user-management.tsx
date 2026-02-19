'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAllUsers, updateUserParentalControls } from '@/lib/api';
import { Shield, Users, Loader2, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: Date;
  lastActiveAt: Date | null;
  settings: {
    userId: string;
    safeMode: boolean;
    ageRestriction: boolean;
    explicitContent: boolean;
  };
}

export function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (userId: string, field: 'safeMode' | 'ageRestriction' | 'explicitContent', value: boolean) => {
    setSavingUserId(userId);
    
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updatedControls = {
      safeMode: user.settings.safeMode,
      ageRestriction: user.settings.ageRestriction,
      explicitContent: user.settings.explicitContent,
      [field]: value,
    };

    try {
      const result = await updateUserParentalControls(userId, updatedControls);
      
      if (result.success) {
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, settings: { ...u.settings, ...updatedControls } }
            : u
        ));
        
        toast({
          title: 'Success',
          description: `Parental controls updated for ${user.username}`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to update parental controls',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating parental controls:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while updating parental controls',
        variant: 'destructive',
      });
    } finally {
      setSavingUserId(null);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <CardTitle>User Management</CardTitle>
          </div>
          <CardDescription>
            Manage parental controls for all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total Users: {users.length}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{user.username}</CardTitle>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                  <CardDescription>{user.email}</CardDescription>
                  <div className="text-xs text-muted-foreground">
                    Last active: {formatDate(user.lastActiveAt)}
                  </div>
                </div>
                {savingUserId === user.id && (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  Parental Controls
                </div>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor={`safe-mode-${user.id}`} className="text-sm font-medium">
                        Safe Mode
                      </Label>
                      <div className="text-xs text-muted-foreground">
                        Block R+ and mature content
                      </div>
                    </div>
                    <Switch
                      id={`safe-mode-${user.id}`}
                      checked={user.settings.safeMode}
                      onCheckedChange={(checked) => handleToggle(user.id, 'safeMode', checked)}
                      disabled={savingUserId === user.id}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor={`age-restriction-${user.id}`} className="text-sm font-medium">
                        Age Restriction
                      </Label>
                      <div className="text-xs text-muted-foreground">
                        Restrict to 13+ content
                      </div>
                    </div>
                    <Switch
                      id={`age-restriction-${user.id}`}
                      checked={user.settings.ageRestriction}
                      onCheckedChange={(checked) => handleToggle(user.id, 'ageRestriction', checked)}
                      disabled={savingUserId === user.id}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor={`explicit-content-${user.id}`} className="text-sm font-medium">
                        Explicit Content
                      </Label>
                      <div className="text-xs text-muted-foreground">
                        Allow 18+ content
                      </div>
                    </div>
                    <Switch
                      id={`explicit-content-${user.id}`}
                      checked={user.settings.explicitContent}
                      onCheckedChange={(checked) => handleToggle(user.id, 'explicitContent', checked)}
                      disabled={savingUserId === user.id}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    {user.settings.safeMode ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <X className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span>Safe Mode</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {user.settings.ageRestriction ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <X className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span>Age Restricted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {user.settings.explicitContent ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <X className="w-3 h-3 text-red-500" />
                    )}
                    <span>Explicit Allowed</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
