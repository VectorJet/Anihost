'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Player } from './player';
import { getAnimeEpisodeServers, getEpisodeSources } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WatchContainerProps {
  anime: any;
  episodes: any[];
  initialEpisodeId: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function WatchContainer({ anime, episodes, initialEpisodeId }: WatchContainerProps) {
  const [currentEpisodeId, setCurrentEpisodeId] = useState(initialEpisodeId);
  const [server, setServer] = useState("megacloud");
  const [category, setCategory] = useState<"sub" | "dub" | "raw">("sub");
  
  const [serversData, setServersData] = useState<any>(null);
  const [sourceData, setSourceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const prevServer = useRef(server);
  const prevCategory = useRef(category);

  // Debounced fetch for episode changes
  const fetchEpisodeData = useCallback(async (episodeId: string, srv: string, cat: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch servers first
      const servers = await getAnimeEpisodeServers(episodeId);
      if (!servers || (!servers.sub?.length && !servers.dub?.length)) {
        setError('No servers available. Try again in a moment.');
        setLoading(false);
        return;
      }
      setServersData(servers);
      
      // Small delay between requests to avoid rate limiting
      await delay(300);
      
      // Then fetch source
      const source = await getEpisodeSources(episodeId, srv, cat);
      if (!source) {
        setError('Stream unavailable. Try a different server.');
      }
      setSourceData(source);
    } catch (err) {
      console.error(err);
      setError('Failed to load. Please wait and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when episode changes (debounced)
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      fetchEpisodeData(currentEpisodeId, server, category);
    }, 200);
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [currentEpisodeId, fetchEpisodeData]);

  // Fetch source only when server/category changes (not on initial mount)
  useEffect(() => {
    // Skip initial mount - episode effect handles it
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only run if server or category actually changed
    if (prevServer.current === server && prevCategory.current === category) {
      return;
    }
    
    prevServer.current = server;
    prevCategory.current = category;
    
    if (!serversData) return;
    
    const fetchSource = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getEpisodeSources(currentEpisodeId, server, category);
        if (!data) {
          setError('Stream unavailable for this server.');
        }
        setSourceData(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load stream.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSource();
  }, [server, category, serversData, currentEpisodeId]);

  const currentEpisode = episodes.find(e => e.episodeId === currentEpisodeId);
  const currentEpisodeIndex = episodes.findIndex(e => e.episodeId === currentEpisodeId);
  
  const hasPrevEpisode = currentEpisodeIndex > 0;
  const hasNextEpisode = currentEpisodeIndex < episodes.length - 1;

  const handlePrevEpisode = () => {
    if (hasPrevEpisode) {
      setCurrentEpisodeId(episodes[currentEpisodeIndex - 1].episodeId);
    }
  };

  const handleNextEpisode = () => {
    if (hasNextEpisode) {
      setCurrentEpisodeId(episodes[currentEpisodeIndex + 1].episodeId);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
      <div className="space-y-4">
        {/* Player */}
        <div className="w-full aspect-video bg-muted rounded-xl overflow-hidden shadow-lg border border-border relative">
          {loading ? (
             <div className="absolute inset-0 z-20 bg-black flex items-center justify-center text-white/80 animate-pulse">
               Loading stream...
             </div>
          ) : null}
          
          {error ? (
             <div className="w-full h-full flex items-center justify-center text-destructive bg-card flex-col gap-2 p-4">
               <p>{error}</p>
               <Button variant="outline" size="sm" onClick={() => fetchEpisodeData(currentEpisodeId, server, category)}>
                 Retry
               </Button>
             </div>
          ) : sourceData && sourceData.link ? (
              <Player 
                 key={currentEpisodeId}
                 url={sourceData.link.file} 
                 referer={sourceData.referer} 
                 subtitles={sourceData.tracks}
                 poster={anime.anime.info.poster}
                 intro={sourceData.intro}
                 outro={sourceData.outro}
                 onPrevEpisode={handlePrevEpisode}
                 onNextEpisode={handleNextEpisode}
                 hasPrevEpisode={hasPrevEpisode}
                 hasNextEpisode={hasNextEpisode}
                 animeId={anime.anime.info.id}
                 animeName={anime.anime.info.name}
                 episodeId={currentEpisodeId}
                 episodeNumber={currentEpisode?.number}
                 genres={anime.anime.moreInfo.genres}
              />

          ) : sourceData ? (
             <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-card">
               Stream unavailable for this server
             </div>
          ) : !loading && (
             <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-card">
               Select an episode to play
             </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-card border border-border rounded-lg shadow-sm">
            <div>
                <h2 className="text-lg font-bold line-clamp-1">
                    <span className="text-primary mr-2">Ep {currentEpisode?.number}</span> 
                    {currentEpisode?.title}
                </h2>
            </div>
            <div className="flex gap-2">
                <div className="flex gap-1 bg-muted p-1 rounded-md">
                    {(['sub', 'dub', 'raw'] as const).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={cn(
                                "px-3 py-1 rounded-sm text-xs font-bold transition-all uppercase",
                                category === cat ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            disabled={!serversData?.[cat]?.length}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        {/* Server List */}
        {serversData?.[category] && serversData[category].length > 0 && (
            <div className="p-4 bg-card border border-border rounded-lg space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Servers</div>
                <div className="flex flex-wrap gap-2">
                    {serversData[category].map((srv: any) => (
                        <Button 
                            key={srv.name} 
                            variant={server === srv.name ? "default" : "outline"}
                            size="sm"
                            onClick={() => setServer(srv.name)}
                            className="h-8"
                        >
                            {srv.name}
                        </Button>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Episode List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden max-h-[600px] flex flex-col shadow-sm">
         <div className="p-4 border-b border-border font-bold text-lg bg-muted/30">Episodes</div>
         <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
             <div className="grid grid-cols-1 gap-1">
                 {episodes.map((ep: any) => (
                     <button
                        key={ep.episodeId}
                        onClick={() => setCurrentEpisodeId(ep.episodeId)}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-md text-left transition-all hover:bg-accent group",
                            currentEpisodeId === ep.episodeId 
                                ? "bg-primary/10 text-primary hover:bg-primary/15 border-l-2 border-primary" 
                                : "text-muted-foreground border-l-2 border-transparent"
                        )}
                     >
                        <span className={cn(
                            "font-mono text-sm w-8 text-center bg-muted rounded py-0.5 group-hover:bg-background transition-colors",
                            currentEpisodeId === ep.episodeId && "bg-background text-primary"
                        )}>
                            {ep.number}
                        </span>
                        <span className="truncate text-sm font-medium flex-1">{ep.title}</span>
                     </button>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
}
