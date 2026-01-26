import Link from "next/link";
import { cn } from "@/lib/utils";

interface GenresProps {
  genres: string[];
}

export function Genres({ genres }: GenresProps) {
  // Define colors for some popular genres to make the list more vibrant
  const getGenreColor = (genre: string) => {
    const colors: Record<string, string> = {
      Action: "text-red-400 border-red-400/20 hover:bg-red-400/10",
      Adventure: "text-green-400 border-green-400/20 hover:bg-green-400/10",
      Comedy: "text-yellow-400 border-yellow-400/20 hover:bg-yellow-400/10",
      Drama: "text-purple-400 border-purple-400/20 hover:bg-purple-400/10",
      Fantasy: "text-blue-400 border-blue-400/20 hover:bg-blue-400/10",
      "Sci-Fi": "text-cyan-400 border-cyan-400/20 hover:bg-cyan-400/10",
      Romance: "text-pink-400 border-pink-400/20 hover:bg-pink-400/10",
      Horror: "text-gray-400 border-gray-400/20 hover:bg-gray-400/10",
    };
    return colors[genre] || "text-muted-foreground border-border hover:bg-accent hover:text-foreground";
  };

  return (
    <div className="bg-card/50 rounded-xl p-4 border">
      <h3 className="font-bold text-lg mb-4 text-primary">Genres</h3>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Link
            key={genre}
            href={`/genre/${genre.toLowerCase().replace(/ /g, "-")}`}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              getGenreColor(genre)
            )}
          >
            {genre}
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t text-center">
        <Link 
            href="/genre" 
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
            View All Genres
        </Link>
      </div>
    </div>
  );
}
