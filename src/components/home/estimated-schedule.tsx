"use client";

import { useState, useEffect } from "react";
import { ScheduledAnime } from "@/types/anime";
import { getEstimatedSchedule } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Clock, CirclePlay } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EstimatedScheduleProps {
  initialSchedule?: ScheduledAnime[];
}

export function EstimatedSchedule({ initialSchedule = [] }: EstimatedScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [schedule, setSchedule] = useState<ScheduledAnime[]>(initialSchedule);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { 
        hour12: true, 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit" 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate date strip (e.g. today +/- days or just next 7 days)
  // Reference image shows a specific date selected "Sat Jan 24". 
  // Let's generate today + 6 days.
  const [dates, setDates] = useState<{ date: string; display: string; day: string }[]>([]);

  useEffect(() => {
    const d = new Date();
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const monthDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      arr.push({ date: dateStr, display: monthDate, day: dayName });
      d.setDate(d.getDate() + 1);
    }
    setDates(arr);
  }, []);

  // Fetch data when date changes
  useEffect(() => {
    // Skip initial fetch if we have initialSchedule and it's today
    // But simplicity: just fetch if selectedDate changes.
    // Ideally we pass today's schedule as prop to avoid first fetch.
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today && initialSchedule.length > 0 && schedule === initialSchedule) {
        return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getEstimatedSchedule(selectedDate);
        setSchedule(data as ScheduledAnime[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, initialSchedule]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold border-l-4 border-primary pl-3 text-foreground">
          Estimated Schedule
        </h2>
        <div className="bg-card px-3 py-1 rounded-full border shadow-sm flex items-center gap-2 text-sm font-mono font-medium text-primary">
             <Clock className="w-4 h-4" />
             {currentTime}
        </div>
      </div>

      <div className="bg-card/50 border rounded-xl overflow-hidden">
        {/* Date Strip */}
        <div className="flex items-center bg-card/80 border-b backdrop-blur-sm p-2 gap-2">
            {/* Arrows could be functional if we had more dates, for now static visual or just simple 7 day view */}
            {/* <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0">
                <ChevronLeft className="w-4 h-4" />
            </Button> */}
            
            <div className="flex-1 flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                {dates.map((item) => {
                    const isSelected = item.date === selectedDate;
                    return (
                        <button
                            key={item.date}
                            onClick={() => setSelectedDate(item.date)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[80px] px-3 py-2 rounded-lg transition-all text-sm",
                                isSelected 
                                    ? "bg-primary text-primary-foreground shadow-md scale-105 font-bold" 
                                    : "bg-background/50 hover:bg-accent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="text-xs opacity-80">{item.day}</span>
                            <span>{item.display}</span>
                        </button>
                    )
                })}
            </div>

            {/* <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0">
                <ChevronRight className="w-4 h-4" />
            </Button> */}
        </div>

        {/* Schedule List */}
        <div className="divide-y divide-border/50 max-h-[500px] overflow-y-auto custom-scrollbar">
            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading schedule...</div>
            ) : schedule.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No anime scheduled for this date.</div>
            ) : (
                schedule.map((item, index) => (
                    <Link 
                        key={`${item.id}-${index}`}
                        href={`/anime/${item.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors group"
                    >
                        <div className="w-16 text-right flex-shrink-0 text-sm font-mono text-muted-foreground group-hover:text-primary transition-colors">
                            {item.time}
                        </div>
                        <div className="w-1 h-12 bg-border rounded-full group-hover:bg-primary transition-colors relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-background border-2 border-muted-foreground rounded-full group-hover:border-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                {item.name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">{item.jname}</p>
                        </div>
                        <div className="flex-shrink-0">
                             <Button size="sm" variant="secondary" className="h-8 text-xs rounded-full">
                                <CirclePlay className="w-3 h-3 mr-1" />
                                Watch
                             </Button>
                        </div>
                    </Link>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
