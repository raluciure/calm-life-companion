import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Loader2 } from "lucide-react";
import SharedItemDialog from "./SharedItemDialog";
import { openSharedGrocery } from "@/lib/sharedNav";
import type { Profile, SharedItem } from "@/hooks/useProfile";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friend: Profile | null;
}

const typeLabels: Record<string, { emoji: string; label: string }> = {
  workout: { emoji: "💪", label: "Workout" },
  meal: { emoji: "🍽️", label: "Meal" },
  item: { emoji: "📋", label: "Task" },
  grocery_list: { emoji: "🛒", label: "Grocery list" },
};

const FriendProfileDialog = ({ open, onOpenChange, friend }: Props) => {
  const [openItem, setOpenItem] = useState<{ type: string; id: string } | null>(null);

  const { data: sharedFromFriend = [], isLoading } = useQuery({
    queryKey: ["shared_from_friend", friend?.user_id],
    queryFn: async () => {
      if (!friend) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("shared_items")
        .select("*")
        .eq("from_user_id", friend.user_id)
        .eq("to_user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SharedItem[];
    },
    enabled: open && !!friend,
  });

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-display text-primary">
                {friend?.display_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <DrawerTitle className="font-display font-light text-lg">
                  {friend?.display_name || "Friend"}
                </DrawerTitle>
                <p className="text-xs font-body text-muted-foreground">Friend</p>
              </div>
            </div>
            <DrawerClose />
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto">
            <p className="text-xs font-body text-muted-foreground px-1 mb-2">
              Shared with you
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : sharedFromFriend.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground/60 font-body italic py-8">
                {friend?.display_name || "They"} hasn't shared anything with you yet 📭
              </p>
            ) : (
              <div className="space-y-2">
                {sharedFromFriend.map((item) => {
                  const t = typeLabels[item.item_type] || { emoji: "📎", label: item.item_type };
                  const handleOpen = () => {
                    if (item.item_type === "grocery_list") {
                      onOpenChange(false);
                      openSharedGrocery(item.id);
                    } else {
                      setOpenItem({ type: item.item_type, id: item.item_id });
                    }
                  };
                  return (
                    <button
                      key={item.id}
                      onClick={handleOpen}
                      className="w-full text-left p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors flex items-center gap-2"
                    >
                      <span className="text-lg">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body text-foreground">{t.label}</p>
                        {item.message && (
                          <p className="text-xs font-body text-muted-foreground truncate">
                            "{item.message}"
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {openItem && (
        <SharedItemDialog
          open={!!openItem}
          onOpenChange={(o) => !o && setOpenItem(null)}
          itemType={openItem.type as any}
          itemId={openItem.id}
          senderName={friend?.display_name}
        />
      )}
    </>
  );
};

export default FriendProfileDialog;
