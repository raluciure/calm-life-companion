import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useWorkouts, useAddWorkout, useDeleteWorkout, type Exercise } from "@/hooks/useWorkouts";
import { format } from "date-fns";

const WORKOUT_TYPES = [
  { emoji: "💪", label: "Strength" },
  { emoji: "🏃", label: "Cardio" },
  { emoji: "🧘", label: "Yoga" },
  { emoji: "🏊", label: "Swimming" },
  { emoji: "🚴", label: "Cycling" },
  { emoji: "🥊", label: "Boxing" },
  { emoji: "🏋️", label: "CrossFit" },
  { emoji: "🤸", label: "Other" },
];

const GymSection = () => {
  const { data: workouts = [], isLoading } = useWorkouts();
  const addWorkout = useAddWorkout();
  const deleteWorkout = useDeleteWorkout();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("💪");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState("");
  const [exReps, setExReps] = useState("");
  const [exWeight, setExWeight] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setEmoji("💪");
    setDuration("");
    setNotes("");
    setExercises([]);
    setExName("");
    setExSets("");
    setExReps("");
    setExWeight("");
    setShowForm(false);
  };

  const addExercise = () => {
    if (!exName.trim()) return;
    setExercises((prev) => [
      ...prev,
      {
        name: exName.trim(),
        sets: exSets ? parseInt(exSets) : undefined,
        reps: exReps ? parseInt(exReps) : undefined,
        weight: exWeight || undefined,
      },
    ]);
    setExName("");
    setExSets("");
    setExReps("");
    setExWeight("");
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    addWorkout.mutate({
      title: title.trim(),
      emoji,
      date: format(new Date(), "yyyy-MM-dd"),
      duration_minutes: duration ? parseInt(duration) : undefined,
      notes: notes || undefined,
      exercises,
    });
    resetForm();
  };

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

      {/* Log Workout Button */}
      {!showForm && (
        <motion.button
          onClick={() => setShowForm(true)}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all font-body text-sm"
        >
          <Plus className="w-4 h-4" />
          Log workout
        </motion.button>
      )}

      {/* Add Workout Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-border/50">
              {/* Workout Type Picker */}
              <div className="flex flex-wrap gap-2">
                {WORKOUT_TYPES.map((type) => (
                  <button
                    key={type.emoji}
                    onClick={() => {
                      setEmoji(type.emoji);
                      if (!title) setTitle(type.label);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all
                      ${emoji === type.emoji
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Workout name"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground font-body text-sm placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 transition-all"
              />

              {/* Duration */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value.replace(/\D/g, ""))}
                  placeholder="Duration (minutes)"
                  className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-card text-foreground font-body text-sm placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 transition-all"
                />
              </div>

              {/* Exercises */}
              <div className="space-y-2">
                <p className="text-xs font-body text-muted-foreground font-medium">Exercises (optional)</p>
                {exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-body text-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                    <span className="flex-1">{ex.name}</span>
                    {ex.sets && <span className="text-muted-foreground">{ex.sets}s</span>}
                    {ex.reps && <span className="text-muted-foreground">×{ex.reps}</span>}
                    {ex.weight && <span className="text-muted-foreground">{ex.weight}</span>}
                    <button onClick={() => setExercises((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground font-body text-sm placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 transition-all resize-none"
              />

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={resetForm} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground font-body text-sm hover:text-foreground transition-colors">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={!title.trim()} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  Save workout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workout History */}
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
        <div className="space-y-2">
          {workouts.map((w) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-secondary/30 border border-border/30 overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-left group"
              >
                <span className="text-lg">{w.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] sm:text-sm font-body text-foreground truncate">{w.title}</p>
                  <p className="text-[10px] sm:text-xs font-body text-muted-foreground">
                    {format(new Date(w.date), "MMM d")}
                    {w.duration_minutes && ` · ${w.duration_minutes} min`}
                    {w.exercises.length > 0 && ` · ${w.exercises.length} exercises`}
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
                              <span className="text-foreground">{ex.name}</span>
                              {ex.sets && <span>{ex.sets}s</span>}
                              {ex.reps && <span>×{ex.reps}</span>}
                              {ex.weight && <span>{ex.weight}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {w.notes && (
                        <p className="text-xs font-body text-muted-foreground italic">{w.notes}</p>
                      )}
                      <button
                        onClick={() => deleteWorkout.mutate(w.id)}
                        className="text-xs font-body text-destructive/70 hover:text-destructive transition-colors"
                      >
                        Delete workout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default GymSection;
