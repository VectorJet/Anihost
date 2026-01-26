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
  ChevronUp
} from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

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
  const initialGenres = genres.slice(0, 10);
  const additionalGenres = genres.slice(10);
  const hasMoreGenres = genres.length > 10;

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center justify-between p-4">
        <SidebarTrigger className="w-full rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700" />
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
