import { useState } from "react";
import { format, startOfMonth, startOfWeek, addDays, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, ChevronLeft, ChevronRight, Calendar, List } from "lucide-react";
import {
  useMedications,
  useAddMedication,
  useDeleteMedication,
  useTodayMedLogs,
  useToggleMedLog,
  useMedLogsByMonth,
  type Medication,
  type MedicationLog,
} from "@/hooks/useHealth";

const todayStr = () => new Date().toISOString().split("T")[0];

const EMOJI_OPTIONS = ["💊", "💉", "🩹", "🧴", "🌿", "☕"];

type MedView = "today" | "calendar";

const MedicationTracker = () => {
  const { data: meds = [] } = useMedications();
  const { data: todayLogs = [] } = useTodayMedLogs();
  const addMed = useAddMedication();
  const deleteMed = useDeleteMedication();
  const toggleLog = useToggleMedLog();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💊");
  const [view, setView] = useState<MedView>("today");
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);

  const monthStr = format(viewDate, "yyyy-MM");
  const { data: monthLogs = [] } = useMedLogsByMonth(monthStr);

  const takenIds = new Set(todayLogs.map((l) => l.medication_id));

  const handleAdd = () => {
    if (!newName.trim()) return;
    addMed.mutate({ name: newName.trim(), emoji: newEmoji });
    setNewName("");
    setNewEmoji("💊");
    setShowAdd(false);
  };

  const allTaken = meds.length > 0 && meds.every((m) => takenIds.has(m.id));

  // Calendar logic
  const monthStart = startOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = calStart;
  while (days.length < 42) {
    days.push(d);
    d = addDays(d, 1);
  }
  while (days.length > 35) {
    const lastWeek = days.slice(-7);
    if (lastWeek.every((day) => !isSameMonth(day, viewDate))) {
      days.splice(-7);
    } else break;
  }

  const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

  // Build maps
  const dateTakenMap = new Map<string, number>();
  const dateLogsMap = new Map<string, MedicationLog[]>();
  monthLogs.forEach((log) => {
    dateTakenMap.set(log.date, (dateTakenMap.get(log.date) || 0) + 1);
    if (!dateLogsMap.has(log.date)) dateLogsMap.set(log.date, []);
    dateLogsMap.get(log.date)!.push(log);
  });

  // Build med lookup
  const medById = new Map<string, Medication>();
  meds.forEach((m) => medById.set(m.id, m));

  // Meds taken on selected calendar date
  const selectedDateLogs = selectedCalDate ? dateLogsMap.get(selectedCalDate) || [] : [];
  const selectedDateMeds = selectedDateLogs
    .map((log) => medById.get(log.medication_id))
    .filter(Boolean) as Medication[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-3"
    >
      {/* Today's checklist card */}
      <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-display font-medium text-foreground flex items-center gap-2">
            Today's Meds
            {allTaken && meds.length > 0 && (
              <span className="text-[10px] font-body text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                all done ✓
              </span>
            )}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setView(view === "today" ? "calendar" : "today"); setSelectedCalDate(null); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              title={view === "today" ? "Calendar view" : "List view"}
            >
              {view === "today" ? <Calendar className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Add medication form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="space-y-2 p-3 rounded-xl bg-secondary/40">
                <div className="flex gap-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="Medication name..."
                    className="flex-1 bg-background/60 rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-body font-medium disabled:opacity-40 transition-opacity"
                  >
                    Add
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setNewEmoji(e)}
                      className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all
                        ${newEmoji === e ? "bg-primary/15 ring-1 ring-primary/30 scale-110" : "hover:bg-secondary"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Medication list */}
        {meds.length > 0 ? (
          <div className="space-y-1.5">
            {meds.map((med) => {
              const taken = takenIds.has(med.id);
              return (
                <div key={med.id} className="flex items-center gap-3 group">
                  <button
                    onClick={() => toggleLog.mutate({ medicationId: med.id, date: todayStr() })}
                    className={`flex items-center gap-2.5 flex-1 px-3 py-2.5 rounded-xl text-left transition-all
                      ${taken ? "bg-primary/8 opacity-60" : "bg-secondary/30 hover:bg-secondary/60"}`}
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all
                      ${taken ? "bg-primary border-primary" : "border-border"}`}>
                      {taken && <Check className="w-3 h-3 text-primary-foreground" />}
                    </span>
                    <span className={`text-[13px] sm:text-sm font-body transition-all
                      ${taken ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {med.emoji} {med.name}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteMed.mutate(med.id)}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs font-body text-muted-foreground/50 italic text-center py-4">
            No medications added yet — tap + to add one
          </p>
        )}
      </div>

      {/* Calendar history card */}
      <AnimatePresence>
        {view === "calendar" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-display font-medium text-foreground">
                📅 History
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setViewDate(subMonths(viewDate, 1)); setSelectedCalDate(null); }}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-body text-muted-foreground min-w-[70px] text-center">
                  {format(viewDate, "MMM yyyy")}
                </span>
                <button
                  onClick={() => { setViewDate(addMonths(viewDate, 1)); setSelectedCalDate(null); }}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {weekdays.map((wd, i) => (
                <div key={i} className="text-center text-[9px] font-body text-muted-foreground/50 uppercase py-0.5">
                  {wd}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const inMonth = isSameMonth(day, viewDate);
                const today = isToday(day);
                const takenCount = dateTakenMap.get(dateStr) || 0;
                const totalMeds = meds.length;
                const allDone = totalMeds > 0 && takenCount >= totalMeds;
                const partial = takenCount > 0 && !allDone;
                const isSelected = selectedCalDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    disabled={!inMonth}
                    onClick={() => inMonth && setSelectedCalDate(isSelected ? null : dateStr)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-full text-[11px] font-body relative transition-all
                      ${!inMonth ? "opacity-20 cursor-default" : "cursor-pointer hover:bg-secondary/60"}
                      ${today ? "ring-1 ring-primary/30" : ""}
                      ${isSelected ? "ring-2 ring-primary" : ""}
                      ${allDone ? "bg-primary/15 text-primary font-medium" : partial ? "bg-accent/40 text-foreground/70" : inMonth ? "text-foreground/70" : "text-muted-foreground"}
                    `}
                  >
                    {format(day, "d")}
                    {takenCount > 0 && inMonth && (
                      <span className={`absolute -bottom-0.5 w-1 h-1 rounded-full ${allDone ? "bg-primary" : "bg-accent-foreground/40"}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected date detail */}
            <AnimatePresence>
              {selectedCalDate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-display font-medium text-foreground mb-2">
                      {format(new Date(selectedCalDate + "T00:00:00"), "EEEE, MMM d")}
                    </p>
                    {selectedDateMeds.length > 0 ? (
                      <div className="space-y-1">
                        {selectedDateMeds.map((med) => (
                          <div key={med.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/8">
                            <Check className="w-3 h-3 text-primary shrink-0" />
                            <span className="text-xs font-body text-foreground">
                              {med.emoji} {med.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] font-body text-muted-foreground/60 italic">
                        No medications logged this day
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Legend */}
            {!selectedCalDate && (
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary/15 border border-primary/30" />
                  <span className="text-[10px] font-body text-muted-foreground">All taken</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent/40 border border-accent-foreground/20" />
                  <span className="text-[10px] font-body text-muted-foreground">Partial</span>
                </div>
              </div>
            )}

            <p className="text-[10px] font-body text-muted-foreground/40 mt-2 italic">
              Tap a day to see details
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MedicationTracker;
