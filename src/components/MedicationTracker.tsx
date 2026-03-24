import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check } from "lucide-react";
import {
  useMedications,
  useAddMedication,
  useDeleteMedication,
  useTodayMedLogs,
  useToggleMedLog,
} from "@/hooks/useHealth";

const todayStr = () => new Date().toISOString().split("T")[0];

const EMOJI_OPTIONS = ["💊", "💉", "🩹", "🧴", "🌿", "☕"];

const MedicationTracker = () => {
  const { data: meds = [] } = useMedications();
  const { data: todayLogs = [] } = useTodayMedLogs();
  const addMed = useAddMedication();
  const deleteMed = useDeleteMedication();
  const toggleLog = useToggleMedLog();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💊");

  const takenIds = new Set(todayLogs.map((l) => l.medication_id));

  const handleAdd = () => {
    if (!newName.trim()) return;
    addMed.mutate({ name: newName.trim(), emoji: newEmoji });
    setNewName("");
    setNewEmoji("💊");
    setShowAdd(false);
  };

  const allTaken = meds.length > 0 && meds.every((m) => takenIds.has(m.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-medium text-foreground flex items-center gap-2">
          💊 Daily Meds
          {allTaken && meds.length > 0 && (
            <span className="text-[10px] font-body text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              all done ✓
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
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
              <div
                key={med.id}
                className="flex items-center gap-3 group"
              >
                <button
                  onClick={() => toggleLog.mutate({ medicationId: med.id, date: todayStr() })}
                  className={`flex items-center gap-2.5 flex-1 px-3 py-2.5 rounded-xl text-left transition-all
                    ${taken ? "bg-primary/8 opacity-60" : "bg-secondary/30 hover:bg-secondary/60"}`}
                >
                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all
                    ${taken ? "bg-primary border-primary" : "border-border"}`}
                  >
                    {taken && <Check className="w-3 h-3 text-primary-foreground" />}
                  </span>
                  <span className={`text-[13px] sm:text-sm font-body transition-all
                    ${taken ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
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
    </motion.div>
  );
};

export default MedicationTracker;
