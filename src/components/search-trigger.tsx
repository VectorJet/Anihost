'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppleSpotlight } from '@/components/ui/apple-spotlight';

export function SearchTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-5 w-5" />
      </Button>
      <AppleSpotlight isOpen={isOpen} handleClose={() => setIsOpen(false)} />
    </>
  );
}
