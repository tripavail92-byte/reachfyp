"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "reachfyp-theme";

type ThemeMode = "light" | "dark";

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: ThemeMode) {
  window.localStorage.setItem(STORAGE_KEY, theme);
  window.document.documentElement.dataset.theme = theme;
  window.document.body.dataset.theme = theme;
}

export function ThemeToggleButton() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    setTheme(preferredTheme);
    applyTheme(preferredTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const isDark = theme === "dark";

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme}>
      <span aria-hidden="true" className="theme-toggle__icon">
        {isDark ? "sun" : "moon"}
      </span>
      <span>{isDark ? "Switch to light" : "Switch to dark"}</span>
    </button>
  );
}
