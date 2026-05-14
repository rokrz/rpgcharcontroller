import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Save } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import { SYSTEMS } from "../systems/index.js";
import { api } from "../services/api.js";
import { toNativeJson, toBookerJson, downloadJson } from "../services/exportService.js";
import { useActiveSheet } from "../context/ActiveSheetContext.jsx";

const Dnd5eSheet       = lazy(() => import("../systems/dnd5e/Dnd5eSheet.jsx"));
const Pf2eSheet        = lazy(() => import("../systems/pf2e/Pf2eSheet.jsx"));
const DaggerheartSheet = lazy(() => import("../systems/daggerheart/DaggerheartSheet.jsx"));

const SHEET_COMPONENTS = {
  dnd5e:       Dnd5eSheet,
  pf2e:        Pf2eSheet,
  daggerheart: DaggerheartSheet,
};

export default function SheetPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);
  const { setExportHandlers } = useActiveSheet();

  useEffect(() => {
    api.getSheet(id)
      .then(setSheet)
      .catch(() => setError("Ficha não encontrada."))
      .finally(() => setLoading(false));
  }, [id]);

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
  }

  function handleExportBooker() {
    const slug = (sheet.data?.name || "personagem").toLowerCase().replace(/\s+/g, "-");
    downloadJson(`${slug}.booker.json`, toBookerJson(sheet));
  }

  function handlePrint() {
    window.open(`/sheet/${id}/print`, "_blank");
  }

  useEffect(() => {
    if (!sheet) return;
    setExportHandlers({
      native: handleExportNative,
      booker: handleExportBooker,
      print:  handlePrint,
    });
    return () => setExportHandlers(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet, setExportHandlers]);

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
      <div
        data-tutorial="sheet-export"
        className="sticky top-[49px] z-30 bg-parchment-deep/95 backdrop-blur border-b border-parchment-edge px-4 py-2 flex items-center gap-3"
      >
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
      </div>

      {SheetComponent ? (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-ink-muted font-serif italic">Carregando ficha...</p></div>}>
          <div data-tutorial="sheet-content">
            <SheetComponent data={sheet.data} onUpdate={handleUpdate} />
          </div>
        </Suspense>
      ) : (
        <div className="p-8 text-center text-ink-muted font-serif italic">
          Sistema "{sheet.system}" não suportado.
        </div>
      )}
    </div>
  );
}
