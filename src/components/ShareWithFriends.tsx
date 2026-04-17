import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFriends, useProfilesByIds, useShareItem, type Profile } from "@/hooks/useProfile";

interface ShareWithFriendsProps {
  itemType: "meal" | "workout" | "grocery_list";
  itemId: string;
  defaultMessage?: string;
  /** Optional label override for the trigger */
  label?: string;
  /** Compact icon-only trigger when true */
  compact?: boolean;
}

/**
 * Inline share trigger + friend picker. Opens a small panel listing the
 * current user's friends. Tapping a friend shares the item.
 */
const ShareWithFriends = ({
  itemType,
  itemId,
  defaultMessage,
  label = "Share",
  compact = false,
}: ShareWithFriendsProps) => {
  const [open, setOpen] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const { data: friends = [] } = useFriends();
  const shareItem = useShareItem();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setMyUserId(user?.id || null));
  }, []);

  const friendUserIds = useMemo(() => {
    if (!myUserId) return [];
    return friends
      .map((f) => (f.requester_id === myUserId ? f.addressee_id : f.requester_id))
      .filter(Boolean);
  }, [friends, myUserId]);

  const { data: friendProfiles = [] } = useProfilesByIds(friendUserIds);
  const friendMap = useMemo(() => {
    const m: Record<string, Profile> = {};
    friendProfiles.forEach((p) => (m[p.user_id] = p));
    return m;
  }, [friendProfiles]);

  const handleShare = (toUserId: string, name?: string) => {
    shareItem.mutate(
      { to_user_id: toUserId, item_type: itemType, item_id: itemId, message: defaultMessage },
      {
        onSuccess: () => {
          toast.success(`Shared with ${name || "friend"}!`);
          setOpen(false);
        },
        onError: (err: any) => toast.error(err?.message || "Couldn't share — try again"),
      }
    );
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={
          compact
            ? "text-[10px] font-body text-primary/70 hover:text-primary flex items-center gap-0.5"
            : "text-xs font-body text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
        }
      >
        <Share2 className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} /> {label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl bg-card border border-border shadow-lg p-2 space-y-1"
          >
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[11px] font-body font-medium text-muted-foreground">
                Share with…
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {friendUserIds.length === 0 ? (
              <p className="text-[11px] font-body text-muted-foreground/60 italic px-2 py-3 text-center">
                Add friends in Profile to share 👥
              </p>
            ) : (
              friendUserIds.map((fid) => {
                const p = friendMap[fid];
                return (
                  <button
                    key={fid}
                    disabled={shareItem.isPending}
                    onClick={() => handleShare(fid, p?.display_name)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors disabled:opacity-50 text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-body shrink-0">
                      {p?.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-xs font-body text-foreground truncate">
                      {p?.display_name || "Friend"}
                    </span>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareWithFriends;
