import { Link } from "react-router-dom";
import { Moon, Sun, Plus, Sword } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import Button from "./ui/Button.jsx";

export default function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-parchment-deep/95 backdrop-blur border-b border-parchment-edge px-4 py-2 flex items-center justify-between gap-4">
      <Link to="/" className="flex items-center gap-2 no-underline">
        <Sword size={20} className="text-burgundy" />
        <span className="font-display text-sm uppercase tracking-widest text-ink">InnKeeper</span>
      </Link>

      <div className="flex items-center gap-2">
        <Link to="/new">
          <Button size="sm" icon={<Plus size={14} />}>Nova Ficha</Button>
        </Link>
        <button
          onClick={toggle}
          className="text-ink-muted hover:text-ink transition p-1.5 rounded-sheet hover:bg-parchment-edge/40"
          title={theme === "dark" ? "Tema claro" : "Tema escuro"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
