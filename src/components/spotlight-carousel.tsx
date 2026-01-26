"use client"

import * as React from "react"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { Play, Info } from "lucide-react"
import Link from "next/link"
import { SpotlightAnime } from "@/types/anime"

interface SpotlightCarouselProps {
  animes: SpotlightAnime[]
  aspectRatio?: string
  width?: string
  borderRadius?: string
  gap?: string
  titleSize?: string
  titlePosition?: { bottom?: string; left?: string; right?: string; top?: string }
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down"
  autoplayDelay?: number
}

export function SpotlightCarousel({ 
  animes, 
  aspectRatio = "16/9",
  width = "100%",
  borderRadius = "0.5rem",
  gap = "0.25rem",
  titleSize = "1.25rem",
  titlePosition = { bottom: "1rem", left: "1rem" },
  objectFit = "cover",
  autoplayDelay = 4000
}: SpotlightCarouselProps) {
  const plugin = React.useRef(
    Autoplay({ delay: autoplayDelay, stopOnInteraction: true })
  )

  // Extract horizontal position to preserve user preference while we control vertical animation
  const { left, right } = titlePosition || { left: "1rem", right: undefined };

  return (
    <Carousel 
      className="w-full" 
      style={{ width }}
      plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {animes.map((anime, index) => (
          <CarouselItem key={`${anime.id}-${index}`} className="basis-full md:basis-full lg:basis-full">
            <div style={{ padding: gap }}>
              <Card className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden group cursor-pointer" style={{ borderRadius }}>
                <CardContent className="p-0 relative">
                  <div style={{ aspectRatio }} className="relative w-full">
                    <Image
                      src={anime.poster}
                      alt={anime.name}
                      fill
                      style={{ objectFit }}
                    />
                    {/* Gradient Overlay - Darkens on hover for "vigilance" */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-all duration-500 ease-in-out group-hover:from-black/95 group-hover:via-black/70 pointer-events-none" />
                    
                    {/* Content Container */}
                    <div className="absolute inset-0 flex flex-col justify-between p-6">
                      {/* Title at Top */}
                      <div className="z-20">
                        <h3 
                          className="font-bold text-white leading-tight drop-shadow-md line-clamp-1"
                          style={{ fontSize: titleSize }}
                        >
                          {anime.name}
                        </h3>
                      </div>

                      {/* Bottom Section */}
                      <div className="z-20 flex flex-col items-start gap-2">
                         {/* Spotlight Number */}
                        <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider drop-shadow-md">
                          #{index + 1} Spotlight
                        </div>

                        {/* Buttons - Always Visible */}
                        <div className="z-30 flex gap-3 pointer-events-auto">
                           <Button asChild className="h-9 rounded-full bg-white text-black hover:bg-gray-200 font-bold px-6 shadow-lg border-0">
                             <Link href={`/watch/${anime.id}`}>
                               <Play className="w-4 h-4 mr-2 fill-current" /> Watch
                             </Link>
                           </Button>
                           
                           <Button asChild className="h-9 liquid-glass text-white font-medium px-6 border-0 shadow-lg">
                             <Link href={`/anime/${anime.id}`}>
                               Details <Info className="w-4 h-4 ml-2" />
                             </Link>
                           </Button>
                        </div>

                        {/* Description */}
                        <div className="w-full grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-in-out group-hover:grid-rows-[1fr] z-10">
                          <div className="overflow-hidden">
                            <div className="pt-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100 delay-100">
                              <p className="text-gray-200 text-sm md:text-base line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow-md">
                                {anime.description}
                              </p>
                              <div className="flex gap-3 mt-3 text-xs md:text-sm font-medium text-gray-300">
                                <span className="bg-white/10 px-2 py-1 rounded backdrop-blur-sm">Sub: {anime.episodes.sub}</span>
                                {anime.episodes.dub > 0 && (
                                  <span className="bg-white/10 px-2 py-1 rounded backdrop-blur-sm">Dub: {anime.episodes.dub}</span>
                                )}
                                <span className="bg-primary/80 text-white px-2 py-1 rounded backdrop-blur-sm">Rank #{anime.rank}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      
      {/* Liquid Glass Effect Assets */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
            <feDisplacementMap in="SourceGraphic" in2="blurred" scale="77" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <style jsx global>{`
        .liquid-glass {
          --shadow-offset: 0;
          --shadow-blur: 20px;
          --shadow-spread: -5px;
          --shadow-color: rgba(255, 255, 255, 0.7);
          --tint-color: 255, 255, 255;
          --tint-opacity: 0.4;
          --frost-blur: 2px;
          
          position: relative;
          isolation: isolate;
          border-radius: 9999px;
          overflow: hidden;
          background: transparent;
        }
        
        .liquid-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -2;
          border-radius: 9999px;
          box-shadow: inset var(--shadow-offset) var(--shadow-offset) var(--shadow-blur) var(--shadow-spread) var(--shadow-color);
          background-color: rgba(var(--tint-color), var(--tint-opacity));
        }
        
        .liquid-glass::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          border-radius: 9999px;
          backdrop-filter: blur(var(--frost-blur));
          filter: url(#glass-distortion);
          -webkit-backdrop-filter: blur(var(--frost-blur));
          -webkit-filter: url("#glass-distortion");
        }
      `}</style>
    </Carousel>
  )
}
