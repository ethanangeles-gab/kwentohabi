import { useEffect, useRef, useState } from "react";

export type Theme = "light" | "dark";
const key = "kwentohabi-theme";
function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(key);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}
function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => savedTheme() || systemTheme(),
  );
  const [persisted, setPersisted] = useState(true);
  const explicitChoice = useRef(savedTheme() !== null);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#1c130f" : "#fff8ed");
  }, [theme]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setTheme(savedTheme() || systemTheme());
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        explicitChoice.current = savedTheme() !== null;
        sync();
        setPersisted(true);
      }
    };
    const onSystemChange = () => {
      if (!explicitChoice.current) sync();
    };
    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const chooseTheme = (next: Theme) => {
    explicitChoice.current = true;
    setTheme(next);
    try {
      localStorage.setItem(key, next);
      setPersisted(true);
    } catch {
      setPersisted(false);
    }
  };
  return { theme, chooseTheme, persisted };
}
