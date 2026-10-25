import { useTheme } from "@hooks/useTheme";
import { Z_INDEX } from "@constants/theme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="fixed top-3 right-3 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm dark:border-slate-600 dark:bg-slate-900"
      style={{ zIndex: Z_INDEX.globalControls }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
