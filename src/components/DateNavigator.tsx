import { format, isToday, isTomorrow, isYesterday, addDays, subDays } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

function friendlyLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE");
}

const DateNavigator = ({ selectedDate, onDateChange }: DateNavigatorProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between"
    >
      <button
        onClick={() => onDateChange(subDays(selectedDate, 1))}
        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-secondary transition-all">
            <span className="text-sm font-display font-medium text-foreground">
              {friendlyLabel(selectedDate)}
            </span>
            <span className="text-xs text-muted-foreground font-body">
              {format(selectedDate, "MMM d")}
            </span>
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground/50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                onDateChange(date);
                setCalendarOpen(false);
              }
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <button
        onClick={() => onDateChange(addDays(selectedDate, 1))}
        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default DateNavigator;
