'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { deleteAllUsers, deleteUser, getAllUsers, type AdminUser } from '@/lib/api';
import { Loader2, Settings2, Trash2, Users } from 'lucide-react';

type UserSortBy = 'createdAt' | 'lastActiveAt' | 'username' | 'email' | 'role';
type UserSortOrder = 'asc' | 'desc';

const SORT_OPTIONS: Array<{ label: string; value: UserSortBy }> = [
  { label: 'Created Date', value: 'createdAt' },
  { label: 'Last Active', value: 'lastActiveAt' },
  { label: 'Username', value: 'username' },
  { label: 'Email', value: 'email' },
  { label: 'Role', value: 'role' },
];

export function UserManagement() {
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<UserSortBy>('createdAt');
  const [order, setOrder] = useState<UserSortOrder>('desc');

  const query = useMemo(() => search.trim(), [search]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await getAllUsers({ sortBy, order, search: query || undefined });
      setUsers(rows);
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
  }, [order, query, sortBy, toast]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadUsers();
    }, 250);

    return () => window.clearTimeout(timerId);
  }, [loadUsers]);

  async function handleDeleteUser(userId: string, username: string) {
    const confirmed = window.confirm(`Delete user "${username}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingUserId(userId);
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        toast({
          title: 'User deleted',
          description: `${username} has been removed.`,
        });
        await loadUsers();
      } else {
        toast({
          title: 'Delete failed',
          description: result.message || 'Unable to delete user',
          variant: 'destructive',
        });
      }
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleDeleteAllUsers() {
    const confirmation = window.prompt('Type DELETE ALL to remove all non-admin users.');
    if (confirmation !== 'DELETE ALL') return;

    setIsDeletingAll(true);
    try {
      const result = await deleteAllUsers(false);
      if (result.success) {
        toast({
          title: 'Bulk delete complete',
          description: `Deleted ${result.deletedCount || 0} user(s).`,
        });
        await loadUsers();
      } else {
        toast({
          title: 'Bulk delete failed',
          description: result.message || 'Unable to delete users',
          variant: 'destructive',
        });
      }
    } finally {
      setIsDeletingAll(false);
    }
  }

  const formatDate = (value: string | Date | null) => {
    if (!value) return 'Never';
    return new Date(value).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Sort, review, and manage long user lists
            </CardDescription>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search username or email"
              className="md:col-span-2"
            />

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as UserSortBy)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>

            <select
              value={order}
              onChange={(event) => setOrder(event.target.value as UserSortOrder)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="desc">Order: Descending</option>
              <option value="asc">Order: Ascending</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Showing {users.length} user(s)
          </div>

          <Button
            variant="destructive"
            onClick={handleDeleteAllUsers}
            disabled={isDeletingAll}
          >
            {isDeletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete All Users
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.username}</p>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="text-xs text-muted-foreground">
                      <span>Created: {formatDate(user.createdAt)}</span>
                      <span className="mx-2">|</span>
                      <span>Last active: {formatDate(user.lastActiveAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                    >
                      <Settings2 className="mr-2 h-4 w-4" />
                      User Settings
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      disabled={deletingUserId === user.id}
                    >
                      {deletingUserId === user.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No users found with current filters.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
