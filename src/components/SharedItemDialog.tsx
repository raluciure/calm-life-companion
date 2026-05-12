import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2, Lock } from "lucide-react";

type ItemType = "workout" | "meal" | "item" | "grocery_list";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: ItemType;
  itemId: string;
  senderName?: string;
}

/**
 * Read-only viewer for a shared workout / meal / task. Grocery lists are
 * handled separately by the meals section so collaborators can edit live.
 */
const SharedItemDialog = ({ open, onOpenChange, itemType, itemId, senderName }: Props) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setData(null);
    setError(null);
    setLoading(true);
    const table = itemType === "item" ? "items" : itemType === "meal" ? "meals" : "workouts";
    supabase
      .from(table)
      .select("*")
      .eq("id", itemId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else if (!data) setError("This item is no longer available.");
        else setData(data);
        setLoading(false);
      });
  }, [open, itemType, itemId]);

  const title =
    itemType === "workout" ? "Shared workout"
    : itemType === "meal" ? "Shared meal"
    : "Shared task";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display font-light text-lg flex items-center gap-2">
            <span>{data?.emoji || "📎"}</span> {title}
          </DrawerTitle>
          {senderName && (
            <p className="text-xs font-body text-muted-foreground">
              From {senderName} · <Lock className="inline w-3 h-3" /> read only
            </p>
          )}
          <DrawerClose />
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          {error && (
            <p className="text-sm font-body text-muted-foreground italic py-6 text-center">
              {error}
            </p>
          )}
          {data && itemType === "workout" && <WorkoutView w={data} />}
          {data && itemType === "meal" && <MealView m={data} />}
          {data && itemType === "item" && <TaskView t={data} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
    <span className="text-xs font-body text-muted-foreground">{label}</span>
    <span className="text-sm font-body text-foreground">{value}</span>
  </div>
);

const WorkoutView = ({ w }: { w: any }) => (
  <div className="space-y-3">
    <h3 className="text-base font-body font-medium text-foreground">{w.title}</h3>
    <div>
      <Row label="Date" value={format(new Date(w.date), "MMM d, yyyy")} />
      {w.duration_minutes && <Row label="Duration" value={`${w.duration_minutes} min`} />}
    </div>
    {Array.isArray(w.exercises) && w.exercises.length > 0 && (
      <div className="space-y-1.5">
        <p className="text-xs font-body font-medium text-muted-foreground">Exercises</p>
        {w.exercises.map((ex: any, i: number) => (
          <div key={i} className="px-3 py-2 rounded-xl bg-secondary/30 text-sm font-body">
            <div className="text-foreground">{ex.name || `Exercise ${i + 1}`}</div>
            {(ex.sets || ex.reps || ex.weight) && (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {[ex.sets && `${ex.sets} sets`, ex.reps && `${ex.reps} reps`, ex.weight && `${ex.weight} kg`]
                  .filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
    {w.notes && (
      <div>
        <p className="text-xs font-body font-medium text-muted-foreground mb-1">Notes</p>
        <p className="text-sm font-body text-foreground whitespace-pre-wrap">{w.notes}</p>
      </div>
    )}
  </div>
);

const MealView = ({ m }: { m: any }) => (
  <div className="space-y-3">
    <h3 className="text-base font-body font-medium text-foreground">{m.title}</h3>
    <div>
      <Row label="Date" value={format(new Date(m.date), "MMM d, yyyy")} />
      <Row label="Type" value={<span className="capitalize">{m.meal_type}</span>} />
      {m.calories != null && <Row label="Calories" value={`${m.calories} kcal`} />}
      {m.protein != null && <Row label="Protein" value={`${m.protein} g`} />}
      {m.carbs != null && <Row label="Carbs" value={`${m.carbs} g`} />}
      {m.fat != null && <Row label="Fat" value={`${m.fat} g`} />}
    </div>
    {m.notes && (
      <div>
        <p className="text-xs font-body font-medium text-muted-foreground mb-1">Notes</p>
        <p className="text-sm font-body text-foreground whitespace-pre-wrap">{m.notes}</p>
      </div>
    )}
  </div>
);

const TaskView = ({ t }: { t: any }) => (
  <div className="space-y-3">
    <h3 className="text-base font-body font-medium text-foreground">{t.title}</h3>
    <div>
      <Row label="Date" value={format(new Date(t.date), "MMM d, yyyy")} />
      {t.time && <Row label="Time" value={t.time + (t.end_time ? ` – ${t.end_time}` : "")} />}
      <Row label="Category" value={<span className="capitalize">{t.category}</span>} />
      <Row label="Status" value={t.done ? "✓ Done" : "Pending"} />
    </div>
  </div>
);

export default SharedItemDialog;
