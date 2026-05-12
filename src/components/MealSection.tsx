import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, isToday, isThisWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, X, Pencil, Trash2, Sparkles, Loader2, Check, ShoppingCart, Share2 } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useFriends, useProfilesByIds, useShareItem, useMySharedItems, useSharedWithMe, type Profile } from "@/hooks/useProfile";
import ShareWithFriends from "./ShareWithFriends";
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
  useRealtimeGroceryList,
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
  const addMeal = useAddMeal();
  // selectedListOwnerId is set further below; hooks read it via closure
  const toggleGroceryItem = useToggleGroceryItem();
  const deleteGroceryItem = useDeleteGroceryItem();
  const [groceryName, setGroceryName] = useState("");
  const [groceryCategory, setGroceryCategory] = useState("other");
  const [showShareGrocery, setShowShareGrocery] = useState(false);
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMeal();

  // Friends for sharing
  const { data: friends = [] } = useFriends();
  const shareItem = useShareItem();
  const { data: mySharedItems = [] } = useMySharedItems();
  const [myUserId, setMyUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setMyUserId(user?.id || null));
  }, []);
  const friendUserIds = useMemo(() => {
    if (!myUserId) return [];
    return friends.map((f) => f.requester_id === myUserId ? f.addressee_id : f.requester_id).filter(Boolean);
  }, [friends, myUserId]);
  const { data: friendProfiles = [] } = useProfilesByIds(friendUserIds);
  const friendProfileMap: Record<string, Profile> = {};
  friendProfiles.forEach((p) => (friendProfileMap[p.user_id] = p));

  // Shared grocery recipients (lists I shared)
  const groceryShares = useMemo(() => {
    return mySharedItems.filter(s => s.item_type === "grocery_list");
  }, [mySharedItems]);
  const sharedRecipientIds = useMemo(() => [...new Set(groceryShares.map(s => s.to_user_id))], [groceryShares]);

  // Grocery lists shared with me
  const { data: sharedWithMeAll = [] } = useSharedWithMe();
  const sharedGroceriesWithMe = useMemo(
    () => sharedWithMeAll.filter(s => s.item_type === "grocery_list"),
    [sharedWithMeAll]
  );
  const sharedSenderIds = useMemo(
    () => [...new Set(sharedGroceriesWithMe.map(s => s.from_user_id))],
    [sharedGroceriesWithMe]
  );
  const { data: sharedRecipientProfiles = [] } = useProfilesByIds([...sharedRecipientIds, ...sharedSenderIds]);
  const sharedRecipientMap: Record<string, Profile> = {};
  sharedRecipientProfiles.forEach((p) => (sharedRecipientMap[p.user_id] = p));

  // Selected grocery list view: "mine" or shared item id
  const [selectedListId, setSelectedListId] = useState<string>("mine");
  const selectedSharedList = useMemo(
    () => sharedGroceriesWithMe.find(s => s.id === selectedListId),
    [selectedListId, sharedGroceriesWithMe]
  );
  const selectedListOwnerId = selectedSharedList?.from_user_id || myUserId || undefined;
  const isViewingShared = selectedListId !== "mine" && !!selectedSharedList;

  // Live grocery items for whichever list is selected
  const { data: groceryItems = [] } = useGroceryItems(selectedListOwnerId);
  const addGroceryItem = useAddGroceryItem(selectedListOwnerId);
  const clearChecked = useClearCheckedGroceryItems(selectedListOwnerId);
  useRealtimeGroceryList(selectedListOwnerId);

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
                                  <div className="flex gap-2 pt-1 items-center">
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
                                    <ShareWithFriends
                                      itemType="meal"
                                      itemId={meal.id}
                                      defaultMessage={meal.title}
                                      compact
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add button */}
          <button
            onClick={() => { setEditingMeal(null); setShowForm(true); }}
            className="w-full py-3 rounded-xl border border-dashed border-border/50 text-xs font-body text-muted-foreground hover:text-foreground hover:border-border hover:bg-secondary/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add meal
          </button>

          {/* Meal form drawer */}
          <Drawer open={showForm} onOpenChange={(o) => (o ? setShowForm(true) : resetForm())}>
            <DrawerContent className="px-4 pb-6 max-h-[90vh] overflow-y-auto">
              <DrawerHeader className="px-0 flex flex-row items-center justify-between">
                <DrawerTitle className="text-base font-body font-medium">
                  {editingMeal ? "Edit Meal" : "New Meal"}
                </DrawerTitle>
                <DrawerClose asChild>
                  <button className="text-muted-foreground hover:text-foreground p-1">
                    <X className="w-4 h-4" />
                  </button>
                </DrawerClose>
              </DrawerHeader>
              <div className="space-y-3">
                {renderForm()}
              </div>
            </DrawerContent>
          </Drawer>
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

      {/* ─── GROCERY VIEW ─── */}
      {view === "grocery" && (
        <>
          <div className="space-y-3">
            {/* List selector */}
            {sharedGroceriesWithMe.length > 0 && (
              <div className="flex gap-1.5 flex-wrap items-center">
                <button
                  onClick={() => setSelectedListId("mine")}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-body transition-all ${
                    selectedListId === "mine"
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🛒 My list
                </button>
                {sharedGroceriesWithMe.map((s) => {
                  const sender = sharedRecipientMap[s.from_user_id];
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedListId(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-body transition-all ${
                        selectedListId === s.id
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      📬 {sender?.display_name || "Friend"}
                    </button>
                  );
                })}
              </div>
            )}

            {isViewingShared && selectedSharedList && (
              <div className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs font-body text-foreground">
                  📬 Shared by {sharedRecipientMap[selectedSharedList.from_user_id]?.display_name || "a friend"}
                </p>
                <p className="text-[10px] font-body text-muted-foreground mt-0.5">
                  Changes you make sync live with everyone on this list.
                </p>
              </div>
            )}

            <>

            {/* Add item form */}
            <div className="flex gap-2">
              <input
                value={groceryName}
                onChange={(e) => setGroceryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && groceryName.trim()) {
                    addGroceryItem.mutate({ name: groceryName.trim(), category: groceryCategory });
                    setGroceryName("");
                  }
                }}
                placeholder="Add item..."
                className="flex-1 bg-secondary/30 rounded-xl px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 outline-none border border-border/30 focus:border-primary/30"
              />
              <button
                onClick={() => {
                  if (groceryName.trim()) {
                    addGroceryItem.mutate({ name: groceryName.trim(), category: groceryCategory });
                    setGroceryName("");
                  }
                }}
                disabled={!groceryName.trim()}
                className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-body font-medium disabled:opacity-40 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Category selector */}
            <div className="flex gap-1.5 flex-wrap">
              {GROCERY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setGroceryCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-body capitalize transition-all ${
                    groceryCategory === cat
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {CATEGORY_EMOJIS[cat]} {cat}
                </button>
              ))}
            </div>

            {/* Items grouped by category */}
            {groceryItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm font-body text-muted-foreground/50">Your grocery list is empty</p>
              </div>
            ) : (
              <>
                {Object.entries(
                  groceryItems.reduce<Record<string, typeof groceryItems>>((acc, item) => {
                    const cat = item.category || "other";
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(item);
                    return acc;
                  }, {})
                ).map(([category, items]) => (
                  <div key={category}>
                    <p className="text-xs font-body font-medium text-muted-foreground mb-1.5 capitalize flex items-center gap-1">
                      {CATEGORY_EMOJIS[category] || "📦"} {category}
                    </p>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={`flex items-center gap-2 bg-secondary/30 rounded-xl px-3 py-2.5 transition-colors ${
                            item.checked ? "opacity-50" : ""
                          }`}
                        >
                          <button
                            onClick={() => toggleGroceryItem.mutate({ id: item.id, checked: !item.checked })}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              item.checked
                                ? "bg-primary border-primary"
                                : "border-border/50 hover:border-primary/50"
                            }`}
                          >
                            {item.checked && <Check className="w-3 h-3 text-primary-foreground" />}
                          </button>
                          <span className={`flex-1 text-sm font-body ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {item.name}
                          </span>
                          <button
                            onClick={() => deleteGroceryItem.mutate(item.id)}
                            className="text-muted-foreground/40 hover:text-destructive transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Clear checked */}
                {groceryItems.some((i) => i.checked) && (
                  <button
                    onClick={() => clearChecked.mutate()}
                    className="w-full py-2 rounded-xl text-[11px] font-body text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                  >
                    Clear checked items
                  </button>
                )}
              </>
            )}

            {/* Shared grocery indicators */}
            {!isViewingShared && groceryShares.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-body font-medium text-muted-foreground flex items-center gap-1">
                  <Share2 className="w-3 h-3" /> Shared with
                </p>
                {groceryShares.map((share) => {
                  const p = sharedRecipientMap[share.to_user_id];
                  return (
                    <div key={share.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-body">
                        {p?.display_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-xs font-body text-foreground flex-1">{p?.display_name || "Friend"}</span>
                      <span className="text-[10px] font-body text-muted-foreground">
                        {new Date(share.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Share grocery list */}
            {!isViewingShared && groceryItems.length > 0 && friendUserIds.length > 0 && myUserId && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowShareGrocery(!showShareGrocery)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/5 text-primary text-xs font-body font-medium hover:bg-primary/10 transition-all border border-primary/10"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share grocery list with a friend
                </button>
                <AnimatePresence>
                  {showShareGrocery && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      {friendUserIds.map((fid) => {
                        const p = friendProfileMap[fid];
                        return (
                          <button
                            key={fid}
                            onClick={() => {
                              shareItem.mutate(
                                { to_user_id: fid, item_type: "grocery_list", item_id: myUserId! },
                                {
                                  onSuccess: () => { toast.success(`Shared with ${p?.display_name || "friend"}!`); setShowShareGrocery(false); },
                                  onError: (err: any) => toast.error(err?.message || "Couldn't share — try again"),
                                }
                              );
                            }}
                            disabled={shareItem.isPending}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors disabled:opacity-50"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-body">
                              {p?.display_name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="text-sm font-body text-foreground">{p?.display_name || "Friend"}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* No friends hint */}
            {!isViewingShared && groceryItems.length > 0 && friendUserIds.length === 0 && (
              <p className="text-center text-[11px] font-body text-muted-foreground/50 py-2">
                Add friends in Profile to share your grocery list 👥
              </p>
            )}
            </>

          </div>
        </>
      )}
    </motion.div>
  );
};

export default MealSection;
