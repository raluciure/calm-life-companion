import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, isToday, isThisWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, X, Pencil, Trash2, Sparkles, Loader2, Check, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useMealsByDate,
  useMealsByWeek,
  useAddMeal,
  useUpdateMeal,
  useDeleteMeal,
  MEAL_TYPES,
  MEAL_EMOJIS,
  type Meal,
  type MealType,
} from "@/hooks/useMeals";
import {
  useGroceryItems,
  useAddGroceryItem,
  useToggleGroceryItem,
  useDeleteGroceryItem,
  useClearCheckedGroceryItems,
  GROCERY_CATEGORIES,
  CATEGORY_EMOJIS,
} from "@/hooks/useGroceryList";

type MealView = "daily" | "weekly" | "grocery";

const MealSection = () => {
  const [view, setView] = useState<MealView>("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data: dayMeals = [] } = useMealsByDate(dateStr);
  const { data: weekMeals = [] } = useMealsByWeek(selectedDate);
  const { data: groceryItems = [] } = useGroceryItems();
  const addGroceryItem = useAddGroceryItem();
  const toggleGroceryItem = useToggleGroceryItem();
  const deleteGroceryItem = useDeleteGroceryItem();
  const clearChecked = useClearCheckedGroceryItems();
  const [groceryName, setGroceryName] = useState("");
  const [groceryCategory, setGroceryCategory] = useState("other");
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMeal();

  // Form state
  const [formType, setFormType] = useState<MealType>("lunch");
  const [formTitle, setFormTitle] = useState("");
  const [formCalories, setFormCalories] = useState("");
  const [formProtein, setFormProtein] = useState("");
  const [formCarbs, setFormCarbs] = useState("");
  const [formFat, setFormFat] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const resetForm = () => {
    setFormType("lunch");
    setFormTitle("");
    setFormCalories("");
    setFormProtein("");
    setFormCarbs("");
    setFormFat("");
    setFormNotes("");
    setEditingMeal(null);
    setShowForm(false);
  };

  const openEdit = (meal: Meal) => {
    setFormType(meal.meal_type as MealType);
    setFormTitle(meal.title);
    setFormCalories(meal.calories?.toString() || "");
    setFormProtein(meal.protein?.toString() || "");
    setFormCarbs(meal.carbs?.toString() || "");
    setFormFat(meal.fat?.toString() || "");
    setFormNotes(meal.notes || "");
    setEditingMeal(meal);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formTitle.trim()) return;
    const payload = {
      meal_type: formType,
      title: formTitle.trim(),
      emoji: MEAL_EMOJIS[formType],
      date: dateStr,
      calories: formCalories ? parseInt(formCalories) : null,
      protein: formProtein ? parseFloat(formProtein) : null,
      carbs: formCarbs ? parseFloat(formCarbs) : null,
      fat: formFat ? parseFloat(formFat) : null,
      notes: formNotes.trim() || null,
    };
    if (editingMeal) {
      updateMeal.mutate({ id: editingMeal.id, ...payload });
    } else {
      addMeal.mutate(payload);
    }
    resetForm();
  };

  // Daily macro totals
  const calcTotals = (meals: Meal[]) => ({
    calories: meals.reduce((s, m) => s + (m.calories || 0), 0),
    protein: meals.reduce((s, m) => s + (m.protein || 0), 0),
    carbs: meals.reduce((s, m) => s + (m.carbs || 0), 0),
    fat: meals.reduce((s, m) => s + (m.fat || 0), 0),
  });

  const dayTotals = calcTotals(dayMeals);

  // Weekly grouping
  const ws = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

  const renderForm = () => (
    <>
      {/* Type selector */}
      <div className="flex gap-1.5">
        {MEAL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFormType(t)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-body capitalize transition-all ${
              formType === t ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary/50 text-muted-foreground"
            }`}
          >
            {MEAL_EMOJIS[t]} {t}
          </button>
        ))}
      </div>

      <input
        value={formTitle}
        onChange={(e) => setFormTitle(e.target.value)}
        placeholder="What did you eat?"
        className="w-full bg-background/50 rounded-lg px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 outline-none border border-border/30 focus:border-primary/30"
      />

      {/* AI Estimate button */}
      {formTitle.trim().length > 1 && (
        <button
          type="button"
          onClick={async () => {
            setEstimating(true);
            try {
              const { data, error } = await supabase.functions.invoke("estimate-nutrition", {
                body: { meal: formTitle.trim() },
              });
              if (!error && data) {
                if (data.calories) setFormCalories(String(data.calories));
                if (data.protein) setFormProtein(String(data.protein));
                if (data.carbs) setFormCarbs(String(data.carbs));
                if (data.fat) setFormFat(String(data.fat));
              }
            } catch (e) {
              console.error("Estimate failed", e);
            } finally {
              setEstimating(false);
            }
          }}
          disabled={estimating}
          className="w-full py-2 rounded-lg bg-primary/5 border border-primary/15 text-[11px] font-body font-medium text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {estimating ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Estimating...</>
          ) : (
            <><Sparkles className="w-3 h-3" /> Estimate calories &amp; macros</>
          )}
        </button>
      )}

      {/* Macros row */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: "Cal", value: formCalories, set: setFormCalories, placeholder: "kcal" },
          { label: "P", value: formProtein, set: setFormProtein, placeholder: "g" },
          { label: "C", value: formCarbs, set: setFormCarbs, placeholder: "g" },
          { label: "F", value: formFat, set: setFormFat, placeholder: "g" },
        ].map((f) => (
          <div key={f.label}>
            <label className="text-[10px] font-body text-muted-foreground mb-0.5 block">{f.label}</label>
            <input
              type="number"
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.placeholder}
              className="w-full bg-background/50 rounded-lg px-2 py-1.5 text-xs font-body text-foreground placeholder:text-muted-foreground/40 outline-none border border-border/30 focus:border-primary/30"
            />
          </div>
        ))}
      </div>

      <input
        value={formNotes}
        onChange={(e) => setFormNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full bg-background/50 rounded-lg px-3 py-2 text-xs font-body text-foreground placeholder:text-muted-foreground/50 outline-none border border-border/30 focus:border-primary/30"
      />

      <button
        onClick={handleSubmit}
        disabled={!formTitle.trim()}
        className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-body font-medium disabled:opacity-40 transition-all"
      >
        {editingMeal ? "Update" : "Add Meal"}
      </button>
    </>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-display font-light text-foreground">🍽️ Meal Planning</h1>
        <p className="text-sm font-body text-muted-foreground">Track your nutrition</p>
      </div>

      {/* View toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-secondary/50 p-1 gap-1">
          {([["daily", "📅 Daily"], ["weekly", "📊 Weekly"], ["grocery", "🛒 Grocery"]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-2 rounded-lg text-xs font-body font-medium transition-all ${
                view === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── DAILY VIEW ─── */}
      {view === "daily" && (
        <>
          {/* Date nav */}
          <div className="flex items-center justify-between">
            <button onClick={() => setSelectedDate((d) => subDays(d, 1))} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs font-body font-medium text-foreground">
                {isToday(selectedDate) ? "Today" : format(selectedDate, "EEE, MMM d")}
              </span>
              {!isToday(selectedDate) && (
                <button onClick={() => setSelectedDate(new Date())} className="text-[10px] font-body text-primary hover:text-primary/80 transition-colors">
                  Back to today
                </button>
              )}
            </div>
            <button onClick={() => setSelectedDate((d) => addDays(d, 1))} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Macro summary bar */}
          {dayMeals.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Calories", value: dayTotals.calories, unit: "kcal", color: "text-orange-400" },
                { label: "Protein", value: dayTotals.protein.toFixed(0), unit: "g", color: "text-blue-400" },
                { label: "Carbs", value: dayTotals.carbs.toFixed(0), unit: "g", color: "text-yellow-400" },
                { label: "Fat", value: dayTotals.fat.toFixed(0), unit: "g", color: "text-pink-400" },
              ].map((m) => (
                <div key={m.label} className="text-center p-2 rounded-xl bg-secondary/30">
                  <p className={`text-sm font-display font-medium ${m.color}`}>
                    {m.value}
                    <span className="text-[10px] ml-0.5">{m.unit}</span>
                  </p>
                  <p className="text-[10px] font-body text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Meals by type */}
          <div className="space-y-3">
            {MEAL_TYPES.map((type) => {
              const meals = dayMeals.filter((m) => m.meal_type === type);
              return (
                <div key={type}>
                  <p className="text-xs font-body font-medium text-muted-foreground mb-1.5 capitalize flex items-center gap-1">
                    {MEAL_EMOJIS[type]} {type}
                  </p>
                  {meals.length === 0 ? (
                    <p className="text-[11px] font-body text-muted-foreground/40 italic pl-1">Nothing logged</p>
                  ) : (
                    <div className="space-y-1.5">
                      {meals.map((meal) => (
                        editingMeal?.id === meal.id && showForm ? (
                          <motion.div
                            key={meal.id + "-edit"}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-secondary/30 rounded-xl p-3 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-body font-medium text-foreground">Edit Meal</span>
                              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                            </div>
                            {renderForm()}
                          </motion.div>
                        ) : (
                        <div
                          key={meal.id}
                          onClick={() => setExpandedId(expandedId === meal.id ? null : meal.id)}
                          className="bg-secondary/30 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-body text-foreground">{meal.title}</span>
                            <div className="flex items-center gap-2">
                              {meal.calories && (
                                <span className="text-[11px] font-body text-muted-foreground">{meal.calories} kcal</span>
                              )}
                            </div>
                          </div>
                          <AnimatePresence>
                            {expandedId === meal.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-2 mt-2 border-t border-border/30 space-y-1.5">
                                  <div className="flex gap-3 text-[11px] font-body text-muted-foreground">
                                    {meal.protein != null && <span>P: {meal.protein}g</span>}
                                    {meal.carbs != null && <span>C: {meal.carbs}g</span>}
                                    {meal.fat != null && <span>F: {meal.fat}g</span>}
                                  </div>
                                  {meal.notes && <p className="text-[11px] font-body text-muted-foreground/70 italic">{meal.notes}</p>}
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openEdit(meal); }}
                                      className="text-[10px] font-body text-primary hover:text-primary/80 flex items-center gap-0.5"
                                    >
                                      <Pencil className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); deleteMeal.mutate(meal.id); }}
                                      className="text-[10px] font-body text-destructive hover:text-destructive/80 flex items-center gap-0.5"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add button - only show when not editing inline */}
          {!showForm && (
            <button
              onClick={() => { setEditingMeal(null); setShowForm(true); }}
              className="w-full py-3 rounded-xl border border-dashed border-border/50 text-xs font-body text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add meal
            </button>
          )}

          {/* New meal form (not editing) */}
          <AnimatePresence>
            {showForm && !editingMeal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-secondary/30 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-body font-medium text-foreground">New Meal</span>
                    <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  {renderForm()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ─── WEEKLY VIEW ─── */}
      {view === "weekly" && (
        <>
          {/* Week nav */}
          <div className="flex items-center justify-between">
            <button onClick={() => setSelectedDate((d) => subWeeks(d, 1))} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs font-body font-medium text-foreground">
                {format(ws, "MMM d")} – {format(addDays(ws, 6), "MMM d")}
              </span>
              {!isThisWeek(selectedDate, { weekStartsOn: 1 }) && (
                <button onClick={() => setSelectedDate(new Date())} className="text-[10px] font-body text-primary hover:text-primary/80 transition-colors">
                  Back to this week
                </button>
              )}
            </div>
            <button onClick={() => setSelectedDate((d) => addWeeks(d, 1))} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekly totals */}
          {weekMeals.length > 0 && (() => {
            const wt = calcTotals(weekMeals);
            return (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Calories", value: wt.calories, unit: "kcal", color: "text-orange-400" },
                  { label: "Protein", value: wt.protein.toFixed(0), unit: "g", color: "text-blue-400" },
                  { label: "Carbs", value: wt.carbs.toFixed(0), unit: "g", color: "text-yellow-400" },
                  { label: "Fat", value: wt.fat.toFixed(0), unit: "g", color: "text-pink-400" },
                ].map((m) => (
                  <div key={m.label} className="text-center p-2 rounded-xl bg-secondary/30">
                    <p className={`text-sm font-display font-medium ${m.color}`}>
                      {m.value}<span className="text-[10px] ml-0.5">{m.unit}</span>
                    </p>
                    <p className="text-[10px] font-body text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Days breakdown */}
          <div className="space-y-2">
            {weekDays.map((day) => {
              const dStr = format(day, "yyyy-MM-dd");
              const meals = weekMeals.filter((m) => m.date === dStr);
              const totals = calcTotals(meals);
              const isTodayDay = isToday(day);
              return (
                <div
                  key={dStr}
                  onClick={() => { setSelectedDate(day); setView("daily"); }}
                  className={`rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                    isTodayDay ? "bg-primary/5 border border-primary/20" : "bg-secondary/20 hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-body font-medium ${isTodayDay ? "text-primary" : "text-foreground"}`}>
                        {format(day, "EEE d")}
                      </span>
                      {meals.length > 0 && (
                        <span className="text-[10px] font-body text-muted-foreground">
                          {meals.length} meal{meals.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {meals.length > 0 && (
                      <span className="text-[11px] font-body text-muted-foreground">{totals.calories} kcal</span>
                    )}
                  </div>
                  {meals.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {meals.map((m) => (
                        <span key={m.id} className="text-[10px] font-body text-muted-foreground/70 bg-secondary/40 rounded-md px-1.5 py-0.5">
                          {MEAL_EMOJIS[m.meal_type as MealType] || "🍽️"} {m.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default MealSection;
