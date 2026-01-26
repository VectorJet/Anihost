'use client';

import { useState, useEffect } from 'react';
import { getActiveUsers, sendHeartbeat } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ActiveUsers() {
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    const data = await getActiveUsers();
    setUsers(data);
  };

  useEffect(() => {
    // Send initial heartbeat
    sendHeartbeat();
    fetchUsers();

    // Heartbeat every 2 minutes
    const heartbeatInterval = setInterval(sendHeartbeat, 2 * 60 * 1000);
    // Fetch active users every 30 seconds
    const fetchInterval = setInterval(fetchUsers, 30 * 1000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(fetchInterval);
    };
  }, []);

  if (users.length === 0) return null;

  return (
    <div className="px-4 py-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Active Now ({users.length})
      </div>
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {users.map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="size-8 border-2 border-background">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} />
                    <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-background rounded-full" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs font-medium">{user.username}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
