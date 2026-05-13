import { useEffect, useState, useCallback } from "react";

export type FeatureKey = "schedule" | "todos" | "health" | "meds" | "period" | "gym" | "meals";

const STORAGE_KEY = "enabled_features_v1";

const DEFAULTS: Record<FeatureKey, boolean> = {
  schedule: true,
  todos: true,
  health: true,
  meds: true,
  period: true,
  gym: true,
  meals: true,
};

const read = (): Record<FeatureKey, boolean> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
};

const EVT = "features-changed";

export const useFeatures = () => {
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(read);

  useEffect(() => {
    const handler = () => setFeatures(read());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const toggle = useCallback((key: FeatureKey, value: boolean) => {
    const next = { ...read(), [key]: value };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setFeatures(next);
    window.dispatchEvent(new Event(EVT));
  }, []);

  return { features, toggle };
};
