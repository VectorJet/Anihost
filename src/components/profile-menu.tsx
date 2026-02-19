'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, Settings, LogIn, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useTheme } from 'next-themes';
import { Separator } from '@/components/ui/separator';
import { AuthModal } from './auth-modal';
import { logout } from '@/lib/api';
import { useRouter } from 'next/navigation';

const SVGFilter = () => {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none">
      <filter id="blob">
        <feGaussianBlur stdDeviation="10" in="SourceGraphic" />
        <feColorMatrix
          values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -9"
          result="blob"
        />
        <feBlend in="SourceGraphic" in2="blob" />
      </filter>
    </svg>
  );
};

export function ProfileMenu({ user }: { user?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.refresh();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <SVGFilter />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              filter: 'blur(20px) url(#blob)',
              scaleX: 1.3,
              scaleY: 1.1,
              y: 20
            }}
            animate={{
              opacity: 1,
              filter: 'blur(0px) url(#blob)',
              scaleX: 1,
              scaleY: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              filter: 'blur(20px) url(#blob)',
              scaleX: 1.3,
              scaleY: 1.1,
              y: 20
            }}
            transition={{
              stiffness: 550,
              damping: 50,
              type: 'spring'
            }}
            className="absolute bottom-full left-0 mb-3 w-full max-w-[240px] z-50 origin-bottom-left"
          >
             <div className="flex flex-col gap-1 bg-white dark:bg-neutral-900 rounded-2xl p-2 shadow-xl border border-neutral-200 dark:border-neutral-800">
                {user ? (
                  <>
                    <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-900 dark:text-neutral-100">
                      <User className="size-4" />
                      <span className="font-medium">Profile</span>
                    </button>
                    {user.role === 'admin' && (
                      <button 
                        onClick={() => { router.push('/admin'); setIsOpen(false); }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-900 dark:text-neutral-100"
                      >
                        <Settings className="size-4" />
                        <span className="font-medium">Admin Panel</span>
                      </button>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                    >
                      <LogOut className="size-4" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { setIsAuthModalOpen(true); setIsOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-900 dark:text-neutral-100"
                  >
                    <LogIn className="size-4" />
                    <span className="font-medium">Login / Sign Up</span>
                  </button>
                )}
                
                <Separator className="my-1" />
                
                <div className="px-2 py-3 flex flex-col items-center">
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-3 text-center">Theme</p>
                  {mounted && (
                    <ThemeSwitcher
                      value={theme as "light" | "dark" | "system"}
                      onChange={setTheme}
                    />
                  )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="cursor-pointer group flex items-center gap-3 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors w-full"
      >
        <Avatar className="size-8 border-2 border-transparent group-hover:border-neutral-200 dark:group-hover:border-neutral-700 transition-all">
          <AvatarImage src={user ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}` : undefined} alt={user?.username || "Guest"} />
          <AvatarFallback>{user ? user.username.slice(0, 2).toUpperCase() : '?'}</AvatarFallback>
        </Avatar>
        <span className="flex-1 font-medium text-sm text-neutral-700 dark:text-neutral-200 truncate">
          {user ? user.username : 'Guest'}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`size-4 text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </div>
    </div>
  );
}
