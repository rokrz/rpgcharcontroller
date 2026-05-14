import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, MoreHorizontal, Plus, Upload, FileJson, Printer, BookOpen } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import { useActiveSheet } from "../context/ActiveSheetContext.jsx";
import { useTutorial } from "../context/TutorialContext.jsx";
import { api } from "../services/api.js";
import { parseImportFile } from "../services/importService.js";

export default function Header() {
  const { theme, toggle } = useTheme();
  const { exportHandlers } = useActiveSheet();
  const { startTutorial } = useTutorial();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    setImporting(true);
    setOpen(false);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const sheets = parseImportFile(json);

      const created = await Promise.all(
        sheets.map((s) => api.createSheet({ system: s.system, data: s.data }))
      );

      if (created.length === 1) {
        navigate(`/sheet/${created[0].id}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      alert(err.message || "Erro ao importar o arquivo.");
    } finally {
      setImporting(false);
    }
  }

  function handleMenuExport(key) {
    setOpen(false);
    exportHandlers?.[key]?.();
  }

  function handleTutorial() {
    setOpen(false);
    startTutorial();
  }

  return (
    <header className="sticky top-0 z-40 bg-parchment-deep/95 backdrop-blur border-b border-parchment-edge px-4 py-2 flex items-center justify-between gap-4">
      <Link to="/" className="flex items-center gap-2 no-underline">
        <img src="/icon.png" alt="InnKeeper" className="w-6 h-6 rounded-sm object-cover" />
        <span className="font-display text-sm uppercase tracking-widest text-ink">InnKeeper</span>
      </Link>

      <div className="flex items-center gap-2">
        {/* Options menu */}
        <div className="relative" ref={menuRef}>
          <button
            data-tutorial="header-options"
            onClick={() => setOpen((v) => !v)}
            disabled={importing}
            className="flex items-center gap-1 text-xs font-display uppercase tracking-widest text-ink-muted hover:text-ink transition px-2 py-1.5 rounded border border-transparent hover:border-parchment-edge disabled:opacity-50"
            title="Opções"
          >
            <MoreHorizontal size={16} />
            {importing ? "Importando…" : "Opções"}
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-56 bg-parchment-deep border border-parchment-edge rounded-sheet shadow-page z-50 py-1"
            >
              {/* Nova Ficha */}
              <Link
                to="/new"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-serif text-ink hover:bg-parchment-edge/30 transition no-underline"
              >
                <Plus size={13} className="text-gold shrink-0" />
                <span className="font-semibold">Nova Ficha</span>
              </Link>

              {/* Importar */}
              <button
                role="menuitem"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-serif text-ink hover:bg-parchment-edge/30 transition text-left"
              >
                <Upload size={13} className="text-gold shrink-0" />
                <span>
                  <span className="block font-semibold">Importar JSON…</span>
                  <span className="text-ink-muted">InnKeeper ou Booker</span>
                </span>
              </button>

              {/* Export options — só aparecem quando há uma ficha ativa */}
              {exportHandlers && (
                <>
                  <div className="border-t border-parchment-edge/50 my-1" />

                  <button
                    role="menuitem"
                    onClick={() => handleMenuExport("native")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-serif text-ink hover:bg-parchment-edge/30 transition text-left"
                  >
                    <FileJson size={13} className="text-gold shrink-0" />
                    <span>
                      <span className="block font-semibold">Exportar JSON</span>
                      <span className="text-ink-muted">Formato InnKeeper</span>
                    </span>
                  </button>

                  <button
                    role="menuitem"
                    onClick={() => handleMenuExport("booker")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-serif text-ink hover:bg-parchment-edge/30 transition text-left"
                  >
                    <FileJson size={13} className="text-burgundy shrink-0" />
                    <span>
                      <span className="block font-semibold">Exportar para Booker</span>
                      <span className="text-ink-muted">Compatível com Tracker</span>
                    </span>
                  </button>

                  <button
                    role="menuitem"
                    onClick={() => handleMenuExport("print")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-serif text-ink hover:bg-parchment-edge/30 transition text-left"
                  >
                    <Printer size={13} className="text-ink-muted shrink-0" />
                    <span>
                      <span className="block font-semibold">Exportar PDF</span>
                      <span className="text-ink-muted">Abre diálogo de impressão</span>
                    </span>
                  </button>
                </>
              )}

              <div className="border-t border-parchment-edge/50 my-1" />

              {/* Tutorial */}
              <button
                role="menuitem"
                onClick={handleTutorial}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-serif text-ink hover:bg-parchment-edge/30 transition text-left"
              >
                <BookOpen size={13} className="text-ink-muted shrink-0" />
                <span className="font-semibold">Mostrar tutorial</span>
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />

        {/* Theme toggle */}
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
