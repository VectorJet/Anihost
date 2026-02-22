"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ProfileMenu } from "@/components/profile-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Home, 
  Captions, 
  Mic, 
  Flame, 
  Film, 
  Gamepad2,
  Tv, 
  Disc, 
  MonitorPlay, 
  Star,
  ChevronDown,
  ChevronUp,
  Shuffle
} from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ActiveUsers } from "./active-users"
import { Logo } from "@/components/logo"
import { getRandomAnime } from "@/lib/api"

const mainMenuItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Subbed Anime", url: "/subbed-anime", icon: Captions },
  { title: "Dubbed Anime", url: "/dubbed-anime", icon: Mic },
  { title: "Most Popular", url: "/most-popular", icon: Flame },
  { title: "Movies", url: "/movie", icon: Film },
  { title: "TV Series", url: "/tv", icon: Tv },
  { title: "OVAs", url: "/ova", icon: Disc },
  { title: "ONAs", url: "/ona", icon: MonitorPlay },
  { title: "Specials", url: "/special", icon: Star },
  { title: "Game", url: "/genre/game", icon: Gamepad2 },
]

interface AppSidebarProps {
  genres: string[];
  user?: any;
}

export function AppSidebar({ genres = [], user }: AppSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const router = useRouter();
  const initialGenres = genres.slice(0, 10);
  const additionalGenres = genres.slice(10);
  const hasMoreGenres = genres.length > 10;

  const handleRandomAnime = async () => {
    if (isLoadingRandom) return;
    setIsLoadingRandom(true);
    try {
      const anime = await getRandomAnime();
      if (anime && anime.id) {
        router.push(`/anime/${anime.id}`);
      } else {
        // Fallback or error handling
        console.error("No anime found");
      }
    } catch (error) {
      console.error("Failed to get random anime", error);
    } finally {
      setIsLoadingRandom(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="flex h-16 flex-row items-center justify-between border-b px-4">
        <Link href="/" className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
          <Logo className="h-6 w-auto" />
        </Link>
        <SidebarTrigger className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700" />
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleRandomAnime} disabled={isLoadingRandom}>
                    <Shuffle className={isLoadingRandom ? "animate-spin" : ""} />
                    <span>Random Anime</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-4 my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Genre</SidebarGroupLabel>
          <SidebarGroupContent>
             <SidebarMenu>
              <div className="grid grid-cols-2 gap-2 px-2">
                {initialGenres.map((genre: string) => (
                   <Link 
                     key={genre} 
                     href={`/genre/${genre.toLowerCase().replace(/ /g, '-')}`}
                     className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1 truncate"
                   >
                     {genre}
                   </Link>
                ))}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="col-span-2 grid grid-cols-2 gap-2 overflow-hidden"
                    >
                      {additionalGenres.map((genre: string) => (
                        <Link 
                          key={genre} 
                          href={`/genre/${genre.toLowerCase().replace(/ /g, '-')}`}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1 truncate"
                        >
                          {genre}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                {hasMoreGenres && (
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-primary font-medium py-1 flex items-center gap-1 hover:underline col-span-2"
                  >
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </motion.div>
                    {isExpanded ? `Show Less` : `Show All (${genres.length})`}
                  </button>
                )}
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ProfileMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
