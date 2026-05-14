import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Download, FileJson, Printer, ChevronDown } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import { SYSTEMS } from "../systems/index.js";
import { api } from "../services/api.js";
import { toNativeJson, toBookerJson, downloadJson } from "../services/exportService.js";

const Dnd5eSheet       = lazy(() => import("../systems/dnd5e/Dnd5eSheet.jsx"));
const Pf2eSheet        = lazy(() => import("../systems/pf2e/Pf2eSheet.jsx"));
const DaggerheartSheet = lazy(() => import("../systems/daggerheart/DaggerheartSheet.jsx"));

import { lazy, Suspense } from "react";

const SHEET_COMPONENTS = {
  dnd5e:       Dnd5eSheet,
  pf2e:        Pf2eSheet,
  daggerheart: DaggerheartSheet,
};

export default function SheetPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [sheet, setSheet]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [saving, setSaving]         = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const saveTimer    = useRef(null);
  const exportRef    = useRef(null);

  useEffect(() => {
    api.getSheet(id)
      .then(setSheet)
      .catch(() => setError("Ficha não encontrada."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!exportOpen) return;
    function handleClick(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [exportOpen]);

  function handleUpdate(newData) {
    setSheet((prev) => ({ ...prev, data: newData }));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try { await api.updateSheet(id, { data: newData }); }
      finally { setSaving(false); }
    }, 800);
  }

  function handleExportNative() {
    const slug = (sheet.data?.name || "personagem").toLowerCase().replace(/\s+/g, "-");
    downloadJson(`${slug}.innkeeper.json`, toNativeJson(sheet));
    setExportOpen(false);
  }

  function handleExportBooker() {
    const slug = (sheet.data?.name || "personagem").toLowerCase().replace(/\s+/g, "-");
    downloadJson(`${slug}.booker.json`, toBookerJson(sheet));
    setExportOpen(false);
  }

  function handlePrint() {
    window.open(`/sheet/${id}/print`, "_blank");
    setExportOpen(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-ink-muted font-serif italic">Carregando ficha...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-burgundy font-serif mb-4">{error}</p>
      <Button variant="ghost" onClick={() => navigate("/")}>Voltar</Button>
    </div>
  );

  const sys = SYSTEMS[sheet.system] || { label: sheet.system, badge: "neutral" };
  const SheetComponent = SHEET_COMPONENTS[sheet.system];

  return (
    <div className="min-h-full flex flex-col">
      <div className="sticky top-[49px] z-30 bg-parchment-deep/95 backdrop-blur border-b border-parchment-edge px-4 py-2 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-ink-muted hover:text-ink transition">
          <ChevronLeft size={18} />
        </button>
        <Badge tone={sys.badge}>{sys.label}</Badge>
        <span className="font-display text-sm text-ink truncate flex-1">{sheet.data?.name || "Sem nome"}</span>

        {saving && (
          <span className="text-[10px] text-ink-muted font-display uppercase tracking-widest flex items-center gap-1">
            <Save size={10} className="animate-pulse" /> Salvando
          </span>
        )}

        {/* Export dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen((v) => !v)}
            className="flex items-center gap-1 text-xs font-display uppercase tracking-widest text-ink-muted hover:text-ink transition px-2 py-1 rounded border border-transparent hover:border-parchment-edge"
          >
            <Download size={13} />
            Exportar
            <ChevronDown size={11} className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
          </button>

          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-parchment-deep border border-parchment-edge rounded-sheet shadow-lg z-50 py-1">
              <button
                onClick={handleExportNative}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-serif text-ink hover:bg-parchment-edge/30 transition text-left"
              >
                <FileJson size={13} className="text-gold shrink-0" />
                <span>
                  <span className="block font-semibold">Exportar JSON</span>
                  <span className="text-ink-muted">Formato RPGChar</span>
                </span>
              </button>
              <button
                onClick={handleExportBooker}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-serif text-ink hover:bg-parchment-edge/30 transition text-left"
              >
                <FileJson size={13} className="text-burgundy shrink-0" />
                <span>
                  <span className="block font-semibold">Exportar para Booker</span>
                  <span className="text-ink-muted">Compatível com Tracker</span>
                </span>
              </button>
              <div className="border-t border-parchment-edge/50 my-1" />
              <button
                onClick={handlePrint}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-serif text-ink hover:bg-parchment-edge/30 transition text-left"
              >
                <Printer size={13} className="text-ink-muted shrink-0" />
                <span>
                  <span className="block font-semibold">Exportar PDF</span>
                  <span className="text-ink-muted">Abre diálogo de impressão</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {SheetComponent ? (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-ink-muted font-serif italic">Carregando ficha...</p></div>}>
          <SheetComponent data={sheet.data} onUpdate={handleUpdate} />
        </Suspense>
      ) : (
        <div className="p-8 text-center text-ink-muted font-serif italic">
          Sistema "{sheet.system}" não suportado.
        </div>
      )}
    </div>
  );
}
