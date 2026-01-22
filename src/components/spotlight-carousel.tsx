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
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      {/* Title */}
                      <div className="z-20 transition-all duration-500 ease-in-out group-hover:scale-105 origin-bottom-left mb-1">
                        <div className="text-xs font-bold text-cyan-400 mb-1 uppercase tracking-wider drop-shadow-md">
                          #{index + 1} Spotlight
                        </div>
                        <h3 
                          className="font-bold text-white leading-tight drop-shadow-md line-clamp-2"
                          style={{ fontSize: titleSize }}
                        >
                          {anime.name}
                        </h3>
                      </div>

                      {/* Description */}
                      <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-in-out group-hover:grid-rows-[1fr] z-10">
                        <div className="overflow-hidden">
                          <div className="pt-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100 delay-100">
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
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
