import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
    } else if (isSignUp) {
      setSuccessMessage("Check your email for a confirmation link to activate your account ✉️");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-light text-foreground">hush</h1>
          <p className="text-sm font-body text-muted-foreground">
            Your calm daily companion
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground font-body text-[15px] placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 focus:shadow-sm transition-all"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground font-body text-[15px] placeholder:text-muted-foreground/60 outline-none focus:border-primary/30 focus:shadow-sm transition-all"
          />

          {error && (
            <p className="text-sm text-destructive font-body text-center">{error}</p>
          )}
          {successMessage && (
            <p className="text-sm text-primary font-body text-center">{successMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-center text-sm font-body text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </motion.div>
    </div>
  );
};

export default AuthGate;
