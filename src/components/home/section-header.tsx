import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  href?: string;
  className?: string;
}

export function SectionHeader({ title, href, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h2 className="text-xl md:text-2xl font-bold border-l-4 border-primary pl-3 text-foreground">
        {title}
      </h2>
      {href && (
        <Link 
          href={href} 
          className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center transition-colors"
        >
          View More <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
