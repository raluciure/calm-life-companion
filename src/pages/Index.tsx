import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import AuthGate from "@/components/AuthGate";
import HomeFeed from "@/components/HomeFeed";
import DailyLife from "@/components/DailyLife";
import ProfileSection from "@/components/ProfileSection";
import { motion } from "framer-motion";
import { Home, Leaf, User } from "lucide-react";

type AppSection = "home" | "daily" | "profile";

import { onOpenSharedGrocery } from "@/lib/sharedNav";

const MainApp = () => {
  const [section, setSection] = useState<AppSection>("home");

  useEffect(() => {
    return onOpenSharedGrocery(() => setSection("daily"));
  }, []);

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="max-w-md mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-5 sm:space-y-6 pb-24">
        {section === "home" && <HomeFeed />}
        {section === "daily" && <DailyLife />}
        {section === "profile" && <ProfileSection />}
      </div>

      {/* Bottom Navigation — 3 tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border/50">
        <div className="max-w-md mx-auto flex pb-[env(safe-area-inset-bottom)]">
          {([
            { key: "home" as const, icon: Home, label: "Home" },
            { key: "daily" as const, icon: Leaf, label: "Daily Life" },
            { key: "profile" as const, icon: User, label: "Profile" },
          ]).map((nav) => (
            <button
              key={nav.key}
              onClick={() => setSection(nav.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors
                ${section === nav.key ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
            >
              <nav.icon className="w-5 h-5" />
              <span className="text-[10px] font-body font-medium">{nav.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[100svh] bg-background flex items-center justify-center">
        <p className="text-muted-foreground/50 font-display text-lg animate-gentle-pulse">hush</p>
      </div>
    );
  }

  if (!session) return <AuthGate>{null}</AuthGate>;

  return <MainApp />;
};

export default Index;
