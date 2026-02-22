'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerHealth, type ServerHealth } from '@/lib/api';
import { Activity, Database, HardDrive, Loader2, RefreshCcw, Users } from 'lucide-react';

function formatBytes(value: number | null) {
  if (value == null || value < 0) return 'N/A';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function ServerHealthPanel() {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadHealth();
  }, []);

  async function loadHealth() {
    setIsLoading(true);
    try {
      const snapshot = await getServerHealth();
      setHealth(snapshot);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardContent className="space-y-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">Unable to load server health.</p>
          <Button variant="outline" onClick={loadHealth}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Server Health</CardTitle>
            <CardDescription>Live infrastructure and stream activity snapshot</CardDescription>
          </div>
          <Button variant="outline" onClick={loadHealth}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Active Users
            </div>
            <p className="text-2xl font-semibold">{health.activeUsers}</p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              Active Streams
            </div>
            <p className="text-2xl font-semibold">{health.activeStreams}</p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Total Users
            </div>
            <p className="text-2xl font-semibold">{health.totalUsers}</p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              DB Provider
            </div>
            <p className="text-2xl font-semibold">{health.storage.dbProvider}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storage</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              Database File
            </p>
            <p className="font-semibold">{formatBytes(health.storage.databaseBytes)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm text-muted-foreground">Disk Total</p>
            <p className="font-semibold">{formatBytes(health.storage.diskTotalBytes)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm text-muted-foreground">Disk Free</p>
            <p className="font-semibold">{formatBytes(health.storage.diskFreeBytes)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Process Memory</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm text-muted-foreground">RSS</p>
            <p className="font-semibold">{formatBytes(health.memory.rssBytes)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm text-muted-foreground">Heap Used</p>
            <p className="font-semibold">{formatBytes(health.memory.heapUsedBytes)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="mb-2 text-sm text-muted-foreground">Heap Total</p>
            <p className="font-semibold">{formatBytes(health.memory.heapTotalBytes)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
