import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, ChevronDown, ChevronUp, Pencil, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useWorkouts, useAddWorkout, useUpdateWorkout, useDeleteWorkout, type Exercise, type Workout } from "@/hooks/useWorkouts";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, parseISO } from "date-fns";

const WORKOUT_TYPES = [
  { emoji: "💪", label: "Strength" },
  { emoji: "🏃", label: "Cardio" },
  { emoji: "🧘", label: "Yoga" },
  { emoji: "🏊", label: "Swimming" },
  { emoji: "🚴", label: "Cycling" },
  { emoji: "🥊", label: "Boxing" },
  { emoji: "🏋️", label: "CrossFit" },
  { emoji: "🧎", label: "Pilates" },
  { emoji: "🤸", label: "Other" },
];

type GymView = "list" | "weekly";

interface WorkoutFormData {
  title: string;
  emoji: string;
  date: string;
  duration: string;
  notes: string;
  exercises: Exercise[];
}

const emptyForm = (): WorkoutFormData => ({
  title: "",
  emoji: "💪",
  date: format(new Date(), "yyyy-MM-dd"),
  duration: "",
  notes: "",
  exercises: [],
});

const GymSection = () => {
  const { data: workouts = [], isLoading } = useWorkouts(50);
  const addWorkout = useAddWorkout();
  const updateWorkout = useUpdateWorkout();
  const deleteWorkout = useDeleteWorkout();

  const [gymView, setGymView] = useState<GymView>("list");
  const [weekOffset, setWeekOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkoutFormData>(emptyForm());
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState("");
  const [exReps, setExReps] = useState("");
  const [exWeight, setExWeight] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });

  const weeklyWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      const d = parseISO(w.date);
      return isWithinInterval(d, { start: currentWeekStart, end: currentWeekEnd });
    });
  }, [workouts, currentWeekStart, currentWeekEnd]);

  const weekLabel = `${format(currentWeekStart, "MMM d")} – ${format(currentWeekEnd, "MMM d")}`;

  const resetForm = () => {
    setForm(emptyForm());
    setExName("");
    setExSets("");
    setExReps("");
    setExWeight("");
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (w: Workout) => {
    setForm({
      title: w.title,
      emoji: w.emoji,
      date: w.date,
      duration: w.duration_minutes?.toString() || "",
      notes: w.notes || "",
      exercises: [...w.exercises],
    });
    setEditingId(w.id);
    setShowForm(true);
    setExpandedId(null);
  };

  const addExercise = () => {
    if (!exName.trim()) return;
    setForm((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          name: exName.trim(),
          sets: exSets ? parseInt(exSets) : undefined,
          reps: exReps ? parseInt(exReps) : undefined,
          weight: exWeight || undefined,
        },
      ],
    }));
    setExName("");
    setExSets("");
    setExReps("");
    setExWeight("");
  };

  const removeExercise = (index: number) => {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      emoji: form.emoji,
      date: form.date,
      duration_minutes: form.duration ? parseInt(form.duration) : undefined,
      notes: form.notes || undefined,
      exercises: form.exercises,
    };
    if (editingId) {
      updateWorkout.mutate({ id: editingId, ...payload });
    } else {
      addWorkout.mutate(payload);
    }
    resetForm();
  };

  const renderWorkoutCard = (w: Workout) => (
    <motion.div
      key={w.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-secondary/30 border border-border/30 overflow-hidden"
    >
      <button
        onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
        className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-left"
      >
        <span className="text-lg">{w.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] sm:text-sm font-body text-foreground truncate">{w.title}</p>
          <p className="text-[10px] sm:text-xs font-body text-muted-foreground">
            {format(parseISO(w.date), "EEE, MMM d")}
            {w.duration_minutes && ` · ${w.duration_minutes} min`}
            {w.exercises.length > 0 && ` · ${w.exercises.length} exercise${w.exercises.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {expandedId === w.id ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expandedId === w.id && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-4 pb-3 space-y-2">
              {w.exercises.length > 0 && (
                <div className="space-y-1">
                  {w.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0" />
                      <span className="text-foreground">{ex.name}</span>
                      {ex.sets != null && <span>{ex.sets} sets</span>}
                      {ex.reps != null && <span>× {ex.reps}</span>}
                      {ex.weight && <span>{ex.weight}</span>}
                    </div>
                  ))}
                </div>
              )}
              {w.notes && (
                <p className="text-xs font-body text-muted-foreground italic">{w.notes}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => startEdit(w)}
                  className="text-xs font-body text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => deleteWorkout.mutate(w.id)}
                  className="text-xs font-body text-destructive/70 hover:text-destructive transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-display font-light text-foreground">
          🏋️ Gym & Training
        </h1>
        <p className="text-sm font-body text-muted-foreground">
          Track your workouts
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center gap-1 bg-secondary/30 rounded-lg p-1">
        <button
          onClick={() => setGymView("list")}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-body transition-all ${
            gymView === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          All Workouts
        </button>
        <button
          onClick={() => setGymView("weekly")}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-body transition-all ${
            gymView === "weekly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Weekly View
        </button>
      </div>

      {/* Log Workout Button */}
      {!showForm && (
        <motion.button
          onClick={() => { setEditingId(null); setForm(emptyForm()); setShowForm(true); }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all font-body text-sm"
        >
          <Plus className="w-4 h-4" />
          Log workout
        </motion.button>
      )}

      {/* Add/Edit Workout Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
              <p className="text-xs font-body font-medium text-foreground">
                {editingId ? "Edit Workout" : "New Workout"}
              </p>

              {/* Workout Type Picker */}
              <div className="flex flex-wrap gap-2">
                {WORKOUT_TYPES.map((type) => (
                  <button
                    key={type.label}
                    onClick={() => {
                      setForm((p) => ({ ...p, emoji: type.emoji, title: p.title || type.label }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all ${
                      form.emoji === type.emoji
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground border border-transparent"
                    }`}
                  >
                    {type.emoji} {type.label}
                  </button>
                ))}
              </div>

              {/* Title */}
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Workout name"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground font-body text-sm placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 transition-all"
              />

              {/* Date */}
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-card text-foreground font-body text-sm outline-none focus:border-primary/30 transition-all"
                />
              </div>

              {/* Duration */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  value={form.duration}
                  onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value.replace(/\D/g, "") }))}
                  placeholder="Duration (minutes)"
                  className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-card text-foreground font-body text-sm placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 transition-all"
                />
              </div>

              {/* Exercises */}
              <div className="space-y-2">
                <p className="text-xs font-body text-muted-foreground font-medium">Exercises (optional)</p>
                {form.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-body text-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                    <span className="flex-1 truncate">{ex.name}</span>
                    {ex.sets != null && <span className="text-muted-foreground">{ex.sets}s</span>}
                    {ex.reps != null && <span className="text-muted-foreground">×{ex.reps}</span>}
                    {ex.weight && <span className="text-muted-foreground">{ex.weight}</span>}
                    <button onClick={() => removeExercise(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-1.5">
                  <input value={exName} onChange={(e) => setExName(e.target.value)} placeholder="Exercise" className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-border bg-card text-foreground font-body text-xs placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 transition-all" />
                  <input value={exSets} onChange={(e) => setExSets(e.target.value.replace(/\D/g, ""))} placeholder="Sets" className="w-12 px-2 py-2 rounded-lg border border-border bg-card text-foreground font-body text-xs placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 transition-all text-center" />
                  <input value={exReps} onChange={(e) => setExReps(e.target.value.replace(/\D/g, ""))} placeholder="Reps" className="w-12 px-2 py-2 rounded-lg border border-border bg-card text-foreground font-body text-xs placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 transition-all text-center" />
                  <input value={exWeight} onChange={(e) => setExWeight(e.target.value)} placeholder="kg" className="w-12 px-2 py-2 rounded-lg border border-border bg-card text-foreground font-body text-xs placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 transition-all text-center" />
                  <button onClick={addExercise} className="px-2.5 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground font-body text-sm placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 transition-all resize-none"
              />

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={resetForm} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground font-body text-sm hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={!form.title.trim()} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  {editingId ? "Update" : "Save workout"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly View */}
      {gymView === "weekly" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setWeekOffset((o) => o - 1)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-body text-muted-foreground">{weekLabel}</span>
            <button onClick={() => setWeekOffset((o) => o + 1)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekly stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary/30 rounded-lg py-2 px-1">
              <p className="text-lg font-display text-foreground">{weeklyWorkouts.length}</p>
              <p className="text-[10px] font-body text-muted-foreground">Workouts</p>
            </div>
            <div className="bg-secondary/30 rounded-lg py-2 px-1">
              <p className="text-lg font-display text-foreground">
                {weeklyWorkouts.reduce((a, w) => a + (w.duration_minutes || 0), 0)}
              </p>
              <p className="text-[10px] font-body text-muted-foreground">Minutes</p>
            </div>
            <div className="bg-secondary/30 rounded-lg py-2 px-1">
              <p className="text-lg font-display text-foreground">
                {weeklyWorkouts.reduce((a, w) => a + w.exercises.length, 0)}
              </p>
              <p className="text-[10px] font-body text-muted-foreground">Exercises</p>
            </div>
          </div>

          {weeklyWorkouts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground/60 font-body italic py-4">
              No workouts this week
            </p>
          ) : (
            <div className="space-y-2">{weeklyWorkouts.map(renderWorkoutCard)}</div>
          )}
        </div>
      )}

      {/* List View */}
      {gymView === "list" && (
        <>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-secondary/50 animate-gentle-pulse" />
              ))}
            </div>
          ) : workouts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground/60 font-body italic py-6">
              No workouts yet — start logging 🏋️
            </p>
          ) : (
            <div className="space-y-2">{workouts.map(renderWorkoutCard)}</div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default GymSection;
