import { useState, useMemo } from "react";
import { format, startOfMonth, startOfWeek, addDays, isSameMonth, isToday, addMonths, subMonths, differenceInCalendarDays, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { usePeriodLogs, useTogglePeriodDay, usePeriodSymptoms, useToggleSymptom, useAllPeriodLogs } from "@/hooks/useHealth";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";

const SYMPTOMS = [
  { key: "cramps", emoji: "😣", label: "Cramps" },
  { key: "headache", emoji: "🤕", label: "Headache" },
  { key: "fatigue", emoji: "😴", label: "Fatigue" },
  { key: "bloating", emoji: "🫧", label: "Bloating" },
  { key: "mood_swings", emoji: "🎭", label: "Mood swings" },
  { key: "acne", emoji: "😖", label: "Acne" },
  { key: "back_pain", emoji: "🦴", label: "Back pain" },
  { key: "nausea", emoji: "🤢", label: "Nausea" },
];

const DOUBLE_TAP_MS = 300;

const DayButton = ({
  day,
  inMonth,
  today,
  isPeriod,
  isFertile,
  isOvulation,
  hasSymptoms,
  isSelected,
  onTap,
  onDoubleTap,
}: {
  day: Date;
  inMonth: boolean;
  today: boolean;
  isPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  hasSymptoms: boolean;
  isSelected: boolean;
  onTap: () => void;
  onDoubleTap: () => void;
}) => {
  const [lastTap, setLastTap] = useState(0);

  const handleClick = () => {
    if (!inMonth) return;
    const now = Date.now();
    if (now - lastTap < DOUBLE_TAP_MS) {
      setLastTap(0);
      onDoubleTap();
    } else {
      setLastTap(now);
      onTap();
    }
  };

  const bgClass = isPeriod
    ? "bg-period text-period-foreground font-medium"
    : isFertile
      ? "bg-fertile text-fertile-foreground"
      : inMonth
        ? "text-foreground/70"
        : "text-muted-foreground";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!inMonth}
      aria-pressed={isPeriod}
      aria-label={`${format(day, "MMMM d")}${isPeriod ? ", period logged" : ""}${isOvulation ? ", predicted ovulation" : isFertile ? ", fertile window" : ""}${hasSymptoms ? ", symptoms logged" : ""}`}
      className={`relative flex aspect-square select-none items-center justify-center rounded-full text-[11px] font-body transition-all touch-manipulation border-2
        ${!inMonth ? "cursor-default opacity-20 border-transparent" : "cursor-pointer hover:bg-secondary/60 border-transparent"}
        ${today ? "ring-1 ring-primary/30" : ""}
        ${isSelected ? "border-primary ring-2 ring-primary" : "border-transparent"}
        ${bgClass}
      `}
    >
      {format(day, "d")}
      {isOvulation && (
        <span className="pointer-events-none absolute -top-0.5 -right-0.5 text-[9px] leading-none">🌼</span>
      )}
      {(isPeriod || hasSymptoms) && (
        <span className={`absolute -bottom-0.5 h-1 w-1 rounded-full ${isPeriod ? "bg-period-active" : "bg-accent-foreground/40"}`} />
      )}
    </button>
  );
};

const PeriodTracker = () => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSymptomsOpen, setIsSymptomsOpen] = useState(false);
  const monthStr = format(viewDate, "yyyy-MM");
  const { data: logs = [] } = usePeriodLogs(monthStr);
  const { data: allLogs = [] } = useAllPeriodLogs();
  const { data: symptoms = [] } = usePeriodSymptoms(monthStr);
  const toggleDay = useTogglePeriodDay();
  const toggleSymptom = useToggleSymptom();

  const periodDates = new Set(logs.map((log) => log.date));

  // Compute fertile window + ovulation across the visible month using all logged cycles
  const { fertileDates, ovulationDates, cycleLength } = useMemo(() => {
    const allSet = new Set(allLogs.map((l) => l.date));
    const sorted = [...allSet].sort();
    // Cycle starts: a logged day whose previous day is not logged
    const cycleStarts: Date[] = sorted
      .filter((d) => {
        const prev = format(addDays(parseISO(d), -1), "yyyy-MM-dd");
        return !allSet.has(prev);
      })
      .map((d) => parseISO(d));

    // Average cycle length from consecutive starts (clamp 21-40)
    let cycleLen = 28;
    if (cycleStarts.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < cycleStarts.length; i++) {
        const g = differenceInCalendarDays(cycleStarts[i], cycleStarts[i - 1]);
        if (g >= 21 && g <= 40) gaps.push(g);
      }
      if (gaps.length) cycleLen = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
    }

    const fertile = new Set<string>();
    const ovulation = new Set<string>();
    if (cycleStarts.length === 0) {
      return { fertileDates: fertile, ovulationDates: ovulation, cycleLength: cycleLen };
    }

    // Project cycle starts forward and backward to cover the visible month
    const monthStart = startOfMonth(viewDate);
    const monthEnd = addDays(startOfMonth(addMonths(viewDate, 1)), -1);
    const lastStart = cycleStarts[cycleStarts.length - 1];

    // Build all relevant cycle starts (logged + predicted) from earliest known up to monthEnd + cycleLen
    const allStarts: Date[] = [...cycleStarts];
    let next = addDays(lastStart, cycleLen);
    while (next <= addDays(monthEnd, cycleLen)) {
      allStarts.push(next);
      next = addDays(next, cycleLen);
    }

    for (const start of allStarts) {
      const ov = addDays(start, -14);
      // Fertile window: ovulation - 3 to ovulation + 1 (5 days)
      for (let offset = -3; offset <= 1; offset++) {
        const d = addDays(ov, offset);
        if (d >= addDays(monthStart, -7) && d <= addDays(monthEnd, 7)) {
          fertile.add(format(d, "yyyy-MM-dd"));
        }
      }
      ovulation.add(format(ov, "yyyy-MM-dd"));
    }

    return { fertileDates: fertile, ovulationDates: ovulation, cycleLength: cycleLen };
  }, [allLogs, viewDate]);


  const monthStart = startOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const days: Date[] = [];
  let cursor = calStart;

  while (days.length < 42) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  while (days.length > 35) {
    const lastWeek = days.slice(-7);
    if (lastWeek.every((day) => !isSameMonth(day, viewDate))) {
      days.splice(-7);
    } else {
      break;
    }
  }

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];
  const sortedDates = [...periodDates].sort();

  const symptomsByDate = new Map<string, Set<string>>();
  symptoms.forEach((symptom) => {
    if (!symptomsByDate.has(symptom.date)) {
      symptomsByDate.set(symptom.date, new Set());
    }
    symptomsByDate.get(symptom.date)?.add(symptom.symptom);
  });

  const selectedSymptoms = selectedDate ? symptomsByDate.get(selectedDate) || new Set() : new Set();
  const selectedDateLabel = selectedDate ? format(new Date(`${selectedDate}T00:00:00`), "MMM d") : null;

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsSymptomsOpen(false);
  };

  const handleTogglePeriod = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsSymptomsOpen(false);
    toggleDay.mutate({ date: dateStr });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-display font-medium text-foreground">
            🌸 Period Tracker
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[70px] text-center text-[11px] font-body text-muted-foreground">
              {format(viewDate, "MMM yyyy")}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mb-1 grid grid-cols-7">
          {weekdays.map((weekday, idx) => (
            <div key={idx} className="py-0.5 text-center text-[9px] font-body uppercase text-muted-foreground/50">
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, viewDate);
            const today = isToday(day);
            const isPeriod = periodDates.has(dateStr);
            const hasSymptoms = symptomsByDate.has(dateStr);
            const isSelected = selectedDate === dateStr;

            return (
              <DayButton
                key={dateStr}
                day={day}
                inMonth={inMonth}
                today={today}
                isPeriod={isPeriod}
                hasSymptoms={hasSymptoms}
                isSelected={isSelected}
                onTap={() => handleSelectDate(dateStr)}
                onDoubleTap={() => handleTogglePeriod(dateStr)}
              />
            );
          })}
        </div>

        <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
          {sortedDates.length > 0 && (
            <p className="text-[11px] font-body text-muted-foreground">
              {sortedDates.length} day{sortedDates.length !== 1 ? "s" : ""} logged this month
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-[11px] font-body text-muted-foreground">
              {selectedDateLabel ? `Selected ${selectedDateLabel}` : "Tap a day to select it"}
            </p>
            <button
              type="button"
              onClick={() => selectedDate && setIsSymptomsOpen(true)}
              disabled={!selectedDate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-secondary/50 px-3 py-2 text-[11px] font-body font-medium text-foreground transition-all hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Symptoms
            </button>
          </div>
        </div>

        <p className="mt-2 text-[10px] font-body italic text-muted-foreground/40">
          Double-tap a day to log period · tap to select, then use + Symptoms
        </p>
      </div>

      <Drawer open={isSymptomsOpen} onOpenChange={setIsSymptomsOpen}>
        <DrawerContent className="rounded-t-[20px] border-t border-border bg-card pb-6">
          <DrawerHeader className="relative pb-2">
            <DrawerTitle className="text-base font-display font-medium text-foreground">
              {selectedDateLabel} — Symptoms
            </DrawerTitle>
            <DrawerClose asChild>
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="px-4 pt-2">
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((symptom) => {
                const active = selectedSymptoms.has(symptom.key);

                return (
                  <button
                    key={symptom.key}
                    type="button"
                    onClick={() => toggleSymptom.mutate({ date: selectedDate!, symptom: symptom.key })}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-body transition-all
                      ${active
                        ? "bg-primary/15 text-primary ring-1 ring-primary/30 font-medium"
                        : "bg-secondary/40 text-muted-foreground hover:bg-secondary/70"
                      }`}
                  >
                    <span>{symptom.emoji}</span>
                    <span>{symptom.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedDate && periodDates.has(selectedDate) && (
              <p className="mt-4 text-[10px] font-body italic text-period-active">
                🌸 Period logged for this day
              </p>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
};

export default PeriodTracker;
