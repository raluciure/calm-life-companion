import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Check } from "lucide-react";
import { useTodos, useAddTodo, useToggleTodo, useDeleteTodo, useClearCompletedTodos } from "@/hooks/useTodos";

const TodosSection = () => {
  const { data: todos = [], isLoading } = useTodos();
  const addTodo = useAddTodo();
  const toggleTodo = useToggleTodo();
  const deleteTodo = useDeleteTodo();
  const clearCompleted = useClearCompletedTodos();
  const [text, setText] = useState("");

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t) return;
    addTodo.mutate(t);
    setText("");
  };

  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center space-y-1">
        <h1 className="text-xl sm:text-2xl font-display font-light text-foreground">
          ✅ To-do List
        </h1>
        <p className="text-sm font-body text-muted-foreground">
          A gentle place for things to remember
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="flex items-center gap-2 rounded-2xl border border-border bg-card/50 p-2"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a to-do…"
          className="flex-1 bg-transparent px-3 py-2 text-sm font-body text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="inline-flex items-center gap-1 rounded-xl bg-primary/15 px-3 py-2 text-xs font-body font-medium text-primary transition-all hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </form>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-secondary/40 animate-gentle-pulse" />
          ))}
        </div>
      ) : todos.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground/60 font-body italic py-8">
          Nothing on your list — enjoy the calm 🌿
        </p>
      ) : (
        <div className="space-y-3">
          {open.length > 0 && (
            <div className="space-y-1.5">
              <AnimatePresence initial={false}>
                {open.map((t) => (
                  <TodoRow
                    key={t.id}
                    title={t.title}
                    done={false}
                    onToggle={() => toggleTodo.mutate({ id: t.id, done: true })}
                    onDelete={() => deleteTodo.mutate(t.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {done.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-body text-muted-foreground">
                  Completed · {done.length}
                </p>
                <button
                  type="button"
                  onClick={() => clearCompleted.mutate()}
                  className="text-[11px] font-body text-muted-foreground transition-colors hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              <AnimatePresence initial={false}>
                {done.map((t) => (
                  <TodoRow
                    key={t.id}
                    title={t.title}
                    done
                    onToggle={() => toggleTodo.mutate({ id: t.id, done: false })}
                    onDelete={() => deleteTodo.mutate(t.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const TodoRow = ({
  title,
  done,
  onToggle,
  onDelete,
}: {
  title: string;
  done: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -8, height: 0, marginTop: 0 }}
    transition={{ duration: 0.2 }}
    className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 px-3 py-2.5"
  >
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
        done
          ? "border-primary bg-primary text-primary-foreground"
          : "border-muted-foreground/40 hover:border-primary/60"
      }`}
    >
      {done && <Check className="h-3 w-3" />}
    </button>
    <span
      className={`flex-1 text-sm font-body transition-all ${
        done ? "text-muted-foreground line-through" : "text-foreground"
      }`}
    >
      {title}
    </span>
    <button
      type="button"
      onClick={onDelete}
      className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:text-destructive"
      aria-label="Delete to-do"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  </motion.div>
);

export default TodosSection;
