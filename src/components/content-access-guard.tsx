'use client';

import { useEffect, useState } from 'react';
import { checkContentAccess } from '@/lib/api';
import { ContentBlock } from './content-block';

interface ContentAccessGuardProps {
  animeId: string;
  title: string;
  genres: string[];
  rating?: string;
  is18Plus?: boolean;
  children: React.ReactNode;
}

export function ContentAccessGuard({ animeId, title, genres, rating, is18Plus, children }: ContentAccessGuardProps) {
  const [accessCheck, setAccessCheck] = useState<{ allowed: boolean; reason?: string } | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      const result = await checkContentAccess(animeId, title, genres, rating, is18Plus);
      setAccessCheck(result);
      setIsChecking(false);
    }
    checkAccess();
  }, [animeId, title, genres, rating, is18Plus]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (accessCheck && !accessCheck.allowed) {
    return <ContentBlock reason={accessCheck.reason} />;
  }

  return <>{children}</>;
}
