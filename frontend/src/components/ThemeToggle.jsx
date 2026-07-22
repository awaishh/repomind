import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ theme, setTheme, compact = false }) {
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className={`theme-toggle ${compact ? "theme-toggle-compact" : ""}`}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      title={`Switch to ${isLight ? "dark" : "light"} theme`}
    >
      <Sun className="theme-toggle-icon theme-toggle-sun" aria-hidden="true" />
      <Moon className="theme-toggle-icon theme-toggle-moon" aria-hidden="true" />
      {!compact && <span>{isLight ? "Light" : "Dark"}</span>}
    </button>
  );
}
